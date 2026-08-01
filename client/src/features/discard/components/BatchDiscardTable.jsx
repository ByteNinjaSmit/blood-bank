import { RefreshCw } from "lucide-react";
import DecisionBadge from "./DecisionBadge";
import { TESTING_TYPE_LABELS } from "./discard-constants";

export default function BatchDiscardTable({ batchDiscards, isBatchLoading, onRefresh, onViewReport }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
      <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
        <div className="text-sm font-semibold text-gray-700">Batch Discards ({batchDiscards.length})</div>
        <button
          type="button"
          onClick={() => onRefresh()}
          disabled={isBatchLoading}
          title="Refresh"
          aria-label="Refresh"
          className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isBatchLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-55 border-b">
            <tr>
              {['Batch No', 'GRN Ref', 'Inspection Date', 'Decision', 'Testing Status', 'Results', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isBatchLoading ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
            ) : batchDiscards.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
            ) : batchDiscards.map((ins) => (
              <tr key={ins.id || ins._id} className="hover:bg-red-50/30 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-gray-700">{ins.batchNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{ins.grn?.grnNumber ?? ins.grnId}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{ins.inspectionDate ? new Date(ins.inspectionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                <td className="px-4 py-3"><DecisionBadge decision={ins.decision} /></td>
                <td className="px-4 py-3">
                  {ins.testingType ? (
                    ins.testingStatus === 'SENT' ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                        Under Testing ({TESTING_TYPE_LABELS[ins.testingType] ?? ins.testingType})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                        Report Received
                      </span>
                    )
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">
                  {ins.testingStatus === 'REPORT_RECEIVED' ? (
                    <div className="space-y-0.5">
                      <div><span className="font-semibold text-gray-500">Lab:</span> {ins.testingLab}</div>
                      <div><span className="font-semibold text-gray-500">Bag/Seg:</span> {ins.bagNo || '—'} / {ins.segmentNo || '—'}</div>
                      {ins.testingType === 'EMPTY' ? (
                        <div>
                          <span className="font-semibold text-gray-500">Factor VIII:</span> {ins.factorVIII ?? '—'} Unit/mL,
                          <span className="font-semibold text-gray-500 ml-1">Fibrinogen:</span> {ins.fibrinogen ?? '—'} mg
                        </div>
                      ) : (
                        <div><span className="font-semibold text-gray-500">BG / Result:</span> {ins.bloodGroup || '—'} / {ins.testResult || '—'}</div>
                      )}
                    </div>
                  ) : ins.testingStatus === 'SENT' ? (
                    <span className="text-gray-400">Sent to: {ins.testingLab}</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {ins.testingStatus === 'REPORT_RECEIVED' && (
                    <button
                      onClick={() => onViewReport(ins)}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                    >
                      View Report
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
