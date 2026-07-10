import React, { useState } from 'react';
import CompatibilityMatrix from '../components/CompatibilityMatrix';
import { ConfirmModal, RejectRequestModal } from '@/components/shared';

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

function CrossmatchStatusBadge({ status, required }) {
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
  return badges[status] || badges.pending;
}

// Manual crossmatch worksheet — shown for every component (no auto-compatible
// shortcut for exact ABO/Rh matches). The operator must explicitly pick the
// compatibility type; there is no default selection.
const COMPATIBILITY_RESULT_LABELS = {
  MAJOR_COMPATIBLE: 'Major Compatible',
  MINOR_COMPATIBLE: 'Minor Compatible',
  UNIVERSAL: 'Universal',
};

function CrossmatchWorksheet({ invId, onSave, updating }) {
  const [compatibility, setCompatibility] = useState('');
  const [doneAt, setDoneAt] = useState('');
  const [seenAt, setSeenAt] = useState('');

  const canSave = compatibility && doneAt && seenAt;

  const handleSave = () => {
    if (!canSave) return;
    onSave(invId, 'compatible', {
      compatibilityResult: compatibility,
      crossmatchDoneAt: new Date(doneAt).toISOString(),
      crossmatchSeenAt: new Date(seenAt).toISOString(),
    });
  };

  return (
    <div className="mt-2 p-3 rounded-lg border border-amber-300 bg-white space-y-2 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Crossmatch Done At <span className="text-red-600">*</span></label>
          <input
            type="datetime-local"
            value={doneAt}
            onChange={(e) => setDoneAt(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Seen At <span className="text-red-600">*</span></label>
          <input
            type="datetime-local"
            value={seenAt}
            onChange={(e) => setSeenAt(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white"
          />
        </div>
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
            className={`px-4 py-2 rounded-lg text-white ${canMatch
                ? 'bg-orange-800 hover:bg-orange-900 cursor-pointer'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
          >
            {matching ? 'Matching…' : 'Re-run Match'}
          </button>
          <button
            disabled={!canReject}
            onClick={() => setRejectConfirmOpen(true)}
            className={`px-4 py-2 rounded-lg border ${canReject
                ? 'border-red-200 text-red-700 hover:bg-red-50 cursor-pointer'
                : 'border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            Reject Request
          </button>
        </div>
      </div>

      {/* Shortages / Unavailable Components */}
      {Array.isArray(shortages) && shortages.length > 0 && (
        <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900">
          <p className="font-medium">⚠️ Partial match — some components are unavailable in stock.</p>
          <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
            {shortages.map((s, idx) => (
              <li key={idx}>
                <strong>{s.componentType}</strong> ({s.bloodGroup} {s.rh}): only {s.available} of {s.required} unit{s.required > 1 ? 's' : ''} available.
                {s.available === 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-200 border border-gray-300 text-gray-700">
                    Unavailable
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-700 font-medium">The available components have been reserved. Unavailable components will be marked as "Unavailable" throughout the request.</p>
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
                      {items.some((mi) => mi.crossmatchRequired) && (
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
                            <th className="p-2">Segment No</th>
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
                            const segmentNo = inv?.bagNo?.segmentNo || '—';
                            const blood = inv?.bagNo
                              ? `${inv.bagNo.bloodGroup} ${inv.bagNo.rh}`
                              : '—';

                            const rc = requestDoc?.requestedComponents?.find(
                              (c) => c.componentType === compType
                            );
                            const isGroupMismatch = rc && inv?.bagNo && (
                              inv.bagNo.bloodGroup !== rc.bloodGroup ||
                              inv.bagNo.rh !== rc.rh
                            );
                            let mismatchWarning = null;
                            if (isGroupMismatch) {
                              const patGroupText = `${rc.bloodGroup} ${rc.rh}`;
                              const bagGroupText = `${inv.bagNo.bloodGroup} ${inv.bagNo.rh}`;
                              mismatchWarning = `${patGroupText} patient is receiving ${bagGroupText} ${compType}`;
                            }

                            const showWorksheet = mi.crossmatchRequired && mi.crossmatchStatus === 'pending' && !!onCrossmatchUpdate;
                            const showSavedResult = mi.crossmatchRequired && mi.crossmatchStatus !== 'pending' && !!mi.compatibilityResult;

                            return (
                              <React.Fragment key={invId}>
                                <tr className="border-t hover:bg-gray-50 transition-colors">
                                  <td className="p-2 font-mono text-xs font-bold text-gray-800">{bagNo}</td>
                                  <td className="p-2 font-mono text-xs font-bold text-gray-800">{segmentNo}</td>
                                  <td className="p-2">
                                    <div className="font-semibold">{blood}</div>
                                    {mismatchWarning && (
                                      <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 mt-1.5 font-bold w-max flex items-center gap-1.5 shadow-sm">
                                        <span className="text-amber-500 text-sm">⚠️</span> {mismatchWarning}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-2">
                                    <CompatBadge type={mi.compatibilityType || 'exact'} />
                                  </td>
                                  <td className="p-2 align-top">
                                    <CrossmatchStatusBadge
                                      status={mi.crossmatchStatus || 'not-required'}
                                      required={mi.crossmatchRequired || false}
                                    />
                                    {showSavedResult && (
                                      <div className="mt-1.5 text-2xs text-gray-500 space-y-0.5">
                                        <div>Compatibility: <span className="font-medium">{COMPATIBILITY_RESULT_LABELS[mi.compatibilityResult] || mi.compatibilityResult}</span></div>
                                        {mi.crossmatchDoneAt && <div>Done At: {new Date(mi.crossmatchDoneAt).toLocaleString()}</div>}
                                        {mi.crossmatchSeenAt && <div>Seen At: {new Date(mi.crossmatchSeenAt).toLocaleString()}</div>}
                                        {mi.cardNumber && <div>Card #: {mi.cardNumber}</div>}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-2 text-xs text-gray-500 align-top">
                                    {mi?.reservedAt ? new Date(mi.reservedAt).toLocaleString() : '—'}
                                  </td>
                                </tr>
                                {showWorksheet && (
                                  <tr className="border-t-0 bg-amber-50/30">
                                    <td colSpan={6} className="p-2">
                                      <CrossmatchWorksheet
                                        invId={invId}
                                        onSave={onCrossmatchUpdate}
                                        updating={crossmatchUpdating}
                                      />
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
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

            {/* Unavailable components from partial shortages */}
            {Array.isArray(shortages) && shortages.length > 0 && (
              <div className="space-y-4 mt-4">
                {shortages.filter(s => s.available === 0).map((s, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden opacity-75">
                    <div className="px-3 py-2 bg-gray-100 border-b flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-500">{s.componentType}</span>
                      <span className="text-xs text-gray-400">({s.required} unit{s.required > 1 ? 's' : ''} requested)</span>
                      <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-200 border border-gray-300 text-gray-600">
                        Unavailable
                      </span>
                    </div>
                    <div className="px-3 py-3 text-sm text-gray-500 italic">
                      No compatible {s.componentType} ({s.bloodGroup} {s.rh}) units are currently available in stock.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
