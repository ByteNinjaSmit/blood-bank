import React from 'react';
import { Plus } from 'lucide-react';

export default function HospitalSelect({ hospitals, loading, value, onChange, disabled = false, onAddHospital }) {
  const isDisabled = disabled || loading || !Array.isArray(hospitals) || hospitals.length === 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm text-gray-700">Hospital <span className="text-red-600">*</span></label>
        {onAddHospital && !disabled && (
          <button
            type="button"
            onClick={onAddHospital}
            className="flex items-center gap-1 text-xs font-medium text-orange-800 hover:text-orange-900 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Hospital
          </button>
        )}
      </div>
      <select
        className={`w-full px-3 py-2 border rounded-lg ${
          isDisabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white cursor-pointer'
        }`}
        value={value}
        onChange={(e) => !isDisabled && onChange?.(e.target.value)}
        disabled={isDisabled}
      >
        <option value="">Select hospital</option>
        {Array.isArray(hospitals) && hospitals.map((h) => (
          <option key={h._id} value={h._id}>{h.name}</option>
        ))}
      </select>
    </div>
  );
}
