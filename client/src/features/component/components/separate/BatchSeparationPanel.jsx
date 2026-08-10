import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Scissors, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format-date";
import { COMPONENT_LABEL } from "@/constants/component-types";

// Staging area for bags queued into a batch separation run. Nothing here is
// persisted server-side — bags live here purely in client state from the
// moment they're checked until either removed (wrong bag picked — pure
// client-side discard, no server call ever happened for it) or the whole
// batch is confirmed + signed via BatchSignatureModal, which is the one
// point everything actually gets submitted.
export default function BatchSeparationPanel({
  bagType,
  bags,
  bagKeyFn,
  inFlightKeys,
  isSubmitting,
  onRemove,
  onOpenModal,
  pendingByBag,
  confirmChecked,
  onConfirmCheckedChange,
  onOpenSignModal,
  rpmFirstSpin,
  rpmSecondSpin,
  separationTime,
}) {
  const [collapsed, setCollapsed] = useState(false);

  if (bags.length === 0) return null;

  const everyBagHasComponents = bags.every((bag) => {
    const existing = Array.isArray(bag.components) ? bag.components.length : 0;
    const staged = (pendingByBag.get(bagKeyFn(bag)) || []).length;
    return existing + staged > 0;
  });
  const canComplete = confirmChecked && everyBagHasComponents && !isSubmitting;

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden mb-4 border border-blue-200">
      <div className="p-4 flex flex-wrap items-center justify-between gap-2 bg-blue-50 border-b border-blue-200">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-2 text-sm font-semibold text-blue-900"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            Separation Batch — {bagType} ({bags.length} bag{bags.length === 1 ? "" : "s"})
          </button>
          <span className="flex items-center gap-3 text-xs text-blue-800 border-l border-blue-200 pl-3">
            <span>1st Spin: <span className="font-medium">{rpmFirstSpin || "-"}</span></span>
            <span>2nd Spin: <span className="font-medium">{rpmSecondSpin || "-"}</span></span>
            <span>Separation Time: <span className="font-medium">{separationTime ? formatDateTime(new Date(separationTime)) : "-"}</span></span>
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={() => onOpenModal(bags)} disabled={isSubmitting}>
          <Scissors className="w-4 h-4 mr-1" />
          Enter Components
        </Button>
      </div>

      {!collapsed && (
        <>
          <div className="divide-y divide-gray-100">
            {bags.map((bag) => {
              const key = bagKeyFn(bag);
              const inFlight = inFlightKeys.has(key);
              const existing = Array.isArray(bag.components) ? bag.components : [];
              const staged = pendingByBag.get(key) || [];

              return (
                <div key={key} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm">
                    <div>
                      <span className="font-medium text-gray-900">{bag.bagNo}</span>
                      <span className="text-gray-500 ml-2">
                        {bag.bloodGroup} {bag.rh}
                      </span>
                      <span className="text-gray-400 ml-2">{formatDateTime(bag.collectionDate)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {existing.map((c, i) => (
                        <span
                          key={`e-${i}`}
                          className="px-1.5 py-0.5 rounded-full text-[11px] bg-gray-50 text-gray-600 border border-gray-200"
                        >
                          {COMPONENT_LABEL[c.componentType] || c.componentType} {c.volumeMl}mL
                        </span>
                      ))}
                      {staged.map((c, i) => (
                        <span
                          key={`s-${i}`}
                          className="px-1.5 py-0.5 rounded-full text-[11px] bg-amber-50 text-amber-700 border border-amber-200"
                        >
                          {COMPONENT_LABEL[c.componentType] || c.componentType} {c.volumeMl}mL
                        </span>
                      ))}
                      {existing.length === 0 && staged.length === 0 && (
                        <span className="text-[11px] text-gray-400">No components entered yet</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {inFlight ? (
                      <Badge variant="outline" className="border-blue-400 text-blue-700 bg-blue-50">
                        <Loader2 className="w-3 h-3 animate-spin mr-1" /> Under Separation
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50">
                        Under Separation
                      </Badge>
                    )}

                    <button
                      type="button"
                      onClick={() => onRemove(key)}
                      disabled={inFlight || isSubmitting}
                      title="Remove from batch"
                      className="p-1.5 border border-gray-200 rounded-md text-gray-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t bg-gray-50 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={confirmChecked}
                onChange={(e) => onConfirmCheckedChange(e.target.checked)}
                disabled={isSubmitting}
              />
              I confirm all component and RPM details entered for this batch are correct
            </label>
            <Button
              size="sm"
              onClick={onOpenSignModal}
              disabled={!canComplete}
              title={!everyBagHasComponents ? "Every bag needs at least one component entered" : undefined}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Complete & Sign Batch
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
