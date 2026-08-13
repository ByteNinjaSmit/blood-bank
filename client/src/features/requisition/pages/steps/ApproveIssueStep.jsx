import React from 'react';
import { COMPATIBILITY_RESULT_LABELS } from '../components/grading';

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
  if (!required || status === 'not-required') return <span className="text-xs text-gray-400">N/A</span>;
  const map = {
    pending: <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-200">⏳ Pending</span>,
    compatible: <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">✅ Compatible</span>,
    incompatible: <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">❌ Incompatible</span>,
  };
  return map[status] || map.pending;
}

export default function ApproveIssueStep({ requestDoc, approving, issuing, onApprove, onIssue, shortages, step2Reasons = [] }) {
  const status = requestDoc?.status;
  // Approve (and, downstream, Issue) stays blocked until the recipient
  // serum/cell grouping, every proposed bag's grouping, and the crossmatch
  // worksheet are recorded. Once approved, those fields are locked in so the
  // gate no longer applies.
  const worksheetIncomplete = status === 'matched' && step2Reasons.length > 0;
  const canApprove = !!requestDoc?._id && status === 'matched' && !approving && step2Reasons.length === 0;
  // Units stay "Pending" (not issuable) until the request has actually been
  // approved — the Issue button only appears once that's happened.
  const isApproved = ['approved', 'issued', 'completed'].includes(status);

  // Unavailable components (from partial match shortages)
  const unavailableComponents = React.useMemo(() => {
    if (!Array.isArray(shortages) || !shortages.length) return [];
    return shortages.filter(s => s.available === 0);
  }, [shortages]);

  // ── Crossmatch safety check (for warning display) ──
  const pendingCrossmatch = (requestDoc?.matchedInventory || []).filter(
    (mi) => mi.crossmatchRequired && mi.crossmatchStatus === 'pending'
  );
  const incompatibleCrossmatch = (requestDoc?.matchedInventory || []).filter(
    (mi) => mi.crossmatchRequired && mi.crossmatchStatus === 'incompatible'
  );
  const hasCrossmatchBlocker = pendingCrossmatch.length > 0 || incompatibleCrossmatch.length > 0;

  // Group matched inventory by component type — each group gets its own
  // "Issue" button at the end so units can be issued component-wise.
  const groupedInventory = React.useMemo(() => {
    const groups = {};
    for (const mi of requestDoc?.matchedInventory || []) {
      const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
      const compType = inv?.componentId?.componentType || 'Unknown';
      if (!groups[compType]) groups[compType] = [];
      groups[compType].push(mi);
    }
    return groups;
  }, [requestDoc]);

  return (
    <div className="p-6 space-y-4">
      <h3 className="font-semibold text-gray-800">Approve and Issue</h3>

      {/* Crossmatch blocker warnings (static feedback panel) */}
      {hasCrossmatchBlocker && (
        <div className="space-y-2">
          {pendingCrossmatch.length > 0 && (
            <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold">Crossmatch Pending</p>
                <p>{pendingCrossmatch.length} PRBC unit(s) still have pending crossmatch. PRBC units must be compatible to issue, but other components can be issued now.</p>
              </div>
            </div>
          )}
          {incompatibleCrossmatch.length > 0 && (
            <div className="p-3 rounded-lg border border-red-300 bg-red-50 text-red-900 text-sm flex items-start gap-2">
              <span className="text-lg">🚫</span>
              <div>
                <p className="font-semibold">Crossmatch Incompatible</p>
                <p>{incompatibleCrossmatch.length} PRBC unit(s) marked incompatible. Replace these units before issuing them.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {worksheetIncomplete ? (
        <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900">
          <p className="font-medium">Complete these in Match Review before you can approve &amp; issue:</p>
          <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
            {step2Reasons.map((r, idx) => (<li key={idx}>{r}</li>))}
          </ul>
          <p className="mt-2 text-xs text-amber-700">
            Fill the recipient serum/cell grouping, each bag&apos;s grouping and the crossmatch worksheet, then return here.
          </p>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            disabled={!canApprove}
            onClick={onApprove}
            className={`px-4 py-2 rounded-lg text-white ${
              canApprove
                ? 'bg-blue-700 hover:bg-blue-800 cursor-pointer'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {approving ? 'Approving…' : 'Approve'}
          </button>
        </div>
      )}

      {requestDoc && (
        <div className="mt-2 text-sm text-gray-700">Current Status: <strong className="capitalize">{requestDoc.status}</strong></div>
      )}

      {requestDoc && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-4">
          <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
            <h4 className="font-semibold text-gray-800 text-sm">Requisition Details & Requirements</h4>
            <span className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-lg uppercase tracking-wider font-mono">
              ID: {requestDoc.requestId || requestDoc.requisitionId || '—'}
            </span>
          </div>

          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Patient Info Card */}
            <div className="space-y-3 lg:border-r lg:border-gray-100 lg:pr-8">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <span className="w-1.5 h-3.5 bg-red-700 rounded-full"></span>
                <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">Patient Details</h5>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-sm">
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide font-medium block">Name</span>
                  <p className="font-semibold text-gray-800 mt-0.5">{requestDoc.patient?.name || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide font-medium block">Patient ID</span>
                  <p className="font-mono text-gray-800 text-xs font-semibold mt-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-200/50 w-fit">{requestDoc.patient?.patientPublicId || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide font-medium block">MRN</span>
                  <p className="font-mono text-gray-800 text-xs font-semibold mt-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-200/50 w-fit">{requestDoc.patient?.mrn || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide font-medium block">Age / Sex</span>
                  <p className="font-semibold text-gray-800 mt-0.5">{requestDoc.patient?.age || '—'} {requestDoc.patient?.ageUnit === 'DAYS' ? 'D' : 'Y'} / {requestDoc.patient?.sex || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide font-medium block">Clinician</span>
                  <p className="font-semibold text-gray-800 mt-0.5">{requestDoc.doctorName || '—'}</p>
                </div>
              </div>
            </div>

            {/* Requested Components Card */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <span className="w-1.5 h-3.5 bg-red-700 rounded-full"></span>
                <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">Requested Components</h5>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {requestDoc.requestedComponents?.map((rc, idx) => {
                  const isPositive = rc.rh === 'Positive' || rc.rhFactor === 'POSITIVE' || String(rc.rh).toLowerCase().includes('pos');
                  const bloodSign = isPositive ? '+' : '-';
                  return (
                    <div key={idx} className={`border p-3 rounded-xl flex items-center justify-between ${rc.status === 'REJECTED' ? 'bg-red-50/60 border-red-200' : 'bg-gray-50/60 border-gray-200'}`}>
                      <div>
                        <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                          {rc.componentType}
                          {rc.status === 'REJECTED' && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-200 text-red-800 border border-red-300">Rejected</span>}
                          {rc.status === 'UNAVAILABLE' && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-600 border border-gray-300">Unavailable</span>}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">Group: {rc.bloodGroup}{bloodSign}</p>
                        {rc.status === 'REJECTED' && rc.rejectionReason && <p className="text-[11px] text-red-600 mt-0.5">{rc.rejectionReason}</p>}
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800">
                          {rc.units} Unit{rc.units > 1 ? 's' : ''}
                        </span>
                        <p className={`text-[10px] capitalize font-bold mt-1 tracking-wider uppercase ${rc.urgency === 'urgent' ? 'text-red-600' : 'text-gray-400'}`}>
                          {rc.urgency || 'regular'}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {!requestDoc.requestedComponents?.length && (
                  <p className="text-sm text-gray-400 italic">No requested components specified.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {Object.keys(groupedInventory).length > 0 && (
        <div className="mt-4 space-y-4">
          <h4 className="font-semibold mb-2">Units to Issue (by Component)</h4>
          {Object.entries(groupedInventory).map(([compType, items]) => {
            return (
              <div key={compType} className="border rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-800">{compType}</span>
                  <span className="text-xs text-gray-500">({items.length} unit{items.length > 1 ? 's' : ''})</span>
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
                        <th className="p-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((mi) => {
                        const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
                        const invId = inv?._id || mi.inventoryId;
                        const bagNo = inv?.bagNo?.bagNo || '—';
                        const segmentNo = inv?.bagNo?.segmentNo || '—';
                        const blood = inv?.bagNo ? `${inv.bagNo.bloodGroup} ${inv.bagNo.rh}` : '—';

                        const rc = requestDoc?.requestedComponents?.find((c) => c.componentType === compType);
                        const isGroupMismatch = rc && inv?.bagNo && (
                          inv.bagNo.bloodGroup !== rc.bloodGroup || inv.bagNo.rh !== rc.rh
                        );
                        let mismatchWarning = null;
                        if (isGroupMismatch) {
                          const patGroupText = `${rc.bloodGroup} ${rc.rh}`;
                          const bagGroupText = `${inv.bagNo.bloodGroup} ${inv.bagNo.rh}`;
                          mismatchWarning = `${patGroupText} patient is receiving ${bagGroupText} ${compType}`;
                        }

                        return (
                          <tr key={invId} className="border-t hover:bg-gray-50 transition-colors">
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
                            <td className="p-2"><CompatBadge type={mi.compatibilityType || 'exact'} /></td>
                            <td className="p-2 align-top">
                              <CrossmatchStatusBadge status={mi.crossmatchStatus || 'not-required'} required={mi.crossmatchRequired || false} />
                              {mi.crossmatchRequired && mi.crossmatchStatus === 'compatible' && (mi.compatibilityResult || mi.crossmatchDoneAt) && (
                                <div className="mt-1.5 text-2xs text-gray-500 space-y-0.5">
                                  {mi.compatibilityResult && <div>Result: <span className="font-medium">{COMPATIBILITY_RESULT_LABELS[mi.compatibilityResult] || mi.compatibilityResult}</span></div>}
                                  {mi.crossmatchDoneAt && <div>Done: {new Date(mi.crossmatchDoneAt).toLocaleString()}</div>}
                                  {mi.crossmatchSeenAt && <div>Seen: {new Date(mi.crossmatchSeenAt).toLocaleString()}</div>}
                                  {mi.cardNumber && <div>Card #: {mi.cardNumber}</div>}
                                </div>
                              )}
                            </td>
                            <td className="p-2 text-xs text-gray-500">{mi?.reservedAt ? new Date(mi.reservedAt).toLocaleString() : '—'}</td>
                            <td className="p-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {inv?.status === 'ISSUED' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 border border-green-200 text-green-800">
                                    ✅ Issued {mi.issueId ? `(${mi.issueId})` : ''}
                                  </span>
                                ) : mi.crossmatchRequired && mi.crossmatchStatus === 'pending' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800" title="Crossmatch pending">
                                    ⏳ XM Pending
                                  </span>
                                ) : mi.crossmatchRequired && mi.crossmatchStatus === 'incompatible' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 border border-red-200 text-red-800" title="Crossmatch incompatible">
                                    🚫 Incompatible
                                  </span>
                                ) : !isApproved ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 border border-gray-300 text-gray-600" title="Waiting for Approve">
                                    ⏳ Pending
                                  </span>
                                ) : (
                                  <>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-800">
                                      Reserved
                                    </span>
                                    <button
                                      type="button"
                                      disabled={issuing}
                                      onClick={() => onIssue([invId])}
                                      className="px-3 py-1 bg-green-700 hover:bg-green-800 text-white rounded text-xs font-bold transition active:scale-95 disabled:bg-gray-305 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                      {issuing ? 'Issuing…' : 'Issue'}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unavailable components section */}
      {unavailableComponents.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2 text-gray-500">Unavailable Components</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="p-2">Bag No</th>
                  <th className="p-2">Segment No</th>
                  <th className="p-2">Component</th>
                  <th className="p-2">Blood</th>
                  <th className="p-2">Compatibility</th>
                  <th className="p-2">Crossmatch</th>
                  <th className="p-2">Reserved At</th>
                  <th className="p-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {unavailableComponents.map((s, idx) => (
                  <tr key={idx} className="border-t bg-gray-50 opacity-60">
                    <td className="p-2 font-mono text-xs text-gray-400">—</td>
                    <td className="p-2 font-mono text-xs text-gray-400">—</td>
                    <td className="p-2 text-gray-500 font-medium">{s.componentType}</td>
                    <td className="p-2 text-gray-400">{s.bloodGroup} {s.rh}</td>
                    <td className="p-2 text-gray-400">—</td>
                    <td className="p-2 text-gray-400">—</td>
                    <td className="p-2 text-gray-400">—</td>
                    <td className="p-2 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 border border-gray-300 text-gray-500">
                        Unavailable
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
