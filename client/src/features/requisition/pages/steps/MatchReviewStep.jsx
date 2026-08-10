import React, { useState } from 'react';
import CompatibilityMatrix from '../components/CompatibilityMatrix';
import MatchedBagCard from '../components/MatchedBagCard';
import ComponentRejectModal from '../components/ComponentRejectModal';
import { componentColor } from '../components/component-colors';
import { RejectRequestModal } from '@/components/shared';

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
  fetchAvailableUnits, onSwapBag, swapping,
  onConfirmCompatibility, onResetCrossmatch, onRejectComponent, onRejectBag, step2Reasons = [],
  isPartialMatch = false,
  variant = 'requisition',
}) {
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [rejectComponentTarget, setRejectComponentTarget] = useState(null);
  const [rejectingComponent, setRejectingComponent] = useState(false);
  const [rejectBagTarget, setRejectBagTarget] = useState(null);
  const [rejectingBag, setRejectingBag] = useState(false);
  const rejectedComponents = (requestDoc?.requestedComponents || []).filter((c) => c.status === 'REJECTED');
  const rejectedBags = requestDoc?.rejectedUnits || [];
  const status = requestDoc?.status;
  const canMatch = !!requestDoc?._id && status === 'pending' && !matching;
  const canReject = !!requestDoc?._id && ['pending', 'matched', 'approved'].includes(status);
  const recipientGroup = requestDoc?.requestedComponents?.[0]?.bloodGroup || null;

  const grouped = groupByComponent(requestDoc?.matchedInventory);

  // PRBC bags assigned a compatible (non-exact) substitute group — surfaced
  // as a banner the operator must review before approving.
  const prbcSubstitutes = (requestDoc?.matchedInventory || []).filter((mi) => {
    const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
    return inv?.componentId?.componentType === 'PRBC' && (mi.compatibilityType || 'exact') !== 'exact';
  });

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

      <ComponentRejectModal
        isOpen={!!rejectComponentTarget}
        onClose={() => setRejectComponentTarget(null)}
        component={rejectComponentTarget?.rc}
        bagCount={rejectComponentTarget?.bagCount || 0}
        submitting={rejectingComponent}
        onConfirm={async (reason) => {
          if (!rejectComponentTarget) return;
          setRejectingComponent(true);
          const ok = await onRejectComponent(rejectComponentTarget.rc.componentType, reason);
          setRejectingComponent(false);
          if (ok) setRejectComponentTarget(null);
        }}
      />

      <ComponentRejectModal
        isOpen={!!rejectBagTarget}
        onClose={() => setRejectBagTarget(null)}
        title="Reject Bag"
        confirmDescription="This drops just this bag from the requisition; the rest of the component/requisition continues. The rejection stays on record for the life of this requisition."
        confirmLabel="Reject Bag"
        component={rejectBagTarget ? {
          componentType: rejectBagTarget.componentType,
          bloodGroup: rejectBagTarget.bloodGroup,
          rh: rejectBagTarget.rh,
          units: 1,
        } : null}
        bagCount={1}
        submitting={rejectingBag}
        onConfirm={async (reason) => {
          if (!rejectBagTarget) return;
          setRejectingBag(true);
          const ok = await onRejectBag(rejectBagTarget.unitId, reason);
          setRejectingBag(false);
          if (ok) setRejectBagTarget(null);
        }}
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

      {/* Bags are proposed only — reserved on approval */}
      <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-900 text-sm">
        Bags shown below are <strong>proposed</strong>. You can change the blood group and bag until the
        request is <strong>approved</strong> — units are only reserved once you approve.
      </div>

      {/* Completeness gate — what still blocks Next */}
      {step2Reasons.length > 0 && (
        <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900">
          <p className="font-medium">
            {isPartialMatch
              ? 'Outstanding for the available components (you can continue — crossmatch is enforced before issue):'
              : variant === 'reservation'
                ? 'Complete these before creating the reservation:'
                : 'Complete these before continuing to Approve & Issue:'}
          </p>
          <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
            {step2Reasons.map((r, idx) => (<li key={idx}>{r}</li>))}
          </ul>
        </div>
      )}

      {/* PRBC substitution banner */}
      {prbcSubstitutes.length > 0 && (
        <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900">
          <p className="font-medium">⚠️ {prbcSubstitutes.length} PRBC bag{prbcSubstitutes.length > 1 ? 's are' : ' is'} a compatible substitute (not the patient's exact group).</p>
          <p className="mt-1 text-sm">Review each bag below and, if needed, pick a different compatible blood group / bag from the dropdowns before approving.</p>
        </div>
      )}

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
          <p className="mt-2 text-xs text-amber-700 font-medium">The available components have been proposed. Unavailable components will be marked as "Unavailable" throughout the request.</p>
        </div>
      )}

      {/* Match result summary */}
      {matchedResult && (
        <div className="p-4 rounded-lg border border-green-200 bg-green-50 text-green-900">
          <p className="font-medium">Proposed units: {requestDoc?.matchedInventory?.length ?? 0}</p>
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
            <h4 className="font-semibold mb-3">Proposed Inventory (by Component)</h4>
            {Object.keys(grouped).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(grouped).map(([compType, items]) => {
                  const rc = requestDoc?.requestedComponents?.find((c) => c.componentType === compType);
                  const color = componentColor(compType);
                  return (
                    <div key={compType} className={`border-2 rounded-lg overflow-hidden ${color.box}`}>
                      <div className={`px-3 py-2 border-b flex items-center gap-2 ${color.header} ${color.box}`}>
                        <span className="font-semibold text-sm">{compType}</span>
                        <span className="text-xs opacity-80">({items.length} unit{items.length > 1 ? 's' : ''})</span>
                        {items.some((mi) => mi.crossmatchRequired) && (
                          <span className="text-xs font-medium flex items-center gap-1">
                            🔬 Crossmatch Required
                          </span>
                        )}
                        {rc && onRejectComponent && (
                          <button
                            type="button"
                            onClick={() => setRejectComponentTarget({ rc, bagCount: items.length })}
                            className="ml-auto px-2.5 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50 text-xs font-medium cursor-pointer"
                          >
                            Reject Component
                          </button>
                        )}
                      </div>
                      <div className="p-3 space-y-3">
                        {items.map((mi) => {
                          const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
                          const invId = inv?._id || mi.inventoryId;
                          return (
                            <MatchedBagCard
                              key={invId}
                              mi={mi}
                              rc={rc}
                              componentType={compType}
                              color={color}
                              fetchAvailableUnits={fetchAvailableUnits}
                              onSwapBag={onSwapBag}
                              swapping={swapping}
                              onCrossmatchUpdate={onCrossmatchUpdate}
                              onConfirmCompatibility={onConfirmCompatibility}
                              onResetCrossmatch={onResetCrossmatch}
                              crossmatchUpdating={crossmatchUpdating}
                              onRejectBag={onRejectBag ? setRejectBagTarget : undefined}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No inventory proposed yet.</p>
            )}

            {/* Rejected components */}
            {rejectedComponents.length > 0 && (
              <div className="space-y-4 mt-4">
                {rejectedComponents.map((c, idx) => (
                  <div key={idx} className="border border-red-200 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-red-50 border-b flex items-center gap-2">
                      <span className="font-medium text-sm text-red-800">{c.componentType}</span>
                      <span className="text-xs text-red-500">({c.bloodGroup}{c.rh === 'Positive' ? '+' : '−'}, {c.units} requested)</span>
                      <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-200 border border-red-300 text-red-800">
                        Rejected
                      </span>
                    </div>
                    {c.rejectionReason && (
                      <div className="px-3 py-2 text-sm text-red-700">Reason: {c.rejectionReason}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Rejected bags */}
            {rejectedBags.length > 0 && (
              <div className="space-y-4 mt-4">
                {rejectedBags.map((u, idx) => (
                  <div key={idx} className="border border-red-200 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-red-50 border-b flex items-center gap-2">
                      <span className="font-medium text-sm text-red-800">{u.componentType} — Bag {u.unitId}</span>
                      {u.bloodGroup && (
                        <span className="text-xs text-red-500">({u.bloodGroup}{u.rh === 'POSITIVE' || u.rh === 'Positive' ? '+' : '−'})</span>
                      )}
                      <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-200 border border-red-300 text-red-800">
                        Bag Rejected
                      </span>
                    </div>
                    {u.reason && (
                      <div className="px-3 py-2 text-sm text-red-700">Reason: {u.reason}</div>
                    )}
                  </div>
                ))}
              </div>
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
