import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Pencil, ClipboardList, Syringe } from 'lucide-react';
import { toast } from 'sonner';
import requisitionApi from '@/services/requisitionApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import HospitalDoctorDetailsCard from './HospitalDoctorDetailsCard';
import PatientForm from './PatientForm';
import TransfusionHistoryCard from './TransfusionHistoryCard';
import PregnancyHistoryCard from './PregnancyHistoryCard';
import RequestedComponentsList from './RequestedComponentsList';
import MatchedBagCard from './MatchedBagCard';
import { componentColor } from './component-colors';
import { defaultPatient, defaultRequestedComponent, buildPatientPayload } from '../hooks/requisition-defaults';

function docToForm(doc) {
  return {
    hospitalId: doc.hospitalId?._id || doc.hospitalId || '',
    doctorName: doc.doctorName || doc.clinicianName || '',
    requiredAt: doc.requiredAt ? new Date(doc.requiredAt).toISOString().slice(0, 10) : '',
    patient: {
      ...defaultPatient,
      name: doc.patient?.name || '',
      address: doc.patient?.address || '',
      age: doc.patient?.age || '',
      ageUnit: doc.patient?.ageUnit || 'YEARS',
      sex: doc.patient?.sex || 'M',
      aboGroup: doc.patient?.aboGroup || 'O',
      rh: doc.patient?.rhFactor === 'NEGATIVE' || doc.patient?.rh === 'Negative' ? 'Negative' : 'Positive',
      mrn: doc.patient?.mrn || '',
      diagnosis: doc.patient?.diagnosis || '',
      hb: doc.patient?.hb || '',
      indication: doc.patient?.indication || '',
      indicationCategory: doc.patient?.indicationCategory || null,
      otherDiseaseName: doc.patient?.otherDiseaseName || '',
      history: {
        previousTransfusions: doc.patient?.history?.previousTransfusions || 0,
        approximateDate: doc.patient?.history?.approximateDate || '',
        presenceOfReaction: doc.patient?.history?.presenceOfReaction || 'None',
      },
      pregnancy: {
        numPregnancies: doc.patient?.pregnancy?.numPregnancies || 0,
        numMiscarriages: doc.patient?.pregnancy?.numMiscarriages || 0,
        numChildrenWithHemolyticDisease: doc.patient?.pregnancy?.numChildrenWithHemolyticDisease || 0,
      },
    },
    requestedComponents: (doc.requestedComponents || []).map((rc) => ({
      componentType: rc.componentType,
      units: rc.units,
      bloodGroup: rc.bloodGroup,
      rh: rc.rh === 'Positive' || rc.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
      urgency: rc.urgency?.toLowerCase() === 'routine' ? 'regular' : rc.urgency?.toLowerCase() || 'regular',
      compatibilityMode: rc.compatibilityMode || 'UNIVERSAL',
    })),
  };
}

export default function RequisitionEditModal({ open, onClose, requisitionId, hospitals, hospitalsLoading, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [doc, setDoc] = useState(null);
  const [form, setForm] = useState(null);
  const [step, setStep] = useState('details');
  const [swapping, setSwapping] = useState(false);
  const [crossmatchUpdating, setCrossmatchUpdating] = useState(false);

  useEffect(() => {
    if (!open || !requisitionId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setDoc(null);
      setForm(null);
      setStep('details');
      const res = await requisitionApi.getRequest(requisitionId);
      if (cancelled) return;
      if (!res.success || !res.data) {
        toast.error(res.error || 'Failed to load requisition');
        setLoading(false);
        return;
      }
      setDoc(res.data);
      setForm(docToForm(res.data));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, requisitionId]);

  const refreshDoc = async () => {
    if (!doc?._id) return;
    const res = await requisitionApi.getRequest(doc._id);
    if (res.success) setDoc(res.data);
  };

  // Step 2 (matched bags): per-line lock for Step 1 — a requested-component
  // line is locked once every bag matched against it has already been
  // issued (compares by componentType + bloodGroup + rh, same key used
  // throughout this modal / the Manage wizard's fulfillment badges).
  const lockedIndexes = useMemo(() => {
    if (!form || !doc) return [];
    return form.requestedComponents.map((rc) => {
      const matches = (doc.matchedInventory || []).filter((mi) => {
        const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
        const bag = inv?.bagNo || {};
        const comp = inv?.componentId || {};
        return comp.componentType === rc.componentType && bag.bloodGroup === rc.bloodGroup && bag.rh === rc.rh;
      });
      if (matches.length === 0) return false;
      return matches.every((mi) => {
        const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
        return inv?.status === 'ISSUED';
      });
    });
  }, [form, doc]);

  // Step 2 handlers — mirror useRequisition.js's Match Review handlers, but
  // scoped to this modal's own `doc` state instead of the wizard's.
  const fetchAvailableUnitsForEdit = async (componentType, aboGroup) => {
    if (!doc?._id) return null;
    const res = await requisitionApi.getAvailableUnits(doc._id, { componentType, aboGroup });
    if (!res.success) {
      toast.error(res.error || 'Failed to load available bags');
      return null;
    }
    return res.data;
  };
  const handleSwapBagForEdit = async (fromUnitId, toUnitId) => {
    if (!doc?._id || !toUnitId || fromUnitId === toUnitId) return;
    setSwapping(true);
    const res = await requisitionApi.swapMatchedUnit(doc._id, { fromUnitId, toUnitId });
    setSwapping(false);
    if (!res.success) {
      toast.error(res.error || 'Failed to change bag');
      return;
    }
    toast.success('Bag updated');
    await refreshDoc();
  };
  const handleConfirmCompatibilityForEdit = async (unitId, confirmed) => {
    if (!doc?._id || !unitId) return;
    const res = await requisitionApi.confirmCompatibility(doc._id, { unitId, confirmed });
    if (!res.success) {
      toast.error(res.error || 'Failed to update compatibility');
      return;
    }
    await refreshDoc();
  };
  const handleResetCrossmatchForEdit = async (unitId) => {
    if (!doc?._id || !unitId) return;
    const res = await requisitionApi.resetCrossmatch(doc._id, unitId);
    if (!res.success) {
      toast.error(res.error || 'Failed to reopen crossmatch');
      return;
    }
    await refreshDoc();
  };
  const handleCrossmatchUpdateForEdit = async (inventoryId, status, details = {}) => {
    if (!doc?._id || !inventoryId) return;
    setCrossmatchUpdating(true);
    const res = await requisitionApi.updateCrossmatch(doc._id, {
      inventoryId,
      crossmatchStatus: status,
      compatibilityResult: details.compatibilityResult,
      crossmatchDoneAt: details.crossmatchDoneAt,
      crossmatchSeenAt: details.crossmatchSeenAt,
    });
    setCrossmatchUpdating(false);
    if (!res.success) {
      toast.error(res.error || 'Crossmatch update failed');
      return;
    }
    await refreshDoc();
  };

  function groupMatchedByComponent(matchedInventory) {
    const groups = {};
    for (const mi of matchedInventory || []) {
      const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
      const compType = inv?.componentId?.componentType || 'Unknown';
      if (!groups[compType]) groups[compType] = [];
      groups[compType].push(mi);
    }
    return groups;
  }

  const updatePatientField = (patch) => setForm((p) => {
    const patient = { ...p.patient, ...patch };
    let requestedComponents = p.requestedComponents;
    if (patch.aboGroup !== undefined || patch.rh !== undefined) {
      const prevGroup = p.patient?.aboGroup || 'O';
      const prevRh = p.patient?.rh || 'Positive';
      requestedComponents = p.requestedComponents.map((rc) =>
        rc.bloodGroup === prevGroup && rc.rh === prevRh
          ? { ...rc, bloodGroup: patient.aboGroup, rh: patient.rh }
          : rc
      );
    }
    return { ...p, patient, requestedComponents };
  });
  const updateHistoryField = (patch) => setForm((p) => ({
    ...p,
    patient: { ...p.patient, history: { ...(p.patient.history || {}), ...patch } },
  }));
  const updatePregnancyField = (patch) => setForm((p) => ({
    ...p,
    patient: { ...p.patient, pregnancy: { ...(p.patient.pregnancy || {}), ...patch } },
  }));
  const addRequestLine = () => setForm((p) => ({
    ...p,
    requestedComponents: [
      ...p.requestedComponents,
      {
        ...defaultRequestedComponent,
        bloodGroup: p.patient?.aboGroup || defaultRequestedComponent.bloodGroup,
        rh: p.patient?.rh || defaultRequestedComponent.rh,
      },
    ],
  }));
  const removeRequestLine = (idx) => setForm((p) => ({
    ...p,
    requestedComponents: p.requestedComponents.filter((_, i) => i !== idx),
  }));

  const handleSave = async () => {
    if (!doc || !form) return;
    if (!form.hospitalId) return toast.error('Select a hospital');
    if (!form.patient.name || !form.patient.age || !form.patient.sex) return toast.error('Fill patient details');
    if (!form.requestedComponents.length) return toast.error('Add at least one requested component');
    const hasIncompleteComponent = form.requestedComponents.some(
      (c) => !c.componentType || !c.units || !c.bloodGroup || !c.rh
    );
    if (hasIncompleteComponent) return toast.error('Fill out all fields for the requested components');

    const payload = {
      hospitalId: form.hospitalId,
      doctorName: form.doctorName || undefined,
      requiredAt: form.requiredAt || undefined,
      patient: buildPatientPayload(form.patient),
      requestedComponents: form.requestedComponents.map((r) => ({
        componentType: r.componentType,
        units: Number(r.units),
        bloodGroup: r.bloodGroup,
        rh: r.rh,
        urgency: r.urgency,
        compatibilityMode: r.compatibilityMode || 'UNIVERSAL',
      })),
    };

    try {
      setSaving(true);
      const res = await requisitionApi.updateRequest(doc._id, payload);
      if (!res.success) {
        toast.error(res.error || 'Failed to update requisition');
        return;
      }
      // Re-run matching so any increased unit count gets the shortfall
      // matched+reserved. This is safe at any status except rejected: the
      // backend's match() is incremental — it never touches already-issued
      // bags or unchanged components, only fills/trims the delta, and
      // preserves the requisition's current status instead of resetting it.
      if (doc.status !== 'rejected') {
        const matchRes = await requisitionApi.match(doc._id);
        if (!matchRes.success) {
          toast.error(matchRes.error || 'Details saved, but matching the updated components failed');
        }
      }
      toast.success('Requisition updated');
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error('Network error while saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            Edit Requisition {doc?.requestId ? `— ${doc.requestId}` : ''}
          </DialogTitle>
        </DialogHeader>

        {loading || !form ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-orange-700" />
            <span className="ml-2 text-sm text-gray-500">Loading requisition…</span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setStep('details')}
                className={`px-4 py-2 text-sm font-semibold flex items-center gap-1.5 border-b-2 -mb-px transition-colors ${
                  step === 'details'
                    ? 'border-orange-700 text-orange-800'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <ClipboardList className="w-4 h-4" /> 1. Request Details
              </button>
              <button
                type="button"
                onClick={() => setStep('bags')}
                className={`px-4 py-2 text-sm font-semibold flex items-center gap-1.5 border-b-2 -mb-px transition-colors ${
                  step === 'bags'
                    ? 'border-orange-700 text-orange-800'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Syringe className="w-4 h-4" /> 2. Matched Bags ({doc?.matchedInventory?.length ?? 0})
              </button>
            </div>

            {step === 'details' ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <HospitalDoctorDetailsCard
                    hospitals={hospitals}
                    hospitalsLoading={hospitalsLoading}
                    hospitalId={form.hospitalId}
                    onHospitalIdChange={(v) => setForm((p) => ({ ...p, hospitalId: v }))}
                    doctorName={form.doctorName}
                    onDoctorNameChange={(v) => setForm((p) => ({ ...p, doctorName: v }))}
                    dateFieldLabel="Reserved Until (optional — default 3 days)"
                    dateValue={form.requiredAt}
                    onDateChange={(v) => setForm((p) => ({ ...p, requiredAt: v }))}
                    dateOnly
                  />

                  <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <PatientForm patient={form.patient} onChange={updatePatientField} />
                    </div>
                  </div>

                  <TransfusionHistoryCard history={form.patient.history} onChange={updateHistoryField} />

                  <PregnancyHistoryCard sex={form.patient.sex} pregnancy={form.patient.pregnancy} onChange={updatePregnancyField} />
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
                  <RequestedComponentsList
                    items={form.requestedComponents}
                    lockedIndexes={lockedIndexes}
                    onItemChange={(idx, patch) => setForm((p) => {
                      const arr = [...p.requestedComponents];
                      arr[idx] = { ...arr[idx], ...patch };
                      return { ...p, requestedComponents: arr };
                    })}
                    onAdd={addRequestLine}
                    onRemove={removeRequestLine}
                  />
                  <p className="text-xs text-gray-500">
                    Raising a component's unit count above what's already matched will get the
                    extra bag(s) auto-matched on save — review/swap them under "2. Matched Bags".
                  </p>
                </div>
              </>
            ) : (
              <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
                {(doc?.matchedInventory || []).some((mi) => {
                  const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
                  return inv?.status === 'ISSUED';
                }) && (
                  <p className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    One or more bags below are already <strong>Issued</strong> — those are locked here and can
                    only be corrected via "Unissue" from the Issue screen. Bags still <strong>Reserved</strong>{' '}
                    (not yet issued) can be freely swapped for a different one below.
                  </p>
                )}
                {Object.keys(groupMatchedByComponent(doc?.matchedInventory)).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(groupMatchedByComponent(doc?.matchedInventory)).map(([compType, items]) => {
                      const rc = form.requestedComponents.find((c) => c.componentType === compType);
                      const color = componentColor(compType);
                      return (
                        <div key={compType} className={`border-2 rounded-lg overflow-hidden ${color.box}`}>
                          <div className={`px-3 py-2 border-b flex items-center gap-2 ${color.header} ${color.box}`}>
                            <span className="font-semibold text-sm">{compType}</span>
                            <span className="text-xs opacity-80">({items.length} unit{items.length > 1 ? 's' : ''})</span>
                          </div>
                          <div className="p-3 space-y-3">
                            {items.map((mi) => {
                              const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
                              const invId = inv?._id || mi.inventoryId;
                              return (
                                <MatchedBagCard
                                  key={invId}
                                  mi={mi}
                                  rc={rc}
                                  componentType={compType}
                                  color={color}
                                  fetchAvailableUnits={fetchAvailableUnitsForEdit}
                                  onSwapBag={handleSwapBagForEdit}
                                  swapping={swapping}
                                  onCrossmatchUpdate={handleCrossmatchUpdateForEdit}
                                  onConfirmCompatibility={handleConfirmCompatibilityForEdit}
                                  onResetCrossmatch={handleResetCrossmatchForEdit}
                                  crossmatchUpdating={crossmatchUpdating}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">No matched bags yet — add requested components and save to auto-match.</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t mt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl text-sm shadow-sm transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
