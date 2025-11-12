import React from 'react';
import { Plus } from 'lucide-react';

export default function HospitalSelect({ hospitals, loading, value, onChange, onAdd }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm text-gray-700">Hospital</label>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 text-sm px-2 py-1 rounded border border-orange-200 text-orange-800 hover:bg-orange-50"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      <select
        className="w-full px-3 py-2 border rounded-lg"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={loading || !Array.isArray(hospitals) || hospitals.length === 0}
      >
        <option value="">Select hospital</option>
        {Array.isArray(hospitals) && hospitals.map((h) => (
          <option key={h._id} value={h._id}>{h.name}</option>
        ))}
      </select>
    </div>
  );
}
