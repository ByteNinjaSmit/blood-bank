import React from 'react';

// Separate from "Indication for Transfusion" (free text) — this is the
// structured Thalassemia / Sickle Cell Anemia / Other classification that
// drives the Clinical Indication / Disease Patients register.
export default function ClinicalIndicationField({ patient, onChange, readOnly = false }) {
  const category = patient.indicationCategory || '';
  const inputClass = `w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`;

  const handleCategoryChange = (e) => {
    if (readOnly) return;
    const next = e.target.value || null;
    onChange({ indicationCategory: next, ...(next !== 'OTHER' ? { otherDiseaseName: '' } : {}) });
  };

  return (
    <div className="md:col-span-2 space-y-2">
      <div>
        <label className="block text-sm text-gray-700 mb-1">Clinical Indication / Disease Patients</label>
        <select className={inputClass} value={category} onChange={handleCategoryChange} disabled={readOnly}>
          <option value="">Select</option>
          <option value="THALASSEMIA">Thalassemia</option>
          <option value="SICKLE_CELL_ANAEMIA">Sickle Cell Anemia</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      {category === 'OTHER' && (
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Enter Clinical Indication <span className="text-red-600">*</span>
          </label>
          <textarea
            rows={2}
            required
            placeholder="Specify the disease"
            className={inputClass}
            value={patient.otherDiseaseName || ''}
            onChange={(e) => !readOnly && onChange({ otherDiseaseName: e.target.value })}
            disabled={readOnly}
          />
        </div>
      )}
    </div>
  );
}
