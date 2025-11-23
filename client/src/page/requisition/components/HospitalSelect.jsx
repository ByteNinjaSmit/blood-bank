import React from 'react';
import { Plus } from 'lucide-react';

export default function HospitalSelect({ hospitals, loading, value, onChange, onAdd, disabled = false }) {
  const isDisabled = disabled || loading || !Array.isArray(hospitals) || hospitals.length === 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm text-gray-700">Hospital <span className="text-red-600">*</span></label>
        <button
          type="button"
          onClick={isDisabled ? undefined : onAdd}
          disabled={isDisabled}
          className={`flex items-center gap-1 text-sm px-2 py-1 rounded border ${
            isDisabled
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-orange-200 text-orange-800 hover:bg-orange-50 cursor-pointer'
          }`}
        >
          <Plus className="w-4 h-4" /> Add
        </button>
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
