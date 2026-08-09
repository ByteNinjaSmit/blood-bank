import React from 'react';

export default function HospitalSelect({ hospitals, loading, value, onChange, disabled = false }) {
  const isDisabled = disabled || loading || !Array.isArray(hospitals) || hospitals.length === 0;

  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1">Hospital <span className="text-red-600">*</span></label>
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
