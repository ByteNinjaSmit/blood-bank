import React from 'react';
import { User, CreditCard } from 'lucide-react';
import HospitalDoctorDetailsCard from '@/features/requisition/pages/components/HospitalDoctorDetailsCard';
import PatientForm from '@/features/requisition/pages/components/PatientForm';
import TransfusionHistoryCard from '@/features/requisition/pages/components/TransfusionHistoryCard';
import PregnancyHistoryCard from '@/features/requisition/pages/components/PregnancyHistoryCard';
import RequestedComponentsList from '@/features/requisition/pages/components/RequestedComponentsList';

// Step 1 of the Reservation wizard — same fields/UX as Requisition's
// RequestCreationStep, minus the Donor Card section and the (now removed)
// Hospital Seal / Medical Officer Signature card.
export default function ReservationRequestStep({
  hospitals,
  hospitalsLoading,
  form,
  setForm,
  addRequestLine,
  removeRequestLine,
  maxReservedUntil,
  handleCreate,
  requestDoc,
  hasChanges,
  openAddHospital,
  shortages,
}) {
  const updatePatientField = (patch) => {
    setForm((p) => ({ ...p, patient: { ...p.patient, ...patch } }));
  };
  const updateHistoryField = (patch) => {
    setForm((p) => ({ ...p, patient: { ...p.patient, history: { ...(p.patient.history || {}), ...patch } } }));
  };
  const updatePregnancyField = (patch) => {
    setForm((p) => ({ ...p, patient: { ...p.patient, pregnancy: { ...(p.patient.pregnancy || {}), ...patch } } }));
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 rounded-xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HospitalDoctorDetailsCard
          hospitals={hospitals}
          hospitalsLoading={hospitalsLoading}
          hospitalId={form.hospitalId}
          onHospitalIdChange={(v) => setForm((p) => ({ ...p, hospitalId: v }))}
          onAddHospital={openAddHospital}
          doctorName={form.doctorName}
          onDoctorNameChange={(v) => setForm((p) => ({ ...p, doctorName: v }))}
          dateFieldLabel="Reserve Until (optional — default 3 days)"
          dateValue={form.reservedUntil}
          onDateChange={(v) => setForm((p) => ({ ...p, reservedUntil: v }))}
          maxDate={maxReservedUntil}
        />

        <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-2 text-orange-800">
            <User className="w-5 h-5" />
            <h3 className="font-semibold text-gray-800">Patient Information</h3>
          </div>
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
          onItemChange={(idx, patch) => {
            setForm((p) => {
              const arr = [...p.requestedComponents];
              arr[idx] = { ...arr[idx], ...patch };
              return { ...p, requestedComponents: arr };
            });
          }}
          onAdd={addRequestLine}
          onRemove={removeRequestLine}
        />
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

      <div className="pt-4 border-t border-gray-200 mt-2 flex justify-end items-center gap-3">
        {/* Update Changes button — appears once the form is edited after the
            reservation request has already been created. */}
        {hasChanges && (
          <button
            type="button"
            onClick={handleCreate}
            className="px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold transition active:scale-95 shadow cursor-pointer flex items-center gap-1.5"
          >
            Update Changes
          </button>
        )}

        <button
          type="button"
          onClick={handleCreate}
          disabled={!!requestDoc}
          className={`px-6 py-2.5 rounded-lg font-medium shadow transition flex items-center gap-1.5 ${
            requestDoc
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70'
              : 'bg-orange-800 text-white hover:bg-orange-900 active:scale-95 cursor-pointer'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Create Request &amp; Auto-Match FIFO
        </button>
      </div>
    </div>
  );
}
