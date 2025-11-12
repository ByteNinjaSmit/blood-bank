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
    patient: { ...defaultPatient },
    requestedComponents: [ { ...defaultRequestedComponent } ],
  });

  // Created request state
  const [requestDoc, setRequestDoc] = useState(null);
  const [matching, setMatching] = useState(false);
  const [matchedResult, setMatchedResult] = useState(null);
  const [issuing, setIssuing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [completing, setCompleting] = useState(false);

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
        patient: {
          name: form.patient.name,
          age: Number(form.patient.age),
          sex: form.patient.sex,
          mrn: form.patient.mrn || undefined,
          diagnosis: form.patient.diagnosis || undefined,
          hb: form.patient.hb ? Number(form.patient.hb) : undefined,
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
      toast.success('Request created');
      setCurrentStep(2);
      // auto match
      await handleMatch(res.data?._id);
    } catch (e) {
      toast.error('Failed to create request');
    }
  };

  const refreshRequest = async (id) => {
    const r = await requisitionApi.getRequest(id);
    if (r.success) setRequestDoc(r.data);
  };

  const handleMatch = async (id = requestDoc?._id) => {
    if (!id) return;
    setMatching(true);
    const res = await requisitionApi.match(id);
    setMatching(false);
    if (!res.success) {
      if (res?.raw?.message) toast.error(res.raw.message);
      else toast.error(res.error || 'Matching failed');
      return;
    }
    setMatchedResult(res.data);
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
    toast.success('Issued');
    setCurrentStep(4);
  };

  const handleComplete = async () => {
    if (!requestDoc?._id) return;
    setCompleting(true);
    const res = await requisitionApi.complete(requestDoc._id);
    setCompleting(false);
    if (!res.success) return toast.error(res.error || 'Completion failed');
    await refreshRequest(requestDoc._id);
    toast.success('Completed');
  };

  const handleReject = async () => {
    if (!requestDoc?._id) return;
    const res = await requisitionApi.reject(requestDoc._id);
    if (!res.success) return toast.error(res.error || 'Rejection failed');
    await refreshRequest(requestDoc._id);
    toast.success('Request rejected');
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
    issuing,
    approving,
    completing,
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
  };
}
