import React from 'react';
import { HeartHandshake, ShieldAlert } from 'lucide-react';

export default function PregnancyHistoryCard({ sex, pregnancy, onChange, readOnly = false }) {
  if (sex !== 'F') {
    return (
      <div className="bg-gray-50 p-5 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center space-y-2">
        <ShieldAlert className="w-8 h-8 text-gray-400" />
        <span className="text-sm font-medium text-gray-500">Pregnancy History Blocked</span>
        <span className="text-xs text-gray-400">Only enabled for patients with Sex set to Female.</span>
      </div>
    );
  }

  const inputClass = `w-full px-3 py-2 border rounded-lg ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`;

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4 animate-fadeIn">
      <div className="flex items-center gap-2 border-b pb-2 text-orange-800">
        <HeartHandshake className="w-5 h-5" />
        <h3 className="font-semibold text-gray-800">Pregnancy History</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">No. of Pregnancies</label>
          <input
            type="number"
            min={0}
            className={inputClass}
            value={pregnancy?.numPregnancies ?? 0}
            onChange={(e) => onChange({ numPregnancies: e.target.value })}
            disabled={readOnly}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">No. of Miscarriages</label>
          <input
            type="number"
            min={0}
            className={inputClass}
            value={pregnancy?.numMiscarriages ?? 0}
            onChange={(e) => onChange({ numMiscarriages: e.target.value })}
            disabled={readOnly}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Haemolytic Newborns</label>
          <input
            type="number"
            min={0}
            className={inputClass}
            value={pregnancy?.numChildrenWithHemolyticDisease ?? 0}
            onChange={(e) => onChange({ numChildrenWithHemolyticDisease: e.target.value })}
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
}
