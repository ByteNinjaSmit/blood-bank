import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import hospitalApi from '@/services/hospitalApi';
import requisitionApi from '@/services/requisitionApi';
import { donorCardApi } from '@/features/donor-card/api';

export const defaultDonorCard = {
  brought: false,
  name: '',
  address: '',
  bloodGroup: 'A+',
  donationCardNumber: '',
};

export const defaultPatient = {
  name: '',
  address: '',
  age: '',
  sex: 'M',
  mrn: '',
  diagnosis: '',
  hb: '',
  indication: '',
  specialNeeds: [],
  history: {
    previousTransfusions: 0,
    approximateDate: '',
    presenceOfReaction: 'None',
  },
  pregnancy: {
    numPregnancies: 0,
    numMiscarriages: 0,
    numChildrenWithHemolyticDisease: 0,
  },
};

export const defaultRequestedComponent = {
  componentType: 'RBC',
  units: 1,
  bloodGroup: 'O',
  rh: 'Positive',
  urgency: 'regular',
  compatibilityMode: 'UNIVERSAL',
};

export default function useRequisition(authToken) {
  // Step control
  const [currentStep, setCurrentStep] = useState(1);

  // Data: hospitals
  const [hospitals, setHospitals] = useState([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);

  const [addHospitalOpen, setAddHospitalOpen] = useState(false);
  const [addHospitalForm, setAddHospitalForm] = useState({ name: '', address: '', contactPerson: '', phone: '' });
  const [addingHospital, setAddingHospital] = useState(false);

  const [form, setForm] = useState({
    hospitalId: '',
    doctorName: '',
    requiredAt: '',
    patient: { ...defaultPatient },
    requestedComponents: [ { ...defaultRequestedComponent } ],
    donorCard: { ...defaultDonorCard },
  });

  // Created request state
  const [requestDoc, setRequestDoc] = useState(null);
  const [matching, setMatching] = useState(false);
  const [matchedResult, setMatchedResult] = useState(null);
  const [shortages, setShortages] = useState(null);
  const [issuing, setIssuing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [crossmatchUpdating, setCrossmatchUpdating] = useState(false);

  const canProceedToMatch = useMemo(() => !!requestDoc?._id, [requestDoc]);

  useEffect(() => {
    if (!requestDoc) return;

    // Donor card lives in a separate collection (not embedded on the
    // requisition), so it has to be fetched independently. Without this,
    // the form reset below (which replaces the whole `form` object) would
    // silently wipe out whatever the user entered/toggled — "Yes" flipping
    // back to "No" right after Create/Update.
    let cancelled = false;
    (async () => {
      let donorCard = { ...defaultDonorCard };
      try {
        const found = await donorCardApi.getByRequisition(requestDoc._id);
        if (found) {
          donorCard = {
            brought: true,
            name: found.name || '',
            address: found.address || '',
            bloodGroup: found.bloodGroup || 'A+',
            donationCardNumber: found.donationCardNumber || '',
          };
        }
      } catch {
        // no card saved yet, or lookup failed — fall back to defaults
      }
      if (!cancelled) {
        setForm((prev) => ({ ...prev, donorCard }));
      }
    })();

    setForm((prev) => ({
        ...prev,
        hospitalId: requestDoc.hospitalId?._id || requestDoc.hospitalId || '',
        doctorName: requestDoc.doctorName || requestDoc.clinicianName || '',
        requiredAt: requestDoc.requiredAt ? new Date(requestDoc.requiredAt).toISOString().slice(0, 16) : '',
        patient: {
          name: requestDoc.patient?.name || '',
          address: requestDoc.patient?.address || '',
          age: requestDoc.patient?.age || '',
          sex: requestDoc.patient?.sex || 'M',
          mrn: requestDoc.patient?.mrn || '',
          diagnosis: requestDoc.patient?.diagnosis || '',
          hb: requestDoc.patient?.hb || '',
          indication: requestDoc.patient?.indication || '',
          specialNeeds: Array.isArray(requestDoc.patient?.specialNeeds) ? requestDoc.patient.specialNeeds : [],
          history: {
            previousTransfusions: requestDoc.patient?.history?.previousTransfusions || 0,
            approximateDate: requestDoc.patient?.history?.approximateDate || '',
            presenceOfReaction: requestDoc.patient?.history?.presenceOfReaction || 'None',
          },
          pregnancy: {
            numPregnancies: requestDoc.patient?.pregnancy?.numPregnancies || 0,
            numMiscarriages: requestDoc.patient?.pregnancy?.numMiscarriages || 0,
            numChildrenWithHemolyticDisease: requestDoc.patient?.pregnancy?.numChildrenWithHemolyticDisease || 0,
          },
        },
        requestedComponents: (requestDoc.requestedComponents || []).map((rc) => ({
          componentType: rc.componentType === 'PRBC' ? 'RBC' : rc.componentType === 'PLATELET_CONCENTRATE' ? 'Platelet' : rc.componentType === 'CRYOPRECIPITATE' ? 'Cryo' : rc.componentType,
          units: rc.units,
          bloodGroup: rc.bloodGroup,
          rh: rc.rh === 'Positive' || rc.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
          urgency: rc.urgency?.toLowerCase() === 'routine' ? 'regular' : rc.urgency?.toLowerCase() || 'regular',
          compatibilityMode: rc.compatibilityMode || 'UNIVERSAL',
        })),
    }));

    return () => {
      cancelled = true;
    };
  }, [requestDoc]);

  useEffect(() => {
    if (!authToken) return;
    // init API clients
    hospitalApi.initialize(authToken);
    requisitionApi.initialize(authToken);

    // load hospitals (first page)
    (async () => {
      setHospitalsLoading(true);
      const resp = await hospitalApi.getHospitals({ limit: 100 });
      const list = Array.isArray(resp?.data?.data)
        ? resp.data.data
        : Array.isArray(resp?.data)
          ? resp.data
          : [];
      setHospitals(list);
      setHospitalsLoading(false);
    })();
  }, [authToken]);

  const handleCreateHospital = async () => {
    if (!addHospitalForm.name || !addHospitalForm.address || !addHospitalForm.contactPerson || !addHospitalForm.phone) {
      toast.error('Fill all hospital fields');
      return;
    }
    try {
      setAddingHospital(true);
      const res = await hospitalApi.createHospital(addHospitalForm);
      setAddingHospital(false);
      if (!res.success) {
        return toast.error(res.error || 'Failed to add hospital');
      }
      const created = res?.data?.data;
      toast.success(res?.data?.message || 'Hospital added');
      if (created?._id) {
        setForm((p) => ({ ...p, hospitalId: created._id }));
      }
      // Optimistically add then refresh
      if (created) {
        setHospitals((p) => (Array.isArray(p) ? [created, ...p] : [created]));
      }
      setAddHospitalOpen(false);
      // Refresh list in background
      setHospitalsLoading(true);
      const resp = await hospitalApi.getHospitals({ limit: 100 });
      const list = Array.isArray(resp?.data?.data)
        ? resp.data.data
        : Array.isArray(resp?.data)
          ? resp.data
          : [];
      setHospitals(list);
      setHospitalsLoading(false);
      setAddHospitalForm({ name: '', address: '', contactPerson: '', phone: '' });
    } catch (e) {
      setAddingHospital(false);
      toast.error('Network error while adding hospital');
    }
  };

  const addRequestLine = () => {
    setForm((prev) => ({
      ...prev,
      requestedComponents: [
        ...prev.requestedComponents,
        { ...defaultRequestedComponent },
      ],
    }));
  };

  const removeRequestLine = (idx) => {
    setForm((prev) => ({
      ...prev,
      requestedComponents: prev.requestedComponents.filter((_, i) => i !== idx),
    }));
  };

function checkHasChanges(doc, payload) {
  if (!doc) return true;
  
  const docHospId = doc.hospitalId?._id || doc.hospitalId || '';
  if (docHospId !== payload.hospitalId) return true;
  
  if ((doc.doctorName || doc.clinicianName || '') !== (payload.doctorName || '')) return true;
  
  const docRequiredAt = doc.requiredAt ? new Date(doc.requiredAt).getTime() : 0;
  const payRequiredAt = payload.requiredAt ? new Date(payload.requiredAt).getTime() : 0;
  if (docRequiredAt !== payRequiredAt) return true;

  // Patient details
  if ((doc.patient?.name || '') !== (payload.patient.name || '')) return true;
  if (Number(doc.patient?.age || 0) !== Number(payload.patient.age || 0)) return true;
  if ((doc.patient?.sex || 'M') !== (payload.patient.sex || 'M')) return true;
  if ((doc.patient?.mrn || '') !== (payload.patient.mrn || '')) return true;
  if ((doc.patient?.diagnosis || '') !== (payload.patient.diagnosis || '')) return true;
  if (Number(doc.patient?.hb || 0) !== Number(payload.patient.hb || 0)) return true;
  if ((doc.patient?.indication || '') !== (payload.patient.indication || '')) return true;
  const docSpecialNeeds = [...(doc.patient?.specialNeeds || [])].sort();
  const paySpecialNeeds = [...(payload.patient.specialNeeds || [])].sort();
  if (docSpecialNeeds.length !== paySpecialNeeds.length || docSpecialNeeds.some((v, i) => v !== paySpecialNeeds[i])) return true;

  // Transfusion history
  if (Number(doc.patient?.history?.previousTransfusions || 0) !== Number(payload.patient.history.previousTransfusions || 0)) return true;
  if ((doc.patient?.history?.approximateDate || '') !== (payload.patient.history.approximateDate || '')) return true;
  if ((doc.patient?.history?.presenceOfReaction || 'None') !== (payload.patient.history.presenceOfReaction || 'None')) return true;
  
  // Pregnancy
  if (Number(doc.patient?.pregnancy?.numPregnancies || 0) !== Number(payload.patient.pregnancy.numPregnancies || 0)) return true;
  if (Number(doc.patient?.pregnancy?.numMiscarriages || 0) !== Number(payload.patient.pregnancy.numMiscarriages || 0)) return true;
  if (Number(doc.patient?.pregnancy?.numChildrenWithHemolyticDisease || 0) !== Number(payload.patient.pregnancy.numChildrenWithHemolyticDisease || 0)) return true;
  
  // Requested components
  const docComponents = doc.requestedComponents || [];
  const payComponents = payload.requestedComponents || [];
  if (docComponents.length !== payComponents.length) return true;
  
  for (let i = 0; i < docComponents.length; i++) {
    const dc = docComponents[i];
    const pc = payComponents[i];
    
    let dcType = dc.componentType;
    if (dcType === 'PRBC') dcType = 'RBC';
    if (dcType === 'PLATELET_CONCENTRATE') dcType = 'Platelet';
    if (dcType === 'CRYOPRECIPITATE') dcType = 'Cryo';
    
    let pcType = pc.componentType;
    if (pcType === 'PRBC') pcType = 'RBC';
    if (pcType === 'PLATELET_CONCENTRATE') pcType = 'Platelet';
    if (pcType === 'CRYOPRECIPITATE') pcType = 'Cryo';
    
    if (dcType !== pcType) return true;
    if (Number(dc.units) !== Number(pc.units)) return true;
    if (dc.bloodGroup !== pc.bloodGroup) return true;
    
    const dcRh = dc.rh === 'Positive' || dc.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative';
    const pcRh = pc.rh === 'Positive' || pc.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative';
    if (dcRh !== pcRh) return true;
    
    const dcUrgency = dc.urgency?.toLowerCase() === 'routine' ? 'regular' : dc.urgency?.toLowerCase();
    const pcUrgency = pc.urgency?.toLowerCase() === 'routine' ? 'regular' : pc.urgency?.toLowerCase();
    if (dcUrgency !== pcUrgency) return true;

    if ((dc.compatibilityMode || 'UNIVERSAL') !== (pc.compatibilityMode || 'UNIVERSAL')) return true;
  }
  
  return false;
}

  // Best-effort — the requisition itself already succeeded, so a donor
  // card save failure shouldn't block the wizard from proceeding. Uses an
  // upsert on the server, so this is safe to call again on later edits.
  const saveDonorCardIfNeeded = async (requisitionId) => {
    if (!form.donorCard?.brought || !requisitionId) return;
    try {
      await donorCardApi.create({
        requisitionId,
        name: form.donorCard.name,
        address: form.donorCard.address,
        bloodGroup: form.donorCard.bloodGroup,
        donationCardNumber: form.donorCard.donationCardNumber,
      });
    } catch {
      toast.warning('Request saved, but saving the donor card details failed.');
    }
  };

  const handleCreate = async () => {
    try {
      // validation minimal
      if (!form.hospitalId) return toast.error('Select hospital');
      if (!form.patient.name || !form.patient.age || !form.patient.sex) return toast.error('Fill patient details');
      if (!form.requestedComponents.length) return toast.error('Add at least one component');
      const payload = {
        hospitalId: form.hospitalId,
        doctorName: form.doctorName || undefined,
        requiredAt: form.requiredAt || undefined,
        patient: {
          name: form.patient.name,
          address: form.patient.address || undefined,
          age: Number(form.patient.age),
          sex: form.patient.sex,
          mrn: form.patient.mrn || undefined,
          diagnosis: form.patient.diagnosis || undefined,
          hb: form.patient.hb ? Number(form.patient.hb) : undefined,
          indication: form.patient.indication || undefined,
          specialNeeds: form.patient.specialNeeds || [],
          history: {
            previousTransfusions: Number(form.patient.history?.previousTransfusions || 0),
            approximateDate: form.patient.history?.approximateDate || undefined,
            presenceOfReaction: form.patient.history?.presenceOfReaction || 'None',
          },
          pregnancy: {
            numPregnancies: Number(form.patient.pregnancy?.numPregnancies || 0),
            numMiscarriages: Number(form.patient.pregnancy?.numMiscarriages || 0),
            numChildrenWithHemolyticDisease: Number(form.patient.pregnancy?.numChildrenWithHemolyticDisease || 0),
          },
        },
        requestedComponents: form.requestedComponents.map((r) => ({
          componentType: r.componentType,
          units: Number(r.units),
          bloodGroup: r.bloodGroup,
          rh: r.rh,
          urgency: r.urgency,
          compatibilityMode: r.compatibilityMode || 'UNIVERSAL',
        })),
      };

      if (requestDoc?._id) {
        // Request is already created! Check for updates
        const hasChanges = checkHasChanges(requestDoc, payload);
        if (!hasChanges) {
          toast.warning('Request is already created');
          setCurrentStep(2);
          return;
        }

        const res = await requisitionApi.updateRequest(requestDoc._id, payload);
        if (!res.success) return toast.error(res.error || 'Failed to update request');
        setRequestDoc(res.data);
        toast.success('Changes updated');
        await saveDonorCardIfNeeded(res.data?._id);
        // auto match immediately after updating the request
        await handleMatch(res.data?._id);
        setCurrentStep(2);
        return;
      }

      const res = await requisitionApi.createRequest(payload);
      if (!res.success) return toast.error(res.error || 'Failed to create request');
      setRequestDoc(res.data);
      toast.success(res?.raw?.message || 'Request created');

      await saveDonorCardIfNeeded(res.data?._id);

      // auto match immediately after creating the request
      await handleMatch(res.data?._id);
      setCurrentStep(2);
    } catch (e) {
      toast.error('Failed to create request');
    }
  };

  const refreshRequest = async (id) => {
    const r = await requisitionApi.getRequest(id);
    if (r.success) setRequestDoc(r.data);
  };

  const statusToStep = (status) => {
    if (status === 'issued' || status === 'completed') return 4;
    if (status === 'approved') return 3;
    // pending or matched -> start from Match Review
    return 2;
  };

  const loadRequest = async (id) => {
    const r = await requisitionApi.getRequest(id);
    if (!r.success || !r.data) {
      toast.error(r.error || 'Failed to load request');
      return false;
    }
    setRequestDoc(r.data);
    setCurrentStep(statusToStep(r.data.status));
    return true;
  };

  const handleMatch = async (id = requestDoc?._id) => {
    if (!id) return;
    setMatching(true);
    const res = await requisitionApi.match(id);
    setMatching(false);
    if (!res.success) {
      const errMsg = res?.error || res?.raw?.message || 'Matching failed';
      const sh = res?.errorData?.data?.shortages;
      if (Array.isArray(sh) && sh.length) {
        setShortages(sh);
        const s0 = sh[0];
        toast.error(`Insufficient stock: ${s0.available} of ${s0.required} ${s0.componentType} available`);
      } else {
        setShortages(null);
        toast.error(errMsg);
      }
      setMatchedResult(null);
      await refreshRequest(id);
      return;
    }
    // For multi-component requests, a 200 may still carry partial shortages
    const partialShortages = res?.data?.shortages;
    if (Array.isArray(partialShortages) && partialShortages.length > 0) {
      setShortages(partialShortages);
      toast.warning(
        `Partial match: ${partialShortages.map((s) => `${s.componentType} unavailable`).join(', ')}. Proceeding with available components.`
      );
    } else {
      setShortages(null);
    }
    setMatchedResult(res.data);
    await refreshRequest(id);
    if (!Array.isArray(partialShortages) || !partialShortages.length) {
      toast.success('Matched and reserved');
    }
  };

  const handleApprove = async () => {
    if (!requestDoc?._id) return;
    setApproving(true);
    const res = await requisitionApi.approve(requestDoc._id);
    setApproving(false);
    if (!res.success) return toast.error(res.error || 'Approval failed');
    await refreshRequest(requestDoc._id);
    toast.success('Approved');
  };

  const handleIssue = async (unitIds = []) => {
    if (!requestDoc?._id) return;
    setIssuing(true);
    const res = await requisitionApi.issue(requestDoc._id, unitIds);
    setIssuing(false);
    if (!res.success) return toast.error(res.error || 'Issuing failed');
    await refreshRequest(requestDoc._id);
    toast.success(res?.raw?.message || 'Units issued');
  };

  const handleComplete = async () => {
    if (!requestDoc?._id) return false;
    setCompleting(true);
    const res = await requisitionApi.complete(requestDoc._id);
    setCompleting(false);
    if (!res.success) {
      toast.error(res.error || 'Completion failed');
      return false;
    }
    await refreshRequest(requestDoc._id);
    toast.success(res?.raw?.message || 'Request completed');
    return true;
  };

  const handleReject = async (rejectionReason) => {
    if (!requestDoc?._id) return false;
    const res = await requisitionApi.reject(requestDoc._id, rejectionReason);
    if (!res.success) {
      toast.error(res.error || 'Rejection failed');
      return false;
    }
    await refreshRequest(requestDoc._id);
    toast.success('Request rejected');
    return true;
  };

  const handleCreateAndReject = async (rejectionReason) => {
    try {
      if (!form.hospitalId) {
        toast.error('Select hospital first');
        return false;
      }
      if (!form.patient.name || !form.patient.age || !form.patient.sex) {
        toast.error('Fill patient details first');
        return false;
      }
      if (!form.requestedComponents.length) {
        toast.error('Add at least one component first');
        return false;
      }
      const payload = {
        hospitalId: form.hospitalId,
        doctorName: form.doctorName || undefined,
        requiredAt: form.requiredAt || undefined,
        patient: {
          name: form.patient.name,
          address: form.patient.address || undefined,
          age: Number(form.patient.age),
          sex: form.patient.sex,
          mrn: form.patient.mrn || undefined,
          diagnosis: form.patient.diagnosis || undefined,
          hb: form.patient.hb ? Number(form.patient.hb) : undefined,
          indication: form.patient.indication || undefined,
          specialNeeds: form.patient.specialNeeds || [],
          history: {
            previousTransfusions: Number(form.patient.history?.previousTransfusions || 0),
            approximateDate: form.patient.history?.approximateDate || undefined,
            presenceOfReaction: form.patient.history?.presenceOfReaction || 'None',
          },
          pregnancy: {
            numPregnancies: Number(form.patient.pregnancy?.numPregnancies || 0),
            numMiscarriages: Number(form.patient.pregnancy?.numMiscarriages || 0),
            numChildrenWithHemolyticDisease: Number(form.patient.pregnancy?.numChildrenWithHemolyticDisease || 0),
          },
        },
        requestedComponents: form.requestedComponents.map((r) => ({
          componentType: r.componentType,
          units: Number(r.units),
          bloodGroup: r.bloodGroup,
          rh: r.rh,
          urgency: r.urgency,
          compatibilityMode: r.compatibilityMode || 'UNIVERSAL',
        })),
      };
      const createRes = await requisitionApi.createRequest(payload);
      if (!createRes.success) {
        toast.error(createRes.error || 'Failed to create request');
        return false;
      }
      const createdReq = createRes.data;
      const rejectRes = await requisitionApi.reject(createdReq._id, rejectionReason);
      if (!rejectRes.success) {
        toast.error(rejectRes.error || 'Rejection failed');
        return false;
      }
      toast.success('Request rejected');
      return true;
    } catch (e) {
      toast.error('Failed to create and reject request');
      return false;
    }
  };

  const handleCrossmatchUpdate = async (inventoryId, status, details = {}) => {
    if (!requestDoc?._id || !inventoryId) return false;
    setCrossmatchUpdating(true);
    const res = await requisitionApi.updateCrossmatch(requestDoc._id, {
      inventoryId,
      crossmatchStatus: status,
      compatibilityResult: details.compatibilityResult,
      crossmatchDoneAt: details.crossmatchDoneAt,
      crossmatchSeenAt: details.crossmatchSeenAt,
    });
    setCrossmatchUpdating(false);
    if (!res.success) {
      toast.error(res.error || 'Crossmatch update failed');
      return false;
    }
    await refreshRequest(requestDoc._id);
    toast.success(
      status === 'compatible'
        ? 'Crossmatch: Compatible ✓'
        : 'Crossmatch: Incompatible — replacement attempted'
    );
    return true;
  };

  const hasChanges = useMemo(() => {
    if (!requestDoc) return false;
    const payload = {
      hospitalId: form.hospitalId,
      doctorName: form.doctorName || undefined,
      requiredAt: form.requiredAt || undefined,
      patient: {
        name: form.patient.name,
        address: form.patient.address || undefined,
        age: Number(form.patient.age),
        sex: form.patient.sex,
        mrn: form.patient.mrn || undefined,
        diagnosis: form.patient.diagnosis || undefined,
        hb: form.patient.hb ? Number(form.patient.hb) : undefined,
        indication: form.patient.indication || undefined,
        specialNeeds: form.patient.specialNeeds || [],
        history: {
          previousTransfusions: Number(form.patient.history?.previousTransfusions || 0),
          approximateDate: form.patient.history?.approximateDate || undefined,
          presenceOfReaction: form.patient.history?.presenceOfReaction || 'None',
        },
        pregnancy: {
          numPregnancies: Number(form.patient.pregnancy?.numPregnancies || 0),
          numMiscarriages: Number(form.patient.pregnancy?.numMiscarriages || 0),
          numChildrenWithHemolyticDisease: Number(form.patient.pregnancy?.numChildrenWithHemolyticDisease || 0),
        },
      },
      requestedComponents: form.requestedComponents.map((r) => ({
        componentType: r.componentType,
        units: Number(r.units),
        bloodGroup: r.bloodGroup,
        rh: r.rh,
        urgency: r.urgency,
        compatibilityMode: r.compatibilityMode || 'UNIVERSAL',
      })),
    };
    return checkHasChanges(requestDoc, payload);
  }, [form, requestDoc]);

  return {
    // state
    currentStep,
    setCurrentStep,
    hospitals,
    hospitalsLoading,
    addHospitalOpen,
    setAddHospitalOpen,
    addHospitalForm,
    setAddHospitalForm,
    addingHospital,
    form,
    setForm,
    requestDoc,
    matching,
    matchedResult,
    shortages,
    issuing,
    approving,
    completing,
    crossmatchUpdating,
    canProceedToMatch,
    hasChanges,

    // actions
    handleCreateHospital,
    addRequestLine,
    removeRequestLine,
    handleCreate,
    handleMatch,
    handleApprove,
    handleIssue,
    handleComplete,
    handleReject,
    handleCreateAndReject,
    handleCrossmatchUpdate,
    loadRequest,
    refreshRequest,
  };
}
