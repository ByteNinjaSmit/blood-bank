import React from 'react';
import { Loader2, Warehouse, Eye, Pencil, Trash2 } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/format-date';

// Day/month/year with month as a number (e.g. 19/07/2026).
const fmtDate = (v) => formatDate(v, { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtDateTime = (v) => formatDateTime(v, { day: '2-digit', month: '2-digit', year: 'numeric' });

const STORAGE_SUB_TABS = [
  { key: 'SJS', label: 'SJS — Kopargaon' },
  { key: 'Anand', label: 'Anand' },
];

// Storage tab: bags sent to a storage centre (SJS / Anand), grouped into a
// date accordion. Purely presentational — all data + state lives in the page.
export default function StorageTab({
  storageSubTab,
  setStorageSubTab,
  storageLoading,
  storageBagRows,
  storageBagsByDate,
  expandedDates,
  toggleDateGroup,
  fetchStorageBags,
  onViewBag,
  onEditBag,
  onDeleteBag,
}) {
  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden">
      {/* Sub-tabs */}
      <div className="flex gap-0 border-b border-gray-200 bg-gray-50">
        {STORAGE_SUB_TABS.map(sub => (
          <button
            key={sub.key}
            onClick={() => setStorageSubTab(sub.key)}
            className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition-all ${
              storageSubTab === sub.key
                ? 'border-red-700 text-red-700 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 bg-gray-50'
            }`}
          >
            {sub.label}
          </button>
        ))}
        <div className="ml-auto flex items-center pr-4">
          <button
            onClick={() => fetchStorageBags(storageSubTab)}
            className="text-xs text-gray-500 hover:text-red-700 flex items-center gap-1"
          >
            {storageLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : '↻'} Refresh
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="px-5 py-2.5 border-b bg-gray-50/60 flex items-center gap-2 text-sm text-gray-600">
        <Warehouse className="w-3.5 h-3.5 text-gray-400" />
        Total bags sent to <strong className="text-gray-800">{storageSubTab}</strong>:
        <span className="font-semibold text-red-700">{storageBagRows.length}</span>
        {storageBagsByDate.length > 0 && (
          <span className="text-gray-400 ml-1">· {storageBagsByDate.length} date group{storageBagsByDate.length > 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Accordion table header (always visible) */}
      <div className="overflow-x-auto">
        {storageLoading ? (
          <div className="px-4 py-12 text-center text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p>Loading storage records…</p>
          </div>
        ) : storageBagsByDate.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-400">
            No bags sent to {storageSubTab} yet.
          </div>
        ) : (
          <table className="min-w-full text-sm">
            {/* Column header */}
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-8 px-4 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Sent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bags Count</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Components</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {storageBagsByDate.map(([dateKey, bags]) => {
                const isOpen = expandedDates.has(dateKey);
                const componentSummary = [...new Set(bags.map(b => b?.component?.componentType).filter(Boolean))].join(', ') || '—';
                return (
                  <React.Fragment key={dateKey}>
                    {/* Date accordion header row */}
                    <tr
                      onClick={() => toggleDateGroup(dateKey)}
                      className={`border-b cursor-pointer select-none transition-colors ${isOpen ? 'bg-red-50 border-red-100' : 'bg-white hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-3.5 text-gray-400">
                        <span className={`inline-block transition-transform duration-200 text-xs ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-gray-800">{dateKey}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          {bags.length} bag{bags.length > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs">{componentSummary}</td>
                      <td className="px-4 py-3.5 text-right text-xs text-gray-400 pr-5">
                        {isOpen ? 'Collapse ▲' : 'Expand ▼'}
                      </td>
                    </tr>

                    {/* Expanded detail rows */}
                    {isOpen && (
                      <tr>
                        <td colSpan={5} className="p-0 border-b border-gray-200">
                          <div className="bg-gray-50/80 border-t border-gray-100">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="bg-gray-100/80 border-b border-gray-200">
                                  <th className="px-6 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bag No</th>
                                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Segment No</th>
                                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Component</th>
                                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Blood Group</th>
                                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Volume</th>
                                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry</th>
                                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sent Date</th>
                                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {bags.map(r => {
                                  const rh = r?.bag?.rh === 'Positive' ? '+' : r?.bag?.rh === 'Negative' ? '-' : r?.bag?.rh || '';
                                  return (
                                    <tr key={r._id} className="bg-white hover:bg-red-50/20 transition-colors">
                                      <td className="px-6 py-3 font-mono font-bold text-gray-800 text-xs">{r?.bag?.bagNo || r.bagNo || '—'}</td>
                                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.segmentNo || '—'}</td>
                                      <td className="px-4 py-3 text-gray-700 font-medium">{r?.component?.componentType || '—'}</td>
                                      <td className="px-4 py-3 font-bold text-gray-800">{r?.bag?.bloodGroup}{rh}</td>
                                      <td className="px-4 py-3 text-gray-600">{r?.component?.volumeMl ? `${r.component.volumeMl} mL` : '—'}</td>
                                      <td className="px-4 py-3 text-gray-600">{fmtDate(r?.component?.expiryDate)}</td>
                                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDateTime(r.issuedAt)}</td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            onClick={() => onViewBag(r)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-xs font-medium transition-colors"
                                          >
                                            <Eye className="w-3.5 h-3.5" /> View
                                          </button>
                                          <button
                                            onClick={() => onEditBag(r)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-xs font-medium transition-colors"
                                          >
                                            <Pencil className="w-3.5 h-3.5" /> Edit
                                          </button>
                                          <button
                                            onClick={() => onDeleteBag(r)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-600 hover:border-red-600 hover:text-white text-xs font-medium transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
