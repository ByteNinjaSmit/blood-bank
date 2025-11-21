import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BLOOD_GROUPS, COMPONENT_TYPES, RH_TYPES, URGENCY, UNIT_OPTIONS } from '../constants';

export default function RequestedComponentsList({ items, onItemChange, onAdd, onRemove }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Requested Components</h3>
        <button type="button" onClick={onAdd} className="px-3 py-2 text-sm rounded-lg border border-orange-200 text-orange-800 hover:bg-orange-50 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Request
        </button>
      </div>
      <div className="space-y-3">
        {items.map((r, idx) => (
          <div key={idx} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Component <span className="text-red-600">*</span></label>
              <select className="w-full px-3 py-2 border rounded-lg" value={r.componentType} onChange={(e) => onItemChange(idx, { componentType: e.target.value })}>
                {COMPONENT_TYPES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Units <span className="text-red-600">*</span></label>
              <select className="w-full px-3 py-2 border rounded-lg" value={r.units} onChange={(e) => onItemChange(idx, { units: e.target.value })}>
                {UNIT_OPTIONS.map((n) => (<option key={n} value={n}>{n}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Group <span className="text-red-600">*</span></label>
              <select className="w-full px-3 py-2 border rounded-lg" value={r.bloodGroup} onChange={(e) => onItemChange(idx, { bloodGroup: e.target.value })}>
                {BLOOD_GROUPS.map((g) => (<option key={g} value={g}>{g}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Rh <span className="text-red-600">*</span></label>
              <select className="w-full px-3 py-2 border rounded-lg" value={r.rh} onChange={(e) => onItemChange(idx, { rh: e.target.value })}>
                {RH_TYPES.map((rh) => (<option key={rh} value={rh}>{rh}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Urgency <span className="text-red-600">*</span></label>
              <select className="w-full px-3 py-2 border rounded-lg" value={r.urgency} onChange={(e) => onItemChange(idx, { urgency: e.target.value })}>
                {URGENCY.map((u) => (<option key={u} value={u}>{u}</option>))}
              </select>
            </div>
            <div className="flex items-center">
              <button type="button" onClick={() => onRemove(idx)} className="px-3 py-2 text-sm rounded-lg border border-red-200 text-red-700 hover:bg-red-50 flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
