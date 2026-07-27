// Reservation is a Requisition that stops after approve() (which performs
// the real BloodUnit RESERVE transition) — no issue/complete step is ever
// surfaced here. Built directly on features/requisition/api.js (the v2
// TanStack-oriented layer) rather than the legacy imperative service, since
// this is new code with no existing consumer to stay compatible with —
// the first full example of the "no axios in components" pattern for this
// feature area.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { requisitionApi } from '@/features/requisition/api';
import { useHospitalList, useCreateHospital } from '@/features/hospital/queries';
import {
  defaultPatient,
  defaultRequestedComponent,
  buildPatientPayload,
} from '@/features/requisition/pages/hooks/requisition-defaults';
import { checkHasChanges } from '@/features/requisition/pages/hooks/dirty-tracking';

export { defaultPatient, defaultRequestedComponent };

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export default function useReservationWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const { data: hospitalsPage, isLoading: hospitalsLoading } = useHospitalList({ limit: 100 });
  // HospitalSelect (shared with the legacy Requisition flow) reads `_id`,
  // but the v2 hospital API's HospitalDto uses `id` — without this, every
  // <option> loses its value and the browser submits the visible hospital
  // name instead of its ObjectId, failing hospitalId validation server-side.
  const hospitals = useMemo(() => {
    const raw = hospitalsPage?.items || hospitalsPage?.data || (Array.isArray(hospitalsPage) ? hospitalsPage : []) || [];
    return raw.map((h) => ({ ...h, _id: h._id || h.id }));
  }, [hospitalsPage]);
  const createHospital = useCreateHospital();

  const [addHospitalOpen, setAddHospitalOpen] = useState(false);
  const [addHospitalForm, setAddHospitalForm] = useState({ name: '', address: '', contactPerson: '', phone: '' });

  const [form, setForm] = useState({
    hospitalId: '',
    doctorName: '',
    reservedUntil: '',
    patient: { ...defaultPatient },
    requestedComponents: [{ ...defaultRequestedComponent }],
  });

  const [requestDoc, setRequestDoc] = useState(null);
  const [matching, setMatching] = useState(false);
  const [matchedResult, setMatchedResult] = useState(null);
  const [shortages, setShortages] = useState(null);
  const [approving, setApproving] = useState(false);
  const [crossmatchUpdating, setCrossmatchUpdating] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [groupingSaving, setGroupingSaving] = useState(false);

  const addRequestLine = () => {
    setForm((prev) => ({
      ...prev,
      requestedComponents: [...prev.requestedComponents, { ...defaultRequestedComponent }],
    }));
  };
  const removeRequestLine = (idx) => {
    setForm((prev) => ({
      ...prev,
      requestedComponents: prev.requestedComponents.filter((_, i) => i !== idx),
    }));
  };

  const handleCreateHospital = async () => {
    if (!addHospitalForm.name || !addHospitalForm.address || !addHospitalForm.contactPerson || !addHospitalForm.phone) {
      toast.error('Fill all hospital fields');
      return;
    }
    try {
      const created = await createHospital.mutateAsync(addHospitalForm);
      toast.success('Hospital added');
      setForm((p) => ({ ...p, hospitalId: created?.id || created?._id || p.hospitalId }));
      setAddHospitalOpen(false);
      setAddHospitalForm({ name: '', address: '', contactPerson: '', phone: '' });
    } catch (e) {
      toast.error(e?.message || 'Failed to add hospital');
    }
  };

  const refreshRequest = async (id) => {
    try {
      const data = await requisitionApi.detail(id);
      setRequestDoc(data);
    } catch {
      // best-effort refresh
    }
  };

  const handleMatch = async (id = requestDoc?._id) => {
    if (!id) return;
    setMatching(true);
    try {
      const data = await requisitionApi.match(id);
      const partialShortages = data?.shortages;
      if (Array.isArray(partialShortages) && partialShortages.length > 0) {
        setShortages(partialShortages);
        toast.warning(
          `Partial match: ${partialShortages.map((s) => `${s.componentType} unavailable`).join(', ')}. Proceeding with available components.`,
        );
      } else {
        setShortages(null);
        toast.success('Matched and reserved');
      }
      setMatchedResult(data);
      await refreshRequest(id);
    } catch (e) {
      const sh = e?.details?.shortages;
      if (Array.isArray(sh) && sh.length) {
        setShortages(sh);
        const s0 = sh[0];
        toast.error(`Insufficient stock: ${s0.available} of ${s0.required} ${s0.componentType} available`);
      } else {
        setShortages(null);
        toast.error(e?.message || 'Matching failed');
      }
      setMatchedResult(null);
      await refreshRequest(id);
    } finally {
      setMatching(false);
    }
  };

  // Same payload shape whether creating or updating — reused by handleCreate
  // and the hasChanges dirty-check below, mirroring useRequisition.js.
  const buildPayload = () => ({
    purpose: 'RESERVATION',
    hospitalId: form.hospitalId,
    // clinicianName is required by the backend even though "Doctor's
    // Name" is optional in this UI — fall back to a fixed label rather
    // than relying on the controller's doctorName->clinicianName mirror
    // (which only fires when doctorName is non-empty).
    clinicianName: form.doctorName || 'Reserve Wizard',
    doctorName: form.doctorName || undefined,
    requiredAt: form.reservedUntil || undefined,
    patient: buildPatientPayload(form.patient),
    requestedComponents: form.requestedComponents.map((r) => ({
      componentType: r.componentType,
      units: Number(r.units),
      bloodGroup: r.bloodGroup,
      rh: r.rh,
      urgency: r.urgency,
      compatibilityMode: r.compatibilityMode || 'UNIVERSAL',
    })),
  });

  // Mirrors useRequisition.js's handleCreate: first click creates the
  // reservation request; once created, the same button (relabelled
  // "Update Changes" in the UI) re-submits edits via update() and
  // re-runs match, rather than creating a second requisition.
  const handleCreate = async () => {
    if (!form.hospitalId) return toast.error('Select hospital');
    if (!form.patient.name || !form.patient.age || !form.patient.sex) return toast.error('Fill patient details');
    if (!form.requestedComponents.length) return toast.error('Add at least one component');

    const payload = buildPayload();

    if (requestDoc?._id) {
      if (!checkHasChanges(requestDoc, payload)) {
        toast.warning('Reservation request is already created');
        setCurrentStep(2);
        return;
      }
      try {
        const updated = await requisitionApi.update(requestDoc._id, payload);
        setRequestDoc(updated);
        toast.success('Changes updated');
        await handleMatch(updated._id);
        setCurrentStep(2);
      } catch (e) {
        toast.error(e?.message || 'Failed to update reservation');
      }
      return;
    }

    try {
      const created = await requisitionApi.create(payload);
      setRequestDoc(created);
      toast.success('Reservation request created');
      await handleMatch(created._id);
      setCurrentStep(2);
    } catch (e) {
      toast.error(e?.message || 'Failed to create reservation');
    }
  };

  const hasChanges = useMemo(() => {
    if (!requestDoc) return false;
    return checkHasChanges(requestDoc, buildPayload());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, requestDoc]);

  const handleApprove = async () => {
    if (!requestDoc?._id) return;
    setApproving(true);
    try {
      await requisitionApi.approve(requestDoc._id);
      toast.success('Reservation created — units reserved');
      // Done: the reservation pipeline stops here (no issue/complete step) —
      // close out the wizard and land on the Reserve list, like the old
      // one-shot Reserve Wizard used to.
      navigate('/inventory/reserve');
    } catch (e) {
      toast.error(e?.message || 'Failed to create reservation');
      await refreshRequest(requestDoc._id);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (rejectionReason) => {
    if (!requestDoc?._id) return false;
    try {
      await requisitionApi.reject(requestDoc._id, { rejectionReason });
      await refreshRequest(requestDoc._id);
      toast.success('Reservation request rejected');
      return true;
    } catch (e) {
      toast.error(e?.message || 'Rejection failed');
      return false;
    }
  };

  const fetchAvailableUnits = async (componentType, aboGroup) => {
    if (!requestDoc?._id) return null;
    try {
      return await requisitionApi.availableUnits(requestDoc._id, { componentType, aboGroup });
    } catch (e) {
      toast.error(e?.message || 'Failed to load available bags');
      return null;
    }
  };

  const handleSwapBag = async (fromUnitId, toUnitId) => {
    if (!requestDoc?._id || !toUnitId || fromUnitId === toUnitId) return false;
    setSwapping(true);
    try {
      await requisitionApi.swapMatchedUnit(requestDoc._id, { fromUnitId, toUnitId });
      await refreshRequest(requestDoc._id);
      toast.success('Bag updated');
      return true;
    } catch (e) {
      toast.error(e?.message || 'Failed to change bag');
      return false;
    } finally {
      setSwapping(false);
    }
  };

  const handleSaveRecipientGrouping = async (grouping) => {
    if (!requestDoc?._id) return false;
    setGroupingSaving(true);
    try {
      await requisitionApi.setRecipientGrouping(requestDoc._id, grouping);
      await refreshRequest(requestDoc._id);
      toast.success('Recipient grouping saved');
      return true;
    } catch (e) {
      toast.error(e?.message || 'Failed to save grouping');
      return false;
    } finally {
      setGroupingSaving(false);
    }
  };

  const handleSaveBagGrouping = async (unitId, grouping) => {
    if (!requestDoc?._id || !unitId) return false;
    setGroupingSaving(true);
    try {
      await requisitionApi.setMatchedUnitGrouping(requestDoc._id, { unitId, grouping });
      await refreshRequest(requestDoc._id);
      toast.success('Bag grouping saved');
      return true;
    } catch (e) {
      toast.error(e?.message || 'Failed to save grouping');
      return false;
    } finally {
      setGroupingSaving(false);
    }
  };

  const handleConfirmCompatibility = async (unitId, confirmed) => {
    if (!requestDoc?._id || !unitId) return false;
    try {
      await requisitionApi.confirmCompatibility(requestDoc._id, { unitId, confirmed });
      await refreshRequest(requestDoc._id);
      toast.success(confirmed ? 'Compatibility confirmed' : 'Compatibility confirmation removed');
      return true;
    } catch (e) {
      toast.error(e?.message || 'Failed to update compatibility');
      return false;
    }
  };

  const handleCrossmatchUpdate = async (inventoryId, status, details = {}) => {
    if (!requestDoc?._id || !inventoryId) return false;
    setCrossmatchUpdating(true);
    try {
      await requisitionApi.updateCrossmatch(requestDoc._id, {
        inventoryId,
        crossmatchStatus: status,
        compatibilityResult: details.compatibilityResult,
        crossmatchDoneAt: details.crossmatchDoneAt,
        crossmatchSeenAt: details.crossmatchSeenAt,
      });
      await refreshRequest(requestDoc._id);
      toast.success(status === 'compatible' ? 'Crossmatch: Compatible ✓' : 'Crossmatch: Incompatible — replacement attempted');
      return true;
    } catch (e) {
      toast.error(e?.message || 'Crossmatch update failed');
      return false;
    } finally {
      setCrossmatchUpdating(false);
    }
  };

  const handleResetCrossmatch = async (unitId) => {
    if (!requestDoc?._id || !unitId) return false;
    try {
      await requisitionApi.resetCrossmatch(requestDoc._id, unitId);
      await refreshRequest(requestDoc._id);
      return true;
    } catch (e) {
      toast.error(e?.message || 'Failed to reopen crossmatch');
      return false;
    }
  };

  const handleRejectComponent = async (componentType, reason) => {
    if (!requestDoc?._id || !componentType) return false;
    try {
      await requisitionApi.rejectComponent(requestDoc._id, { componentType, reason });
      await refreshRequest(requestDoc._id);
      toast.success(`${componentType} component rejected`);
      return true;
    } catch (e) {
      toast.error(e?.message || 'Failed to reject component');
      return false;
    }
  };

  const maxReservedUntil = useMemo(() => new Date(Date.now() + THREE_DAYS_MS).toISOString().slice(0, 16), []);

  return {
    currentStep,
    setCurrentStep,
    hospitals,
    hospitalsLoading,
    addHospitalOpen,
    setAddHospitalOpen,
    addHospitalForm,
    setAddHospitalForm,
    addingHospital: createHospital.isPending,
    handleCreateHospital,

    form,
    setForm,
    addRequestLine,
    removeRequestLine,
    maxReservedUntil,

    requestDoc,
    matching,
    matchedResult,
    shortages,
    approving,
    crossmatchUpdating,
    swapping,
    groupingSaving,
    hasChanges,

    handleCreate,
    handleMatch,
    handleApprove,
    handleReject,
    fetchAvailableUnits,
    handleSwapBag,
    handleSaveRecipientGrouping,
    handleSaveBagGrouping,
    handleConfirmCompatibility,
    handleCrossmatchUpdate,
    handleResetCrossmatch,
    handleRejectComponent,
  };
}
