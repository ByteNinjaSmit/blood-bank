import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BLOOD_GROUPS, COMPONENT_TYPES, RH_TYPES, URGENCY, UNIT_OPTIONS } from '../constants';

export default function RequestedComponentsList({ items, onItemChange, onAdd, onRemove, readOnly = false, lockedIndexes = [] }) {
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
        {items.map((r, idx) => {
          // A line is locked once every bag matched against it has already
          // been issued — editing componentType/group/rh at that point
          // would orphan real, physically-issued bags. Not-yet-issued (or
          // not-yet-matched) lines stay fully editable, including raising
          // the unit count to request more.
          const rowLocked = readOnly || !!lockedIndexes[idx];
          return (
          <div key={idx} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end p-3 rounded-lg border border-gray-100 bg-gray-50/40">
            {rowLocked && !readOnly && (
              <div className="col-span-2 md:col-span-6 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                Locked — every bag matched for this component has already been issued.
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Component <span className="text-red-600">*</span></label>
              <select
                className={`w-full px-3 py-2 border rounded-lg ${rowLocked ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={r.componentType}
                onChange={(e) => !rowLocked && onItemChange(idx, { componentType: e.target.value })}
                disabled={rowLocked}
              >
                {COMPONENT_TYPES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Units <span className="text-red-600">*</span></label>
              <select
                className={`w-full px-3 py-2 border rounded-lg ${rowLocked ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={r.units}
                onChange={(e) => !rowLocked && onItemChange(idx, { units: e.target.value })}
                disabled={rowLocked}
              >
                {UNIT_OPTIONS.map((n) => (<option key={n} value={n}>{n}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Group <span className="text-red-600">*</span></label>
              <select
                className={`w-full px-3 py-2 border rounded-lg ${rowLocked ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={r.bloodGroup}
                onChange={(e) => !rowLocked && onItemChange(idx, { bloodGroup: e.target.value })}
                disabled={rowLocked}
              >
                {BLOOD_GROUPS.map((g) => (<option key={g} value={g}>{g}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Rh <span className="text-red-600">*</span></label>
              <select
                className={`w-full px-3 py-2 border rounded-lg ${rowLocked ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={r.rh}
                onChange={(e) => !rowLocked && onItemChange(idx, { rh: e.target.value })}
                disabled={rowLocked}
              >
                {RH_TYPES.map((rh) => (<option key={rh} value={rh}>{rh}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Urgency <span className="text-red-600">*</span></label>
              <select
                className={`w-full px-3 py-2 border rounded-lg ${rowLocked ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                value={r.urgency}
                onChange={(e) => !rowLocked && onItemChange(idx, { urgency: e.target.value })}
                disabled={rowLocked}
              >
                {URGENCY.map((u) => (<option key={u} value={u}>{u}</option>))}
              </select>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={rowLocked ? undefined : () => onRemove(idx)}
                disabled={rowLocked}
                className={`px-3 py-2 text-sm rounded-lg border flex items-center gap-2 ${
                  rowLocked
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-red-200 text-red-700 hover:bg-red-50 cursor-pointer'
                }`}
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </>
  );
}
