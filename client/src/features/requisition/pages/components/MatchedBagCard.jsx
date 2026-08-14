import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ConfirmModal } from '@/components/shared';
import CrossmatchWorksheet from './CrossmatchWorksheet';
import { COMPATIBILITY_RESULT_LABELS } from './grading';

const rhSymbol = (rh) => (String(rh).toUpperCase().startsWith('P') ? '+' : '−');
const normRh = (rh) => (String(rh).toUpperCase().startsWith('P') ? 'POSITIVE' : 'NEGATIVE');

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

export default function MatchedBagCard({
  mi,
  rc,
  componentType,
  color,
  fetchAvailableUnits,
  onSwapBag,
  swapping,
  onCrossmatchUpdate,
  onConfirmCompatibility,
  onResetCrossmatch,
  crossmatchUpdating,
  onRejectBag,
}) {
  const theme = color || { box: 'border-gray-200', tint: 'bg-gray-50', accent: 'border-gray-200' };
  const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
  const currentUnitId = inv?._id || mi.inventoryId;
  const currentGroup = inv?.bagNo?.bloodGroup || rc?.bloodGroup;
  const currentRh = inv?.bagNo?.rh || rc?.rh;
  const currentBagNo = inv?.bagNo?.bagNo || '—';
  const isReserved = !!mi.reserved;

  const recipientGroup = rc?.bloodGroup;
  const recipientRh = rc?.rh;
  const isSubstitute = (mi.compatibilityType || 'exact') !== 'exact';

  const [compatibleGroups, setCompatibleGroups] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(currentGroup);
  const [expanded, setExpanded] = useState(false);
  const [pendingSwap, setPendingSwap] = useState(null); // unit awaiting PRBC confirm

  // (Re)load available bags whenever the proposed unit changes.
  useEffect(() => {
    let cancelled = false;
    setSelectedGroup(currentGroup);
    (async () => {
      const data = await fetchAvailableUnits(componentType);
      if (cancelled || !data) return;
      setCompatibleGroups(data.compatibleGroups || []);
      setUnits(data.units || []);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUnitId, componentType]);

  const countByGroup = useMemo(() => {
    const m = {};
    for (const u of units) m[u.aboGroup] = (m[u.aboGroup] || 0) + 1;
    return m;
  }, [units]);

  const bagsForGroup = useMemo(
    () => units.filter((u) => u.aboGroup === selectedGroup),
    [units, selectedGroup],
  );

  const doSwap = (toUnitId) => {
    if (!toUnitId || toUnitId === currentUnitId) return;
    onSwapBag(currentUnitId, toUnitId);
  };

  const handlePickBag = (toUnitId) => {
    if (!toUnitId || toUnitId === currentUnitId) return;
    const target = units.find((u) => u.unitId === toUnitId);
    const substitutes =
      componentType === 'PRBC' &&
      target &&
      (target.aboGroup !== recipientGroup || normRh(target.rhFactor) !== normRh(recipientRh));
    if (substitutes) {
      setPendingSwap(target);
    } else {
      doSwap(toUnitId);
    }
  };

  const showCrossmatchWorksheet =
    mi.crossmatchRequired && mi.crossmatchStatus === 'pending' && !!onCrossmatchUpdate;
  const showSavedCrossmatch =
    mi.crossmatchRequired && mi.crossmatchStatus !== 'pending' && !!mi.compatibilityResult;

  return (
    <div className={`border rounded-lg overflow-hidden ${theme.box}`}>
      <ConfirmModal
        isOpen={!!pendingSwap}
        onClose={() => setPendingSwap(null)}
        onConfirm={() => {
          const id = pendingSwap?.unitId;
          setPendingSwap(null);
          doSwap(id);
        }}
        type="warning"
        title="Confirm compatible substitution"
        confirmText="Yes, substitute"
        message={
          pendingSwap
            ? `No exact ${recipientGroup} ${rhSymbol(recipientRh)} PRBC selected. Assign compatible ${pendingSwap.aboGroup} ${rhSymbol(pendingSwap.rhFactor)} bag ${pendingSwap.bagNo} to this ${recipientGroup} ${rhSymbol(recipientRh)} patient?`
            : ''
        }
      />

      <div className={`px-3 py-2.5 border-b space-y-2.5 ${theme.tint} ${theme.box}`}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Blood group (compatible only) */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Blood Group</label>
            <select
              value={selectedGroup || ''}
              disabled={isReserved}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white disabled:bg-gray-100"
            >
              {(compatibleGroups.length ? compatibleGroups : [currentGroup]).map((g) => (
                <option key={g} value={g}>
                  {g} {countByGroup[g] != null ? `(${countByGroup[g]} available)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Bag number dropdown */}
          <div className="min-w-[16rem]">
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Bag Number</label>
            <select
              value={currentUnitId}
              disabled={isReserved}
              onChange={(e) => handlePickBag(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white disabled:bg-gray-100 font-mono"
            >
              {/* Current bag always present */}
              <option value={currentUnitId}>
                {currentBagNo} : {currentGroup}{rhSymbol(currentRh)} (current)
              </option>
              {bagsForGroup
                .filter((u) => u.unitId !== currentUnitId)
                .map((u) => (
                  <option key={u.unitId} value={u.unitId}>
                    {u.bagNo} : {u.volumeMl} ml : {u.aboGroup}{rhSymbol(u.rhFactor)} : {new Date(u.expiresAt).toLocaleDateString()}{u.isLoan ? ' [LB]' : ''}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <CompatBadge type={mi.compatibilityType || 'exact'} />
            {isReserved ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                Reserved
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                Proposed
              </span>
            )}
            {swapping && <span className="text-xs text-gray-400">Updating…</span>}
            {onRejectBag && (
              <button
                type="button"
                disabled={isReserved}
                onClick={() => onRejectBag({
                  unitId: currentUnitId,
                  componentType,
                  bloodGroup: currentGroup,
                  rh: currentRh,
                  bagNo: currentBagNo,
                })}
                className={`ml-auto px-2.5 py-1 rounded border text-xs font-medium ${
                  isReserved
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-red-200 text-red-700 hover:bg-red-50 cursor-pointer'
                }`}
              >
                Reject Bag
              </button>
            )}
          </div>
        </div>

        {isSubstitute && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5 font-medium space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-500">⚠️</span>
              {recipientGroup} {rhSymbol(recipientRh)} patient is receiving {currentGroup} {rhSymbol(currentRh)} {componentType}. Confirm compatibility before approving.
            </div>
            <button
              type="button"
              onClick={() => onConfirmCompatibility(currentUnitId, !mi.compatibilityConfirmed)}
              disabled={isReserved}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-60 ${
                mi.compatibilityConfirmed
                  ? 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                  : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
            >
              {mi.compatibilityConfirmed ? '✓ Compatibility confirmed — click to undo' : 'Confirm Compatibility'}
            </button>
          </div>
        )}
      </div>

      {/* Expandable worksheets */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
      >
        <span className="font-medium">Crossmatch Worksheet</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t">
          {mi.crossmatchRequired && (
            <div>
              {showSavedCrossmatch ? (
                <div className="text-xs text-gray-600 bg-green-50 border border-green-200 rounded-md p-2.5 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-green-800">Crossmatch recorded</div>
                    {!isReserved && (
                      <button
                        type="button"
                        onClick={() => onResetCrossmatch(currentUnitId)}
                        className="px-2 py-0.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 text-2xs font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <div>Compatibility: <span className="font-medium">{COMPATIBILITY_RESULT_LABELS[mi.compatibilityResult] || mi.compatibilityResult}</span></div>
                </div>
              ) : showCrossmatchWorksheet ? (
                <CrossmatchWorksheet
                  invId={currentUnitId}
                  onSave={onCrossmatchUpdate}
                  updating={crossmatchUpdating}
                  initial={mi}
                  accentClass={theme.accent}
                />
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
