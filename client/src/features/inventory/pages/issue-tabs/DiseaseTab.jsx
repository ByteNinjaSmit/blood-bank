import React from 'react';
import { Loader2, MapPin, Eye } from 'lucide-react';
import { formatDateTime } from '@/lib/format-date';

const fmtDateTime = (v) => formatDateTime(v, { day: '2-digit', month: '2-digit', year: 'numeric' });

// Clinical Indication / Disease Patients tab — a read view over real
// Requisitions whose patient.indicationCategory is set (Thalassemia /
// Sickle Cell Anaemia / Other). These are created via the normal
// Requisition flow (selecting the indication from the dropdown), not a
// separate form here — this tab surfaces them and routes issuing through
// the normal requisition issue action (crossmatch/TTI/issue-gate enforced).
export default function DiseaseTab({
  thalRows,
  thalLoading,
  thalPagination,
  fetchThalassemia,
  diseaseLabel,
  onViewRequisition,
}) {
  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-red-700" />
          <span className="font-semibold text-gray-800 text-sm">Clinical Indication / Disease Patient Records</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Total: {thalPagination.total || thalRows.length}</span>
          <button
            onClick={() => fetchThalassemia(1)}
            className="text-xs text-gray-500 hover:text-red-700 flex items-center gap-1"
          >
            {thalLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : '↻'} Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Requisition</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Indication</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Age / Sex</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hospital</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Matched Bags</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {thalLoading ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" /> Loading…
              </td></tr>
            ) : thalRows.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                No clinical indication / disease patient requisitions found.
              </td></tr>
            ) : thalRows.map((r) => {
              const p = r.patient || {};
              const matchedCount = Array.isArray(r.matchedInventory) ? r.matchedInventory.length : 0;
              return (
                <tr key={r._id} className="hover:bg-red-50/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700">{r.requestId || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{p.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{diseaseLabel(p)}</td>
                  <td className="px-4 py-3 text-gray-600">{p.age || '—'} / {p.sex || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{r.hospitalId?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                      {matchedCount} bag{matchedCount === 1 ? '' : 's'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fmtDateTime(r.updatedAt || r.requestedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewRequisition(r)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-xs font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t text-sm text-gray-600">
        <span>Page {thalPagination.page || 1} of {thalPagination.totalPages || 1}</span>
        <div className="flex items-center gap-2">
          <button
            disabled={thalPagination.page <= 1}
            onClick={() => { const p = Math.max(1, (thalPagination.page || 1) - 1); fetchThalassemia(p); }}
            className="px-3 py-1 rounded-md disabled:text-gray-300 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed"
          >Previous</button>
          <button
            disabled={thalPagination.page >= thalPagination.totalPages}
            onClick={() => { const p = (thalPagination.page || 1) + 1; fetchThalassemia(p); }}
            className="px-3 py-1 rounded-md disabled:text-gray-300 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed"
          >Next</button>
        </div>
      </div>
    </div>
  );
}
