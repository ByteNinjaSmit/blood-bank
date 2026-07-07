import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BLOOD_GROUPS, COMPONENT_TYPES, RH_TYPES, URGENCY, UNIT_OPTIONS } from '../constants';

export default function RequestedComponentsList({ items, onItemChange, onAdd, onRemove, readOnly = false }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Requested Components</h3>
        <button
          type="button"
          onClick={readOnly ? undefined : onAdd}
          disabled={readOnly}
          className={`px-3 py-2 text-sm rounded-lg border flex items-center gap-2 ${
            readOnly
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-orange-200 text-orange-800 hover:bg-orange-50 cursor-pointer'
          }`}
        >
          <Plus className="w-4 h-4" /> Add Request
        </button>
      </div>
      <div className="space-y-3">
        {items.map((r, idx) => (
          <div key={idx} className="grid grid-cols-2 md:grid-cols-7 gap-3 items-end p-3 rounded-lg border border-gray-100 bg-gray-50/40">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Component <span className="text-red-600">*</span></label>
              <select
                className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={r.componentType}
                onChange={(e) => !readOnly && onItemChange(idx, { componentType: e.target.value })}
                disabled={readOnly}
              >
                {COMPONENT_TYPES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Units <span className="text-red-600">*</span></label>
              <select
                className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={r.units}
                onChange={(e) => !readOnly && onItemChange(idx, { units: e.target.value })}
                disabled={readOnly}
              >
                {UNIT_OPTIONS.map((n) => (<option key={n} value={n}>{n}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Group <span className="text-red-600">*</span></label>
              <select
                className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={r.bloodGroup}
                onChange={(e) => !readOnly && onItemChange(idx, { bloodGroup: e.target.value })}
                disabled={readOnly}
              >
                {BLOOD_GROUPS.map((g) => (<option key={g} value={g}>{g}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Rh <span className="text-red-600">*</span></label>
              <select
                className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={r.rh}
                onChange={(e) => !readOnly && onItemChange(idx, { rh: e.target.value })}
                disabled={readOnly}
              >
                {RH_TYPES.map((rh) => (<option key={rh} value={rh}>{rh}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Urgency <span className="text-red-600">*</span></label>
              <select
                className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={r.urgency}
                onChange={(e) => !readOnly && onItemChange(idx, { urgency: e.target.value })}
                disabled={readOnly}
              >
                {URGENCY.map((u) => (<option key={u} value={u}>{u}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Compatibility Mode</label>
              <select
                className={`w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={r.compatibilityMode || 'UNIVERSAL'}
                onChange={(e) => !readOnly && onItemChange(idx, { compatibilityMode: e.target.value })}
                disabled={readOnly}
              >
                <option value="UNIVERSAL">Universal</option>
                <option value="MAJOR">Major Compatible</option>
                <option value="MINOR">Minor Compatible</option>
              </select>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={readOnly ? undefined : () => onRemove(idx)}
                disabled={readOnly}
                className={`px-3 py-2 text-sm rounded-lg border flex items-center gap-2 ${
                  readOnly
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-red-200 text-red-700 hover:bg-red-50 cursor-pointer'
                }`}
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
