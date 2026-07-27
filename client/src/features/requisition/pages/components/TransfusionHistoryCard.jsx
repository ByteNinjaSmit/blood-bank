import React from 'react';
import { History } from 'lucide-react';

export default function TransfusionHistoryCard({ history, onChange, readOnly = false }) {
  const inputClass = `w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`;

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b pb-2 text-orange-800">
        <History className="w-5 h-5" />
        <h3 className="font-semibold text-gray-800">History of Previous Transfusions</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">No. of Transfusions Given</label>
          <input
            type="number"
            min={0}
            className={inputClass}
            value={history?.previousTransfusions ?? 0}
            onChange={(e) => onChange({ previousTransfusions: e.target.value })}
            disabled={readOnly}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Approximate Date of Last</label>
          <input
            placeholder="e.g. June 2025 or MM/YYYY"
            className={inputClass}
            value={history?.approximateDate || ''}
            onChange={(e) => onChange({ approximateDate: e.target.value })}
            disabled={readOnly}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700 mb-1">Presence / Absence of Reaction</label>
          <select
            className={inputClass}
            value={history?.presenceOfReaction || 'None'}
            onChange={(e) => onChange({ presenceOfReaction: e.target.value })}
            disabled={readOnly}
          >
            <option value="None">None (No Previous Transfusion)</option>
            <option value="Absence">Absence (No Reactions Recorded)</option>
            <option value="Presence">Presence (Transfusion Reactions Present)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
