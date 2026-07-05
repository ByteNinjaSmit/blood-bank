import React, { useState, useEffect } from 'react';

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

export default function ApproveIssueStep({ requestDoc, approving, issuing, onApprove, onIssue }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUnitIds, setSelectedUnitIds] = useState([]);
  const status = requestDoc?.status;
  const hasMatches = Array.isArray(requestDoc?.matchedInventory) && requestDoc.matchedInventory.length > 0;
  const canApprove = !!requestDoc?._id && status === 'matched' && !approving;
  const canIssue = !!requestDoc?._id && ['matched', 'approved'].includes(status) && hasMatches;

  // ── Crossmatch safety check (for warning display) ──
  const pendingCrossmatch = (requestDoc?.matchedInventory || []).filter(
    (mi) => mi.crossmatchRequired && mi.crossmatchStatus === 'pending'
  );
  const incompatibleCrossmatch = (requestDoc?.matchedInventory || []).filter(
    (mi) => mi.crossmatchRequired && mi.crossmatchStatus === 'incompatible'
  );
  const hasCrossmatchBlocker = pendingCrossmatch.length > 0 || incompatibleCrossmatch.length > 0;

  // Group inventory by component type for rendering in the selection modal
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

  // Count metrics for modal
  const totalCount = requestDoc?.matchedInventory?.length || 0;
  const alreadyIssuedCount = requestDoc?.matchedInventory?.filter(mi => {
    const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
    return inv?.status === 'ISSUED';
  }).length || 0;
  const remainingCount = totalCount - alreadyIssuedCount;

  // Initialize selected unit IDs when opening the modal
  useEffect(() => {
    if (confirmOpen && requestDoc?.matchedInventory) {
      const pendingIds = requestDoc.matchedInventory
        .filter((mi) => {
          const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
          const isIssued = inv?.status === 'ISSUED';
          const isXmBlocked = mi.crossmatchRequired && mi.crossmatchStatus !== 'compatible';
          return !isIssued && !isXmBlocked;
        })
        .map((mi) => {
          const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
          return inv?._id || mi.inventoryId;
        })
        .filter(Boolean);
      setSelectedUnitIds(pendingIds);
    }
  }, [confirmOpen, requestDoc]);

  const toggleUnitSelection = (unitId) => {
    setSelectedUnitIds((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  };

  const handleIssueClick = () => {
    if (!canIssue) return;
    setConfirmOpen(true);
  };

  return (
    <div className="p-6 space-y-4">
      <h3 className="font-semibold text-gray-800">Approve and Issue</h3>

      {/* Custom Component-Wise Issuing Selection Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-150 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-150 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  Select Units to Issue
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select which reserved bags to issue for request {requestDoc?.requestId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-semibold p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {Object.keys(groupedInventory).length > 0 ? (
                Object.entries(groupedInventory).map(([compType, items]) => (
                  <div key={compType} className="border border-gray-150 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-150 flex items-center justify-between">
                      <span className="font-semibold text-sm text-gray-800 uppercase tracking-wider">{compType}</span>
                      <span className="text-xs text-gray-500 font-medium">({items.length} units total)</span>
                    </div>
                    <div className="divide-y divide-gray-150">
                      {items.map((mi) => {
                        const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
                        const unitId = inv?._id || mi.inventoryId;
                        const isIssued = inv?.status === 'ISSUED';
                        const isCrossmatchPending = mi.crossmatchRequired && mi.crossmatchStatus === 'pending';
                        const isCrossmatchIncompatible = mi.crossmatchRequired && mi.crossmatchStatus === 'incompatible';
                        const isXmBlocked = isCrossmatchPending || isCrossmatchIncompatible;
                        const isCheckboxDisabled = isIssued || isXmBlocked;
                        const isSelected = selectedUnitIds.includes(unitId);
                        
                        const bagNo = inv?.bagNo?.bagNo || '—';
                        const groupText = inv?.bagNo ? `${inv.bagNo.bloodGroup} ${inv.bagNo.rh}` : '—';
                        
                        return (
                          <div 
                            key={unitId} 
                            onClick={() => !isCheckboxDisabled && toggleUnitSelection(unitId)}
                            className={`p-3.5 flex items-center justify-between transition-colors ${
                              isCheckboxDisabled 
                                ? 'bg-gray-50/50 cursor-not-allowed opacity-80' 
                                : 'hover:bg-orange-50/20 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              <input
                                type="checkbox"
                                checked={isIssued || isSelected}
                                disabled={isCheckboxDisabled}
                                onChange={() => {}} // Controlled by row onClick
                                className={`w-4 h-4 rounded text-green-700 border-gray-300 focus:ring-green-600 transition ${
                                  isCheckboxDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                                }`}
                              />
                              <div>
                                <div className="font-mono text-sm font-bold text-gray-700">{bagNo}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                  <span>{groupText}</span>
                                  <span>•</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    mi.compatibilityType === 'exact' 
                                      ? 'bg-green-50 text-green-700 border border-green-200' 
                                      : 'bg-yellow-50 text-yellow-750 border border-yellow-200'
                                  }`}>
                                    {mi.compatibilityType === 'exact' ? 'Exact Match' : 'Compatible'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {isIssued ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 border border-green-200 text-green-800">
                                  ✅ Issued
                                </span>
                              ) : isCrossmatchPending ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800">
                                  ⏳ XM Pending
                                </span>
                              ) : isCrossmatchIncompatible ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 border border-red-200 text-red-800">
                                  🚫 Incompatible
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-800">
                                  Reserved
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No reserved units to display.</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-150 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                {selectedUnitIds.length} of {remainingCount} pending unit(s) selected
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="px-4 py-2 border border-gray-250 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-800 transition active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedUnitIds.length === 0 || issuing}
                  onClick={async () => {
                    await onIssue(selectedUnitIds);
                    setConfirmOpen(false);
                  }}
                  className={`px-5 py-2 rounded-lg text-sm font-bold text-white transition active:scale-95 flex items-center gap-2 ${
                    selectedUnitIds.length === 0 || issuing
                      ? 'bg-gray-305 cursor-not-allowed opacity-75'
                      : 'bg-green-700 hover:bg-green-800 cursor-pointer shadow'
                  }`}
                >
                  {issuing ? 'Issuing…' : 'Issue Selected'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crossmatch blocker warnings (static feedback panel) */}
      {hasCrossmatchBlocker && (
        <div className="space-y-2">
          {pendingCrossmatch.length > 0 && (
            <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold">Crossmatch Pending</p>
                <p>{pendingCrossmatch.length} RBC unit(s) still have pending crossmatch. RBC units must be compatible to issue, but other components can be issued now.</p>
              </div>
            </div>
          )}
          {incompatibleCrossmatch.length > 0 && (
            <div className="p-3 rounded-lg border border-red-300 bg-red-50 text-red-900 text-sm flex items-start gap-2">
              <span className="text-lg">🚫</span>
              <div>
                <p className="font-semibold">Crossmatch Incompatible</p>
                <p>{incompatibleCrossmatch.length} RBC unit(s) marked incompatible. Replace these units before issuing them.</p>
              </div>
            </div>
          )}
        </div>
      )}

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
        <button
          disabled={!canIssue}
          onClick={handleIssueClick}
          className={`px-4 py-2 rounded-lg text-white ${
            canIssue
              ? 'bg-green-700 hover:bg-green-800 cursor-pointer'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {issuing ? 'Issuing…' : 'Issue Units'}
        </button>
      </div>

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
                  <span className="text-gray-400 text-xs uppercase tracking-wide font-medium block">MRN</span>
                  <p className="font-mono text-gray-800 text-xs font-semibold mt-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-200/50 w-fit">{requestDoc.patient?.mrn || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide font-medium block">Age / Sex</span>
                  <p className="font-semibold text-gray-800 mt-0.5">{requestDoc.patient?.age || '—'} Y / {requestDoc.patient?.sex || '—'}</p>
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
                    <div key={idx} className="bg-gray-50/60 border border-gray-200 p-3 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{rc.componentType}</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">Group: {rc.bloodGroup}{bloodSign}</p>
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

      {requestDoc?.matchedInventory?.length ? (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Units to Issue</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="p-2">Bag No</th>
                  <th className="p-2">Segment No</th>
                  <th className="p-2">Component</th>
                  <th className="p-2">Blood</th>
                  <th className="p-2">Compatibility</th>
                  <th className="p-2">Crossmatch</th>
                  <th className="p-2">Reserved At</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requestDoc.matchedInventory.map((mi) => {
                  const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
                  const invId = inv?._id || mi.inventoryId;
                  const bagNo = inv?.bagNo?.bagNo || '—';
                  const segmentNo = inv?.bagNo?.segmentNo || '—';
                  const compType = inv?.componentId?.componentType || '—';
                  const blood = inv?.bagNo ? `${inv.bagNo.bloodGroup} ${inv.bagNo.rh}` : '—';

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

                  return (
                    <tr key={invId} className="border-t">
                      <td className="p-2 font-mono text-xs font-bold text-gray-800">{bagNo}</td>
                      <td className="p-2 font-mono text-xs font-bold text-gray-800">{segmentNo}</td>
                      <td className="p-2">{compType}</td>
                      <td className="p-2">
                        <div className="font-semibold">{blood}</div>
                        {mismatchWarning && (
                          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 mt-1.5 font-bold w-max flex items-center gap-1.5 shadow-sm">
                            <span className="text-amber-500 text-sm">⚠️</span> {mismatchWarning}
                          </div>
                        )}
                      </td>
                      <td className="p-2"><CompatBadge type={mi.compatibilityType || 'exact'} /></td>
                      <td className="p-2">
                        <CrossmatchStatusBadge status={mi.crossmatchStatus || 'not-required'} required={mi.crossmatchRequired || false} />
                      </td>
                      <td className="p-2 text-xs text-gray-500">{mi?.reservedAt ? new Date(mi.reservedAt).toLocaleString() : '—'}</td>
                      <td className="p-2 text-right">
                        {inv?.status === 'ISSUED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 border border-green-200 text-green-800">
                            ✅ Issued
                          </span>
                        ) : mi.crossmatchRequired && mi.crossmatchStatus === 'pending' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800" title="Crossmatch pending">
                            ⏳ XM Pending
                          </span>
                        ) : mi.crossmatchRequired && mi.crossmatchStatus === 'incompatible' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 border border-red-200 text-red-800" title="Crossmatch incompatible">
                            🚫 Incompatible
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={issuing}
                            onClick={() => onIssue([invId])}
                            className="px-3 py-1 bg-green-700 hover:bg-green-800 text-white rounded text-xs font-bold transition active:scale-95 disabled:bg-gray-305 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {issuing ? 'Issuing…' : 'Issue'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
