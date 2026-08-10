import React from 'react';
import { INDICATION_CATEGORY_LABELS } from '../constants';

// Single "Indication for Transfusion" control: pick a reason from the
// dropdown, or pick Other and type free text. `indication` is kept in sync
// with the selection (the label text for a structured reason, or the typed
// text for Other) so every consumer that reads patient.indication — the
// requisition view, print templates, exports, dashboards — shows the right
// thing without needing to know about indicationCategory/otherDiseaseName.
export default function ClinicalIndicationField({ patient, onChange, readOnly = false }) {
  const category = patient.indicationCategory || '';
  const inputClass = `w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`;

  const handleCategoryChange = (e) => {
    if (readOnly) return;
    const next = e.target.value || null;
    if (next && next !== 'OTHER') {
      onChange({ indicationCategory: next, otherDiseaseName: '', indication: INDICATION_CATEGORY_LABELS[next] || '' });
    } else if (next === 'OTHER') {
      onChange({ indicationCategory: next, otherDiseaseName: patient.otherDiseaseName || '', indication: patient.otherDiseaseName || '' });
    } else {
      onChange({ indicationCategory: null, otherDiseaseName: '', indication: '' });
    }
  };

  const handleOtherChange = (value) => {
    if (readOnly) return;
    onChange({ otherDiseaseName: value, indication: value });
  };

  return (
    <div className="md:col-span-2 space-y-2">
      <div>
        <label className="block text-sm text-gray-700 mb-1">Indication for Transfusion</label>
        <select className={inputClass} value={category} onChange={handleCategoryChange} disabled={readOnly}>
          <option value="">Select</option>
          <option value="THALASSEMIA">Thalassemia</option>
          <option value="SICKLE_CELL_ANAEMIA">Sickle Cell Anemia</option>
          <option value="PREGNANCY_RELATED_COMPLICATION">Pregnancy Related Complication</option>
          <option value="CANCER">Cancer</option>
          <option value="HAEMOPHILIA">Haemophilia</option>
          <option value="ACCIDENT">Accident</option>
          <option value="ANEMIA">Anemia</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      {category === 'OTHER' && (
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Specify Indication for Transfusion <span className="text-red-600">*</span>
          </label>
          <textarea
            rows={2}
            required
            placeholder="e.g. Chronic Anemia, Severe Hemorrhage, Active Bleeding"
            className={inputClass}
            value={patient.otherDiseaseName || ''}
            onChange={(e) => handleOtherChange(e.target.value)}
            disabled={readOnly}
          />
        </div>
      )}
    </div>
  );
}
