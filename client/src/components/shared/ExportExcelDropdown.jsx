import React, { useState } from 'react';

/**
 * Reusable premium dropdown button to trigger Excel exports.
 * Provides two choices: Export Current View (Filtered) and Export All Records.
 */
export default function ExportExcelDropdown({ onExport, isLoading = false, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (exportAll) => {
    setIsOpen(false);
    if (onExport) {
      onExport(exportAll);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 font-semibold text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer"
        disabled={disabled || isLoading}
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
          <div className="absolute right-0 mt-1.5 w-52 rounded-lg bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-20 overflow-hidden divide-y divide-gray-100">
            <div className="py-1">
              <button
                type="button"
                onClick={() => handleAction(false)}
                className="flex w-full items-center px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left font-medium cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 mr-2.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Export Filtered View
              </button>
              <button
                type="button"
                onClick={() => handleAction(true)}
                className="flex w-full items-center px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left font-medium cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 mr-2.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Export All Records
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
