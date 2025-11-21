import React from 'react';

export default function PatientForm({ patient, onChange }) {
  return (
    <div className="contents">
      <div>
        <label className="block text-sm text-gray-700 mb-1">Patient Name <span className="text-red-600">*</span></label>
        <input className="w-full px-3 py-2 border rounded-lg" value={patient.name} onChange={(e) => onChange({ name: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">Age <span className="text-red-600">*</span></label>
        <input type="number" className="w-full px-3 py-2 border rounded-lg" value={patient.age} onChange={(e) => onChange({ age: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">Sex <span className="text-red-600">*</span></label>
        <select className="w-full px-3 py-2 border rounded-lg" value={patient.sex} onChange={(e) => onChange({ sex: e.target.value })}>
          <option value="M">Male</option>
          <option value="F">Female</option>
          <option value="O">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">MRN</label>
        <input className="w-full px-3 py-2 border rounded-lg" value={patient.mrn} onChange={(e) => onChange({ mrn: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">Diagnosis</label>
        <input className="w-full px-3 py-2 border rounded-lg" value={patient.diagnosis} onChange={(e) => onChange({ diagnosis: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">HB (optional)</label>
        <input type="number" className="w-full px-3 py-2 border rounded-lg" value={patient.hb} onChange={(e) => onChange({ hb: e.target.value })} />
      </div>
    </div>
  );
}
