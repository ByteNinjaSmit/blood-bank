import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper, { Step } from '@/components/Stepper';
import { useAuth } from '@/store/auth';
import hospitalApi from '@/services/hospitalApi';
import inventoryApi from '@/services/inventoryApi';
import HospitalSelect from '@/features/requisition/pages/components/HospitalSelect';
import AddHospitalModal from '@/features/requisition/pages/components/AddHospitalModal';
import PatientForm from '@/features/requisition/pages/components/PatientForm';
import RequestedComponentsList from '@/features/requisition/pages/components/RequestedComponentsList';
import { defaultRequestedComponent, defaultPatient } from '@/features/requisition/pages/hooks/useRequisition';
import { SEX_TYPES } from '@/features/requisition/pages/constants';
import { FileText, User, HeartHandshake, History, FileCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function ReserveWizard() {
  const navigate = useNavigate();
  const { authorizationToken } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);

  // hospitals
  const [hospitals, setHospitals] = useState([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [addHospitalOpen, setAddHospitalOpen] = useState(false);
  const [addHospitalForm, setAddHospitalForm] = useState({ name: '', address: '', contactPerson: '', phone: '' });
  const [addingHospital, setAddingHospital] = useState(false);

  // form
  const [form, setForm] = useState({
    hospitalId: '',
    doctorName: '',
    reservedUntil: '',
    medicalOfficerSignature: '',
    hospitalSeal: '',
    patient: { ...defaultPatient },
    items: [ { ...defaultRequestedComponent } ],
  });

  // result
  const [reserving, setReserving] = useState(false);
  const [result, setResult] = useState(null);
  const [shortages, setShortages] = useState(null);

  useEffect(() => {
    if (!authorizationToken) return;
    hospitalApi.initialize(authorizationToken);
    inventoryApi.initialize(authorizationToken);
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
  }, [authorizationToken]);

  const canReserve = useMemo(() => {
    if (!form.hospitalId) return false;
    if (!form.patient?.name || form.patient?.age === '' || form.patient?.sex === '') return false;
    if (!Array.isArray(form.items) || form.items.length === 0) return false;
    for (const it of form.items) {
      if (!it.componentType || !it.units || !it.bloodGroup || !it.rh) return false;
    }
    return true;
  }, [form]);

  const addRequestLine = () => {
    setForm((prev) => ({ ...prev, items: [ ...prev.items, { ...defaultRequestedComponent } ] }));
  };
  const removeRequestLine = (idx) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };
  const onItemChange = (idx, patch) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => i === idx ? { ...it, ...patch } : it)
    }));
  };

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
      if (created) setHospitals((p) => (Array.isArray(p) ? [created, ...p] : [created]));
      setAddHospitalOpen(false);
      setAddHospitalForm({ name: '', address: '', contactPerson: '', phone: '' });
    } catch (e) {
      setAddingHospital(false);
      toast.error('Network error while adding hospital');
    }
  };

  const handleReserve = async () => {
    if (!canReserve) return toast.error('Fill all required fields');
    try {
      setReserving(true);
      const payload = {
        hospitalId: form.hospitalId,
        reservedUntil: form.reservedUntil,
        doctorName: form.doctorName || undefined,
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
        items: form.items.map((r) => ({
          componentType: r.componentType,
          units: Number(r.units),
          bloodGroup: r.bloodGroup,
          rh: r.rh,
        })),
      };
      const res = await inventoryApi.reserveByCriteria(payload);
      setReserving(false);
      if (!res.success) {
        const errMsg = res?.error || res?.raw?.message || 'Reservation failed';
        const sh = res?.errorData?.data?.shortages;
        if (Array.isArray(sh) && sh.length) {
          setShortages(sh);
          const s0 = sh[0];
          toast.error(`Insufficient stock: ${s0.available} of ${s0.required} ${s0.componentType} available`);
        } else {
          setShortages(null);
          toast.error(errMsg);
        }
        setResult(null);
        return;
      }
      setResult(res.data);
      setShortages(null);
      toast.success('Reserved successfully');
      navigate('/inventory/reserve');
    } catch (e) {
      setReserving(false);
      toast.error('Reservation failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Reserve Stock (FIFO)</h1>
          <p className="text-gray-600 text-sm">Reserve units for a hospital until a specific date. Issuing will be handled separately.</p>
        </div>

        <Stepper
          onStepChange={(s) => setCurrentStep(s)}
          nextButtonProps={{ disabled: (currentStep === 1 && !result) || (currentStep === 2 && !result) }}
          disableStepIndicators={currentStep === 1 && !result}
          stepCircleContainerClassName="bg-white"
          contentClassName="bg-white rounded-xl shadow border border-gray-100"
          footerClassName="bg-white rounded-b-xl"
        >
          <Step>
            <div className="p-6 space-y-6 bg-gray-50/50 rounded-xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Card 1: General Request Details */}
                <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2 text-orange-800">
                    <FileText className="w-5 h-5" />
                    <h3 className="font-semibold text-gray-800">Hospital & Doctor Details</h3>
                  </div>
                  <div className="space-y-4">
                    <HospitalSelect
                      hospitals={hospitals}
                      loading={hospitalsLoading}
                      value={form.hospitalId}
                      onChange={(v) => setForm((p) => ({ ...p, hospitalId: v }))}
                      onAdd={() => setAddHospitalOpen(true)}
                    />

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Doctor’s Name</label>
                      <input
                        placeholder="Dr. Full Name"
                        className="w-full px-3 py-2 border rounded-lg bg-white"
                        value={form.doctorName}
                        onChange={(e) => setForm((p) => ({ ...p, doctorName: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Reserve Until (Optional - Default 3 days)</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border rounded-lg bg-white"
                        min={new Date().toISOString().split('T')[0]}
                        max={(() => {
                          const maxDate = new Date();
                          maxDate.setDate(maxDate.getDate() + 3);
                          return maxDate.toISOString().split('T')[0];
                        })()}
                        value={form.reservedUntil}
                        onChange={(e) => setForm((p) => ({ ...p, reservedUntil: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2: Patient Demographics & Indication */}
                <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2 text-orange-800">
                    <User className="w-5 h-5" />
                    <h3 className="font-semibold text-gray-800">Patient Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PatientForm
                      patient={form.patient}
                      onChange={(patch) => setForm((p) => ({ ...p, patient: { ...p.patient, ...patch } }))}
                      readOnly={false}
                    />
                  </div>
                </div>

                {/* Card 3: Clinical / Transfusion History */}
                <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2 text-orange-800">
                    <History className="w-5 h-5" />
                    <h3 className="font-semibold text-gray-800">History of Previous Transfusions</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">No. of Transfusions Given</label>
                      <input
                        type="number"
                        min={0}
                        className="w-full px-3 py-2 border rounded-lg bg-white"
                        value={form.patient.history?.previousTransfusions ?? 0}
                        onChange={(e) => setForm((p) => ({
                          ...p,
                          patient: {
                            ...p.patient,
                            history: { ...p.patient.history, previousTransfusions: e.target.value }
                          }
                        }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Approximate Date of Last</label>
                      <input
                        placeholder="e.g. June 2025 or MM/YYYY"
                        className="w-full px-3 py-2 border rounded-lg bg-white"
                        value={form.patient.history?.approximateDate || ''}
                        onChange={(e) => setForm((p) => ({
                          ...p,
                          patient: {
                            ...p.patient,
                            history: { ...p.patient.history, approximateDate: e.target.value }
                          }
                        }))}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-700 mb-1">Presence / Absence of Reaction</label>
                      <select
                        className="w-full px-3 py-2 border rounded-lg bg-white"
                        value={form.patient.history?.presenceOfReaction || 'None'}
                        onChange={(e) => setForm((p) => ({
                          ...p,
                          patient: {
                            ...p.patient,
                            history: { ...p.patient.history, presenceOfReaction: e.target.value }
                          }
                        }))}
                      >
                        <option value="None">None (No Previous Transfusion)</option>
                        <option value="Absence">Absence (No Reactions Recorded)</option>
                        <option value="Presence">Presence (Transfusion Reactions Present)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Card 4: Pregnancy / Obstetric History */}
                {form.patient.sex === 'F' ? (
                  <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-2 border-b pb-2 text-orange-800">
                      <HeartHandshake className="w-5 h-5" />
                      <h3 className="font-semibold text-gray-800">Pregnancy History</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">No. of Pregnancies</label>
                        <input
                          type="number"
                          min={0}
                          className="w-full px-3 py-2 border rounded-lg bg-white"
                          value={form.patient.pregnancy?.numPregnancies ?? 0}
                          onChange={(e) => setForm((p) => ({
                            ...p,
                            patient: {
                              ...p.patient,
                              pregnancy: { ...p.patient.pregnancy, numPregnancies: e.target.value }
                            }
                          }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 mb-1">No. of Miscarriages</label>
                        <input
                          type="number"
                          min={0}
                          className="w-full px-3 py-2 border rounded-lg bg-white"
                          value={form.patient.pregnancy?.numMiscarriages ?? 0}
                          onChange={(e) => setForm((p) => ({
                            ...p,
                            patient: {
                              ...p.patient,
                              pregnancy: { ...p.patient.pregnancy, numMiscarriages: e.target.value }
                            }
                          }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Haemolytic Newborns</label>
                        <input
                          type="number"
                          min={0}
                          className="w-full px-3 py-2 border rounded-lg bg-white"
                          value={form.patient.pregnancy?.numChildrenWithHemolyticDisease ?? 0}
                          onChange={(e) => setForm((p) => ({
                            ...p,
                            patient: {
                              ...p.patient,
                              pregnancy: { ...p.patient.pregnancy, numChildrenWithHemolyticDisease: e.target.value }
                            }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-5 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center space-y-2">
                    <ShieldAlert className="w-8 h-8 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">Pregnancy History Blocked</span>
                    <span className="text-xs text-gray-400">Only enabled for patients with Sex set to Female.</span>
                  </div>
                )}
              </div>

              {/* Card 5: Requested Components Table */}
              <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
                <RequestedComponentsList
                  items={form.items}
                  onItemChange={onItemChange}
                  onAdd={addRequestLine}
                  onRemove={removeRequestLine}
                />
              </div>

              {/* Card 6: Authorization & Seal */}
              <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-2 text-orange-800">
                  <FileCheck className="w-5 h-5" />
                  <h3 className="font-semibold text-gray-800">Authorization & Hospital Seal</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Signature of Medical Officer (Typed Name)</label>
                    <input
                      placeholder="Full M.O. Name / Digital Stamp"
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                      value={form.medicalOfficerSignature}
                      onChange={(e) => setForm((p) => ({ ...p, medicalOfficerSignature: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Hospital Seal Verification Code / Text</label>
                    <input
                      placeholder="Seal reference number or stamp text"
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                      value={form.hospitalSeal}
                      onChange={(e) => setForm((p) => ({ ...p, hospitalSeal: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {Array.isArray(shortages) && shortages.length > 0 && (
                <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900">
                  <p className="font-medium">Insufficient stock to reserve fully:</p>
                  <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
                    {shortages.map((s, idx) => (
                      <li key={idx}>
                        {s.componentType}: {s.available} of {s.required} available.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleReserve}
                  disabled={!canReserve || reserving}
                  className={`px-4 py-2 rounded-lg ${reserving ? 'bg-orange-300' : 'bg-orange-800 hover:bg-orange-900'} text-white font-semibold shadow transition cursor-pointer`}
                >
                  {reserving ? 'Reserving…' : 'Reserve FIFO'}
                </button>
              </div>
            </div>
          </Step>

          <Step>
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-gray-800">Reservation Summary</h3>
              {result ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-green-200 bg-green-50 text-green-900">
                    <p className="font-medium">Reserved units: {result?.matchedCount}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600">
                          <th className="p-2">Bag No</th>
                          <th className="p-2">Component</th>
                          <th className="p-2">Blood</th>
                          <th className="p-2">Expiry</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(result?.items || []).map((it) => (
                          <tr key={it._id} className="border-t">
                            <td className="p-2">{it?.bag?.bagNo || it.bagNo}</td>
                            <td className="p-2">{it?.component?.componentType}</td>
                            <td className="p-2">{it?.bag?.bloodGroup} {it?.bag?.rh}</td>
                            <td className="p-2">{it?.component?.expiryDate ? new Date(it.component.expiryDate).toLocaleDateString() : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No reservation yet.</p>
              )}
            </div>
          </Step>

          <Step>
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-gray-800">Done</h3>
              <p className="text-sm text-gray-700">Your reservation has been recorded. You can view all reserved units any time.</p>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={()=>navigate('/inventory/reserve')}>View Reserved List</button>
              </div>
            </div>
          </Step>
        </Stepper>
      </div>

      <AddHospitalModal
        isOpen={addHospitalOpen}
        onClose={() => setAddHospitalOpen(false)}
        form={addHospitalForm}
        onChange={(patch) => setAddHospitalForm((p) => ({ ...p, ...patch }))}
        saving={addingHospital}
        onSave={handleCreateHospital}
      />
    </div>
  );
}
