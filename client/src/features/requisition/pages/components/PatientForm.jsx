import React from 'react';
import ClinicalIndicationField from './ClinicalIndicationField';
import { BLOOD_GROUPS, RH_TYPES } from '../constants';

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
      <div className="md:col-span-2">
        <label className="block text-sm text-gray-700 mb-1">Recipient's Address</label>
        <input
          className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
          value={patient.address || ''}
          onChange={(e) => !readOnly && onChange({ address: e.target.value })}
          disabled={readOnly}
        />
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">Age <span className="text-red-600">*</span></label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            className={`w-2/3 px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
            value={patient.age}
            onChange={(e) => !readOnly && onChange({ age: e.target.value })}
            disabled={readOnly}
          />
          <select
            className={`w-1/3 px-2 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
            value={patient.ageUnit || 'YEARS'}
            onChange={(e) => !readOnly && onChange({ ageUnit: e.target.value })}
            disabled={readOnly}
          >
            <option value="YEARS">Years</option>
            <option value="DAYS">Days</option>
          </select>
        </div>
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
        <label className="block text-sm text-gray-700 mb-1">Patient's Blood Group <span className="text-red-600">*</span></label>
        <div className="flex gap-2">
          <select
            className={`w-1/2 px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
            value={patient.aboGroup || 'O'}
            onChange={(e) => !readOnly && onChange({ aboGroup: e.target.value })}
            disabled={readOnly}
          >
            {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select
            className={`w-1/2 px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
            value={patient.rh || 'Positive'}
            onChange={(e) => !readOnly && onChange({ rh: e.target.value })}
            disabled={readOnly}
          >
            {RH_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <p className="text-xs text-gray-400 mt-1">The patient's own verified type — not necessarily the same as the product being requested below.</p>
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
      <ClinicalIndicationField patient={patient} onChange={onChange} readOnly={readOnly} />
    </div>
  );
}
