import React, { useState } from 'react';

// Manual crossmatch worksheet — shown for every component that requires
// crossmatch. The operator explicitly picks the compatibility type; there is
// no default selection. Before approval this saves as data only (the unit
// isn't reserved yet); the unit state transition happens after approval.

export default function CrossmatchWorksheet({ invId, onSave, updating, initial, accentClass }) {
  const [compatibility, setCompatibility] = useState(initial?.compatibilityResult || '');

  const canSave = !!compatibility;

  const handleSave = () => {
    if (!canSave) return;
    onSave(invId, 'compatible', {
      compatibilityResult: compatibility,
    });
  };

  return (
    <div className={`p-3 rounded-lg border-2 bg-white space-y-2 ${accentClass || 'border-amber-300'}`}>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Compatibility <span className="text-red-600">*</span></label>
        <select
          value={compatibility}
          onChange={(e) => setCompatibility(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white"
        >
          <option value="">— Select —</option>
          <option value="MAJOR_COMPATIBLE">Major Compatible</option>
          <option value="MINOR_COMPATIBLE">Minor Compatible</option>
          <option value="UNIVERSAL">Universal</option>
        </select>
      </div>
      <button
        type="button"
        disabled={!canSave || updating}
        onClick={handleSave}
        className={`w-full px-3 py-1.5 text-xs font-semibold rounded-md ${
          canSave && !updating
            ? 'bg-orange-800 text-white hover:bg-orange-900 cursor-pointer'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {updating ? 'Saving…' : 'Save Crossmatch'}
      </button>
    </div>
  );
}
