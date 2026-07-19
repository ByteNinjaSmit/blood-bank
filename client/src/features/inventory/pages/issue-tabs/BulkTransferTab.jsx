import React from 'react';
import { Loader2, ArrowLeftRight, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Bulk Transfer tab: inter-bank loan records (give/take loan). Presentational
// only — data + actions provided by the page.
export default function BulkTransferTab({
  bulkRows,
  bulkLoading,
  bulkPagination,
  fetchBulkTransfers,
  onSendBulk,
  onViewTransfer,
  onEditTransfer,
  onDeleteTransfer,
}) {
  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-red-700" />
          <span className="font-semibold text-gray-800 text-sm">Bulk Transfer Records (Loans)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Total: {bulkPagination.total || bulkRows.length}</span>
          <button
            onClick={() => fetchBulkTransfers(bulkPagination.page || 1)}
            className="text-xs text-gray-500 hover:text-red-700 flex items-center gap-1"
          >
            {bulkLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : '↻'} Refresh
          </button>
          <Button
            onClick={onSendBulk}
            className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white shadow-sm flex items-center gap-1.5 h-9 px-4 rounded-lg"
          >
            <ArrowLeftRight className="w-4 h-4" /> Send Bulk
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transfer ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transfer Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bags</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {bulkLoading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" /> Loading…
              </td></tr>
            ) : bulkRows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                No bulk transfer records found.
              </td></tr>
            ) : bulkRows.map(r => (
              <tr key={r.id} className="hover:bg-red-50/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800">{r.transferId}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    r.transferType === 'GIVE_LOAN'
                      ? 'bg-amber-50 border border-amber-200 text-amber-800'
                      : 'bg-blue-50 border border-blue-200 text-blue-800'
                  }`}>
                    {r.transferType === 'GIVE_LOAN' ? 'Give Loan' : 'Take Loan'}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800">{r.bloodBankName}</td>
                <td className="px-4 py-3 text-gray-600 max-w-[220px] truncate" title={r.bloodBankAddress}>{r.bloodBankAddress}</td>
                <td className="px-4 py-3 text-gray-600">{r.transferDate ? new Date(r.transferDate).toLocaleDateString() : '—'}</td>
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

      {/* Bulk transfer pagination */}
      <div className="flex items-center justify-between px-5 py-3 border-t text-sm text-gray-600">
        <span>Page {bulkPagination.page || 1} of {bulkPagination.totalPages || 1}</span>
        <div className="flex items-center gap-2">
          <button
            disabled={bulkPagination.page <= 1}
            onClick={() => { const p = Math.max(1, (bulkPagination.page || 1) - 1); fetchBulkTransfers(p); }}
            className="px-3 py-1 rounded-md disabled:text-gray-300 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed"
          >Previous</button>
          <button
            disabled={bulkPagination.page >= bulkPagination.totalPages}
            onClick={() => { const p = (bulkPagination.page || 1) + 1; fetchBulkTransfers(p); }}
            className="px-3 py-1 rounded-md disabled:text-gray-300 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed"
          >Next</button>
        </div>
      </div>
    </div>
  );
}
