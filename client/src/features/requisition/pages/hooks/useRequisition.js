import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import hospitalApi from '@/services/hospitalApi';
import requisitionApi from '@/services/requisitionApi';

export const defaultPatient = {
  name: '',
  age: '',
  sex: 'M',
  mrn: '',
  diagnosis: '',
  hb: '',
  indication: '',
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

  // Create request form state
  const [form, setForm] = useState({
    hospitalId: '',
    doctorName: '',
    requiredAt: '',
    medicalOfficerSignature: '',
    hospitalSeal: '',
    patient: { ...defaultPatient },
    requestedComponents: [ { ...defaultRequestedComponent } ],
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
        medicalOfficerSignature: form.medicalOfficerSignature || undefined,
        hospitalSeal: form.hospitalSeal || undefined,
        patient: {
          name: form.patient.name,
          age: Number(form.patient.age),
          sex: form.patient.sex,
          mrn: form.patient.mrn || undefined,
          diagnosis: form.patient.diagnosis || undefined,
          hb: form.patient.hb ? Number(form.patient.hb) : undefined,
          indication: form.patient.indication || undefined,
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
        })),
      };
      const res = await requisitionApi.createRequest(payload);
      if (!res.success) return toast.error(res.error || 'Failed to create request');
      setRequestDoc(res.data);
      toast.success(res?.raw?.message || 'Request created');
      // auto match immediately after creating the request; the user can
      // then Continue to the Match Review step once matching succeeds.
      await handleMatch(res.data?._id);
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
        // Show compact user message summarizing first shortage
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
    setMatchedResult(res.data);
    setShortages(null);
    await refreshRequest(id);
    toast.success('Matched and reserved');
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

  const handleIssue = async () => {
    if (!requestDoc?._id) return;
    setIssuing(true);
    const res = await requisitionApi.issue(requestDoc._id);
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
        medicalOfficerSignature: form.medicalOfficerSignature || undefined,
        hospitalSeal: form.hospitalSeal || undefined,
        patient: {
          name: form.patient.name,
          age: Number(form.patient.age),
          sex: form.patient.sex,
          mrn: form.patient.mrn || undefined,
          diagnosis: form.patient.diagnosis || undefined,
          hb: form.patient.hb ? Number(form.patient.hb) : undefined,
          indication: form.patient.indication || undefined,
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

  const handleCrossmatchUpdate = async (inventoryId, status) => {
    if (!requestDoc?._id || !inventoryId) return false;
    setCrossmatchUpdating(true);
    const res = await requisitionApi.updateCrossmatch(requestDoc._id, {
      inventoryId,
      crossmatchStatus: status,
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
  };
}
