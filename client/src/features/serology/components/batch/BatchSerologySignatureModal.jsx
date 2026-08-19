import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format-date";
import { DEFAULT_TESTS } from "./use-batch-serology";

// Final review before the batch is actually submitted. Groups the entered
// results by parameter — common result (Negative) vs the exceptions —
// mirroring how staff think about this workflow ("HIV: 98 Negative, 2
// exceptions") rather than re-showing the full bag-by-bag matrix again.
export default function BatchSerologySignatureModal({
  open,
  onOpenChange,
  bags,
  matrix,
  user,
  batchTestDate,
  batchTestTime,
  signatureText,
  setSignatureText,
  isSubmitting,
  onConfirm,
}) {
  const performedAtLabel =
    batchTestDate && batchTestTime
      ? formatDateTime(new Date(`${batchTestDate}T${batchTestTime}:00`).toISOString())
      : "—";
  const byTest = DEFAULT_TESTS.map((t) => {
    const exceptions = bags
      .map((bag) => ({ bag, result: (matrix.get(bag._id) || {})[t.key] || "Negative" }))
      .filter((e) => e.result !== "Negative");
    return { ...t, total: bags.length, exceptions };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Review TTI Batch — {bags.length} bag(s)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Common result: <span className="font-semibold text-gray-900">Negative</span> for every parameter
            unless listed below.
          </p>
          <p className="text-sm text-gray-600">
            Test Date/Time (applied to all {bags.length} bag(s)):{" "}
            <span className="font-semibold text-gray-900">{performedAtLabel}</span>
          </p>

          <div className="max-h-[40vh] overflow-y-auto border rounded-md divide-y">
            {byTest.map((t) => (
              <div key={t.key} className="px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{t.label}</span>
                  <span className="text-xs text-gray-500">
                    {t.total - t.exceptions.length} Negative
                    {t.exceptions.length > 0 ? ` · ${t.exceptions.length} exception(s)` : ""}
                  </span>
                </div>
                {t.exceptions.length === 0 ? (
                  <p className="text-xs text-gray-400 mt-1">No exceptions</p>
                ) : (
                  <ul className="mt-1 space-y-0.5">
                    {t.exceptions.map(({ bag, result }) => (
                      <li key={bag._id} className="text-xs flex items-center gap-2">
                        <span className="text-gray-700">{bag.bagNo}</span>
                        <span className={result === "Reactive" ? "text-red-600 font-medium" : "text-orange-600 font-medium"}>
                          {result}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {bags.length === 0 ? (
            <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="font-medium">
                This batch is now empty — every queued bag dropped off the worklist (already processed
                elsewhere, or moved to a held status) while this review step was open. Close this and
                re-select bags to try again.
              </p>
            </div>
          ) : (
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="font-medium mb-1">⚠️ Please verify all exceptions carefully before saving.</p>
              <p>
                Negative bags release to stock immediately, Reactive bags are discarded and the donor is
                permanently deferred, and Shadeness bags are quarantined pending retest.
              </p>
            </div>
          )}

          <div className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-3">
            To verify and authorize this batch, please type your full signature/name below:
            <br />
            <span className="font-semibold text-gray-800">
              "{user ? `${user.name?.first || ""} ${user.name?.last || ""}`.trim() : "Lab Technician"}"
            </span>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Your Signature
            </label>
            <input
              type="text"
              placeholder="Type your name here..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 bg-white"
              value={signatureText}
              onChange={(e) => setSignatureText(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Back
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting || !signatureText.trim() || bags.length === 0}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Confirm & Save Batch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
