import React, { useState } from 'react';

/**
 * Export dropdown for pages with multiple registers/tabs — lists each
 * register as its own section (e.g. Issue Stock / Storage / Bulk Transfer)
 * with its own Filtered View / All Records buttons, so any register can be
 * exported regardless of which tab is currently active.
 */
export default function RegisterExportDropdown({ onExport, isLoading = false, registers }) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePick = (register, scope) => {
    setIsOpen(false);
    onExport?.(register, scope);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => !isLoading && setIsOpen((o) => !o)}
        className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 font-semibold text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        Export Excel
        <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-1.5 w-72 rounded-lg bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-20 overflow-hidden divide-y divide-gray-100">
            {registers.map((r) => (
              <div key={r.key} className="py-1.5">
                <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{r.label}</div>
                <button
                  type="button"
                  onClick={() => handlePick(r.key, 'filtered')}
                  className="flex w-full items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left font-medium cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 mr-2.5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {r.filteredLabel || 'Filtered View'}
                </button>
                <button
                  type="button"
                  onClick={() => handlePick(r.key, 'all')}
                  className="flex w-full items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left font-medium cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 mr-2.5 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                  {r.allLabel || 'All Records'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
