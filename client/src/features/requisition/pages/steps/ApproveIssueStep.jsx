import React, { useState } from 'react';
import { ConfirmModal } from '../../../components/shared';

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
                  return (
                    <tr key={invId} className="border-t">
                      <td className="p-2 font-mono text-xs">{inv?.bagNo?.bagNo || '—'}</td>
                      <td className="p-2">{inv?.componentId?.componentType || '—'}</td>
                      <td className="p-2 font-semibold">{inv?.bagNo ? `${inv.bagNo.bloodGroup} ${inv.bagNo.rh}` : '—'}</td>
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
