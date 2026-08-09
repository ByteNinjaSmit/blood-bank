import { useState } from "react";
import { ChevronDown, ChevronUp, TestTube2, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format-date";
import { DEFAULT_TESTS } from "./use-batch-serology";

// Staging area for bags queued into a batch TTI entry run — mirrors
// BatchSeparationPanel.jsx's layout/behavior. Nothing here is persisted
// server-side; a bag lives here purely in client state (matrix defaults to
// all-Negative) until either removed (pure client-side discard) or the
// whole batch is confirmed + signed via BatchSerologySignatureModal.
export default function BatchSerologyQueuePanel({
  bags,
  matrix,
  onRemove,
  onOpenPanel,
  confirmChecked,
  onConfirmCheckedChange,
  onOpenSignModal,
  isSubmitting,
}) {
  const [collapsed, setCollapsed] = useState(false);

  if (bags.length === 0) return null;

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden mb-4 border border-blue-200">
      <div className="p-4 flex flex-wrap items-center justify-between gap-2 bg-blue-50 border-b border-blue-200">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 text-sm font-semibold text-blue-900"
        >
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          Serology Batch — {bags.length} bag{bags.length === 1 ? "" : "s"}
        </button>
        <Button size="sm" variant="outline" onClick={onOpenPanel} disabled={isSubmitting}>
          <TestTube2 className="w-4 h-4 mr-1" />
          Enter Results
        </Button>
      </div>

      {!collapsed && (
        <>
          <div className="divide-y divide-gray-100">
            {bags.map((bag) => {
              const row = matrix.get(bag._id) || {};
              const exceptions = DEFAULT_TESTS.filter((t) => (row[t.key] || "Negative") !== "Negative");
              return (
                <div key={bag._id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm">
                    <div>
                      <span className="font-medium text-gray-900">{bag.bagNo}</span>
                      <span className="text-gray-500 ml-2">{bag.bloodGroup} {bag.rh}</span>
                      <span className="text-gray-400 ml-2">{formatDateTime(bag.collectionDate)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {exceptions.length === 0 ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-green-50 text-green-700 border border-green-200">
                          All Negative (default)
                        </span>
                      ) : (
                        exceptions.map((t) => (
                          <span
                            key={t.key}
                            className={`px-1.5 py-0.5 rounded-full text-[11px] border ${
                              row[t.key] === "Reactive"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-orange-50 text-orange-700 border-orange-200"
                            }`}
                          >
                            {t.label}: {row[t.key]}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(bag._id)}
                    disabled={isSubmitting}
                    title="Remove from batch"
                    className="p-1.5 border border-gray-200 rounded-md text-gray-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                  </button>
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
              I confirm all results entered for this batch are correct
            </label>
            <Button
              size="sm"
              onClick={onOpenSignModal}
              disabled={!confirmChecked || isSubmitting}
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
