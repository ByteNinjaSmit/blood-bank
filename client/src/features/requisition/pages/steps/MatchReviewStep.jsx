import React, { useState } from 'react';
import CompatibilityMatrix from '../components/CompatibilityMatrix';
import { ConfirmModal, RejectRequestModal } from '../../../components/shared';

// ── Badge helpers ──

function CompatBadge({ type }) {
  if (type === 'exact') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
        <span className="w-2 h-2 rounded-full bg-green-500" /> Exact
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
      <span className="w-2 h-2 rounded-full bg-yellow-500" /> Compatible
    </span>
  );
}

function CrossmatchBadge({ status, required, onMark, updating }) {
  if (!required || status === 'not-required') {
    return <span className="text-xs text-gray-400">N/A</span>;
  }

  const badges = {
    pending: (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-200">
        ⏳ Pending
      </span>
    ),
    compatible: (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
        ✅ Compatible
      </span>
    ),
    incompatible: (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
        ❌ Incompatible
      </span>
    ),
  };

  return (
    <div className="flex items-center gap-2">
      {badges[status] || badges.pending}
      {status === 'pending' && onMark && (
        <div className="flex gap-1">
          <button
            type="button"
            disabled={updating}
            onClick={() => onMark('compatible')}
            className="px-2 py-0.5 text-xs rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            ✓
          </button>
          <button
            type="button"
            disabled={updating}
            onClick={() => onMark('incompatible')}
            className="px-2 py-0.5 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            ✗
          </button>
        </div>
      )}
    </div>
  );
}

// ── Group matched inventory by component type ──

function groupByComponent(matchedInventory) {
  const groups = {};
  for (const mi of matchedInventory || []) {
    const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
    const compType = inv?.componentId?.componentType || 'Unknown';
    if (!groups[compType]) groups[compType] = [];
    groups[compType].push(mi);
  }
  return groups;
}

export default function MatchReviewStep({
  requestDoc, matchedResult, matching, onMatch, onReject, shortages,
  onCrossmatchUpdate, crossmatchUpdating,
}) {
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const status = requestDoc?.status;
  const canMatch = !!requestDoc?._id && status === 'pending' && !matching;
  const canReject = !!requestDoc?._id && ['pending', 'matched', 'approved'].includes(status);
  const recipientGroup = requestDoc?.requestedComponents?.[0]?.bloodGroup || null;

  const grouped = groupByComponent(requestDoc?.matchedInventory);

  return (
    <div className="p-6 space-y-5">
      <RejectRequestModal
        isOpen={rejectConfirmOpen}
        onClose={() => setRejectConfirmOpen(false)}
        onConfirm={(reason) => {
          onReject(reason);
          setRejectConfirmOpen(false);
        }}
        requestId={requestDoc?.requestId}
      />

      {/* Compatibility Reference (collapsible) */}
      <CompatibilityMatrix recipientGroup={recipientGroup} />

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Match Results (Compatibility-Aware FIFO)</h3>
        <div className="flex gap-3">
          <button
            disabled={!canMatch}
            onClick={onMatch}
            className={`px-4 py-2 rounded-lg text-white ${
              canMatch
                ? 'bg-orange-800 hover:bg-orange-900 cursor-pointer'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {matching ? 'Matching…' : 'Re-run Match'}
          </button>
          <button
            disabled={!canReject}
            onClick={() => setRejectConfirmOpen(true)}
            className={`px-4 py-2 rounded-lg border ${
              canReject
                ? 'border-red-200 text-red-700 hover:bg-red-50 cursor-pointer'
                : 'border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Reject Request
          </button>
        </div>
      </div>

      {/* Shortages */}
      {Array.isArray(shortages) && shortages.length > 0 && (
        <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900">
          <p className="font-medium">Insufficient compatible stock to fully match this request.</p>
          <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
            {shortages.map((s, idx) => (
              <li key={idx}>
                <strong>{s.componentType}</strong> ({s.bloodGroup} {s.rh}): {s.available} of {s.required} available.
                {Array.isArray(s.compatibleGroupsSearched) && (
                  <span className="text-xs text-amber-700 ml-1">
                    Searched: {s.compatibleGroupsSearched.join(', ')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Match result summary */}
      {matchedResult && (
        <div className="p-4 rounded-lg border border-green-200 bg-green-50 text-green-900">
          <p className="font-medium">Reserved units: {matchedResult?.matchedCount}</p>
          {Array.isArray(matchedResult?.inventoryIds) && matchedResult.inventoryIds.length > 0 && (
            <p className="text-sm mt-1">Inventory IDs: {matchedResult.inventoryIds.join(', ')}</p>
          )}
        </div>
      )}

      {/* Request Summary + Grouped Matched Inventory */}
      {requestDoc && (
        <div className="border rounded-lg">
          <div className="p-3 border-b bg-gray-50 rounded-t-lg font-medium">Request Summary</div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="text-gray-600">Request ID:</span> <strong>{requestDoc.requestId}</strong></p>
              <p><span className="text-gray-600">Status:</span> <strong className="capitalize">{requestDoc.status}</strong></p>
            </div>
            <div>
              <p><span className="text-gray-600">Patient:</span> <strong>{requestDoc.patient?.name}</strong> ({requestDoc.patient?.age}/{requestDoc.patient?.sex})</p>
              <p><span className="text-gray-600">Hospital:</span> <strong>{requestDoc.hospitalId?.name || '—'}</strong></p>
            </div>
          </div>

          {/* Component-wise grouped inventory */}
          <div className="p-4 border-t">
            <h4 className="font-semibold mb-3">Reserved Inventory (by Component)</h4>
            {Object.keys(grouped).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(grouped).map(([compType, items]) => (
                  <div key={compType} className="border rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50 border-b flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-800">{compType}</span>
                      <span className="text-xs text-gray-500">({items.length} unit{items.length > 1 ? 's' : ''})</span>
                      {compType === 'RBC' && (
                        <span className="ml-auto text-xs text-red-600 font-medium flex items-center gap-1">
                          🔬 Crossmatch Required
                        </span>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600 bg-gray-50">
                            <th className="p-2">Bag No</th>
                            <th className="p-2">Blood</th>
                            <th className="p-2">Compatibility</th>
                            <th className="p-2">Crossmatch</th>
                            <th className="p-2">Reserved At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((mi) => {
                            const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
                            const invId = inv?._id || mi.inventoryId;
                            const bagNo = inv?.bagNo?.bagNo || '—';
                            const blood = inv?.bagNo
                              ? `${inv.bagNo.bloodGroup} ${inv.bagNo.rh}`
                              : '—';

                            return (
                              <tr key={invId} className="border-t hover:bg-gray-50 transition-colors">
                                <td className="p-2 font-mono text-xs">{bagNo}</td>
                                <td className="p-2 font-semibold">{blood}</td>
                                <td className="p-2">
                                  <CompatBadge type={mi.compatibilityType || 'exact'} />
                                </td>
                                <td className="p-2">
                                  <CrossmatchBadge
                                    status={mi.crossmatchStatus || 'not-required'}
                                    required={mi.crossmatchRequired || false}
                                    updating={crossmatchUpdating}
                                    onMark={
                                      onCrossmatchUpdate && mi.crossmatchRequired && mi.crossmatchStatus === 'pending'
                                        ? (s) => onCrossmatchUpdate(invId, s)
                                        : null
                                    }
                                  />
                                </td>
                                <td className="p-2 text-xs text-gray-500">
                                  {mi?.reservedAt ? new Date(mi.reservedAt).toLocaleString() : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No inventory reserved yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
