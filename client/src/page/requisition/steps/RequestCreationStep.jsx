import React from 'react';
import HospitalSelect from '../components/HospitalSelect';
import PatientForm from '../components/PatientForm';
import RequestedComponentsList from '../components/RequestedComponentsList';

export default function RequestCreationStep({
  hospitals,
  hospitalsLoading,
  form,
  setForm,
  addRequestLine,
  removeRequestLine,
  handleCreate,
  requestDoc,
  openAddHospital,
}) {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Request Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HospitalSelect
          hospitals={hospitals}
          loading={hospitalsLoading}
          value={form.hospitalId}
          onChange={(v) => setForm((p) => ({ ...p, hospitalId: v }))}
          onAdd={openAddHospital}
        />
        <PatientForm
          patient={form.patient}
          onChange={(patch) => setForm((p) => ({ ...p, patient: { ...p.patient, ...patch } }))}
        />
      </div>

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

      <div className="pt-4">
        <button type="button" onClick={handleCreate} className="px-5 py-2 rounded-lg bg-orange-800 text-white hover:bg-orange-900">
          Create Request & Auto-Match FIFO
        </button>
      </div>

      {requestDoc && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
          Request created: <strong>{requestDoc.requestId}</strong> — Status: <strong className="capitalize">{requestDoc.status}</strong>
        </div>
      )}
    </div>
  );
}
