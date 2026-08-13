import React, { useEffect, useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import requisitionApi from '@/services/requisitionApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import HospitalDoctorDetailsCard from './HospitalDoctorDetailsCard';
import PatientForm from './PatientForm';
import TransfusionHistoryCard from './TransfusionHistoryCard';
import PregnancyHistoryCard from './PregnancyHistoryCard';
import RequestedComponentsList from './RequestedComponentsList';
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

  useEffect(() => {
    if (!open || !requisitionId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setDoc(null);
      setForm(null);
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

  const updatePatientField = (patch) => setForm((p) => ({ ...p, patient: { ...p.patient, ...patch } }));
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
    requestedComponents: [...p.requestedComponents, { ...defaultRequestedComponent }],
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
      // Re-run FIFO matching so the reserved inventory reflects any changes
      // made to the requested components — mirrors the Manage wizard's
      // "Update Changes" behavior in useRequisition.js.
      await requisitionApi.match(doc._id);
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
                onItemChange={(idx, patch) => setForm((p) => {
                  const arr = [...p.requestedComponents];
                  arr[idx] = { ...arr[idx], ...patch };
                  return { ...p, requestedComponents: arr };
                })}
                onAdd={addRequestLine}
                onRemove={removeRequestLine}
              />
            </div>

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
