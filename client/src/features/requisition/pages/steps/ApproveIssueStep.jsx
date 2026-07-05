import React, { useState } from 'react';
import { ConfirmModal } from '@/components/shared';

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
  const status = requestDoc?.status;
  const hasMatches = Array.isArray(requestDoc?.matchedInventory) && requestDoc.matchedInventory.length > 0;
  const canApprove = !!requestDoc?._id && status === 'matched' && !approving;
  const canIssue = !!requestDoc?._id && ['matched', 'approved'].includes(status) && hasMatches && !issuing;

  // ── Crossmatch safety check ──
  // Block issuing if any RBC unit has pending or incompatible crossmatch
  const pendingCrossmatch = (requestDoc?.matchedInventory || []).filter(
    (mi) => mi.crossmatchRequired && mi.crossmatchStatus === 'pending'
  );
  const incompatibleCrossmatch = (requestDoc?.matchedInventory || []).filter(
    (mi) => mi.crossmatchRequired && mi.crossmatchStatus === 'incompatible'
  );
  const hasCrossmatchBlocker = pendingCrossmatch.length > 0 || incompatibleCrossmatch.length > 0;
  const safeToIssue = canIssue && !hasCrossmatchBlocker;

  const handleIssueClick = () => {
    if (!safeToIssue) return;
    setConfirmOpen(true);
  };

  const count = Array.isArray(requestDoc?.matchedInventory) ? requestDoc.matchedInventory.length : 0;

  return (
    <div className="p-6 space-y-4">
      <h3 className="font-semibold text-gray-800">Approve and Issue</h3>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onIssue}
        title="Issue Blood Units"
        message={`Are you sure you want to issue ${count} unit(s) for request ${requestDoc?.requestId}? This action will finalize the reservation.`}
        confirmText="Yes, Issue Units"
        type="info"
      />

      {/* Crossmatch blocker warnings */}
      {hasCrossmatchBlocker && (
        <div className="space-y-2">
          {pendingCrossmatch.length > 0 && (
            <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold">Crossmatch Pending</p>
                <p>{pendingCrossmatch.length} RBC unit(s) still have pending crossmatch. Complete crossmatch testing before issuing.</p>
              </div>
            </div>
          )}
          {incompatibleCrossmatch.length > 0 && (
            <div className="p-3 rounded-lg border border-red-300 bg-red-50 text-red-900 text-sm flex items-start gap-2">
              <span className="text-lg">🚫</span>
              <div>
                <p className="font-semibold">Crossmatch Incompatible</p>
                <p>{incompatibleCrossmatch.length} RBC unit(s) marked incompatible. Go back to Match Review to resolve or replace.</p>
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
          disabled={!safeToIssue}
          onClick={handleIssueClick}
          className={`px-4 py-2 rounded-lg text-white ${
            safeToIssue
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
                  <th className="p-2">Component</th>
                  <th className="p-2">Blood</th>
                  <th className="p-2">Compatibility</th>
                  <th className="p-2">Crossmatch</th>
                  <th className="p-2">Reserved At</th>
                </tr>
              </thead>
              <tbody>
                {requestDoc.matchedInventory.map((mi) => {
                  const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
                  const invId = inv?._id || mi.inventoryId;
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
                      <td className="p-2 font-mono text-xs">{inv?.bagNo?.bagNo || '—'}</td>
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
