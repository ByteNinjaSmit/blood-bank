import React from 'react';

export default function PatientForm({ patient, onChange, readOnly = false }) {
  return (
    <div className="contents">
      <div>
        <label className="block text-sm text-gray-700 mb-1">Patient Name <span className="text-red-600">*</span></label>
        <input
          className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
          value={patient.name}
          onChange={(e) => !readOnly && onChange({ name: e.target.value })}
          disabled={readOnly}
        />
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">Age <span className="text-red-600">*</span></label>
        <input
          type="number"
          className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
          value={patient.age}
          onChange={(e) => !readOnly && onChange({ age: e.target.value })}
          disabled={readOnly}
        />
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">Sex <span className="text-red-600">*</span></label>
        <select
          className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
          value={patient.sex}
          onChange={(e) => !readOnly && onChange({ sex: e.target.value })}
          disabled={readOnly}
        >
          <option value="M">Male</option>
          <option value="F">Female</option>
          <option value="O">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">MRN</label>
        <input
          className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
          value={patient.mrn}
          onChange={(e) => !readOnly && onChange({ mrn: e.target.value })}
          disabled={readOnly}
        />
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">Diagnosis</label>
        <input
          className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
          value={patient.diagnosis}
          onChange={(e) => !readOnly && onChange({ diagnosis: e.target.value })}
          disabled={readOnly}
        />
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">HB (optional)</label>
        <input
          type="number"
          className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
          value={patient.hb || ''}
          onChange={(e) => !readOnly && onChange({ hb: e.target.value })}
          disabled={readOnly}
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm text-gray-700 mb-1">Indication for Transfusion</label>
        <textarea
          rows={2}
          placeholder="e.g. Chronic Anemia, Severe Hemorrhage, Active Bleeding"
          className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
          value={patient.indication || ''}
          onChange={(e) => !readOnly && onChange({ indication: e.target.value })}
          disabled={readOnly}
        />
      </div>
    </div>
  );
}
