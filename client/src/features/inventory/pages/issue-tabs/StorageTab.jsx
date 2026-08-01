import React from 'react';
import { Loader2, Warehouse, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format-date';
import { STORAGE_LOCATION_TABS } from '@/features/inventory/pages/hooks/useStorageTransfer';

const fmtDate = (v) => formatDate(v, { day: '2-digit', month: '2-digit', year: 'numeric' });

// Storage tab: one row per StorageTransfer batch (a "Send to Storage"
// dispatch). Mirrors BulkTransferTab's table shape — edit/delete act on
// the whole batch, not on individual bags inside it. Split into SJS /
// Anand sub-tabs since the two storage locations are managed separately.
export default function StorageTab({
  storageRows,
  storageLoading,
  storagePagination,
  fetchStorageTransfers,
  storageLocationTab,
  changeStorageLocationTab,
  onSendToStorage,
  onViewTransfer,
  onEditTransfer,
  onDeleteTransfer,
}) {
  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-red-700" />
          <span className="font-semibold text-gray-800 text-sm">Storage Batches</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Total: {storagePagination.total || storageRows.length}</span>
          <button
            onClick={() => fetchStorageTransfers(storagePagination.page || 1)}
            className="text-xs text-gray-500 hover:text-red-700 flex items-center gap-1"
          >
            {storageLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : '↻'} Refresh
          </button>
          <Button
            onClick={onSendToStorage}
            className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white shadow-sm flex items-center gap-1.5 h-9 px-4 rounded-lg"
          >
            <Warehouse className="w-4 h-4" /> Send to Storage
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 px-5 pt-3 border-b bg-gray-50">
        {STORAGE_LOCATION_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => changeStorageLocationTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              storageLocationTab === t.key
                ? 'border-red-700 text-red-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transfer ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sent Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bags</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {storageLoading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" /> Loading…
              </td></tr>
            ) : storageRows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                No storage batches found.
              </td></tr>
            ) : storageRows.map((r) => (
              <tr key={r.id} className="hover:bg-red-50/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800">{r.transferId}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">{r.otherLocationName || r.location}</td>
                <td className="px-4 py-3 text-gray-600">{fmtDate(r.sentDate)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                    {r.items?.length || 0} bag{(r.items?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewTransfer(r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-xs font-medium transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => onEditTransfer(r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-xs font-medium transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => onDeleteTransfer(r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-600 hover:border-red-600 hover:text-white text-xs font-medium transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t text-sm text-gray-600">
        <span>Page {storagePagination.page || 1} of {storagePagination.totalPages || 1}</span>
        <div className="flex items-center gap-2">
          <button
            disabled={storagePagination.page <= 1}
            onClick={() => fetchStorageTransfers(Math.max(1, (storagePagination.page || 1) - 1))}
            className="px-3 py-1 rounded-md disabled:text-gray-300 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed"
          >Previous</button>
          <button
            disabled={storagePagination.page >= storagePagination.totalPages}
            onClick={() => fetchStorageTransfers((storagePagination.page || 1) + 1)}
            className="px-3 py-1 rounded-md disabled:text-gray-300 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed"
          >Next</button>
        </div>
      </div>
    </div>
  );
}
