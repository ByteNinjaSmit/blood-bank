import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format-date";
import { COMPONENT_LABEL } from "@/constants/component-types";

// Final, single sign-off for the whole batch. Nothing has been sent to the
// server yet at this point — confirming here is what actually triggers
// component creation (POST /separate) followed immediately by sign-off
// (POST /separation-completed) for every queued bag, in useBatchSeparation's
// finalizeBatch().
export default function BatchSignatureModal({
  open,
  onOpenChange,
  bags,
  bagKeyFn,
  pendingByBag,
  rpmFirstSpin,
  rpmSecondSpin,
  separationTime,
  user,
  signatureText,
  setSignatureText,
  isSubmitting,
  onConfirm,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Complete & Sign Batch — {bags.length} bag(s)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will separate and sign off every bag below in one action. Review before confirming.
          </p>

          <div className="grid grid-cols-2 gap-3 text-sm border rounded-md p-3">
            <div>
              <span className="block text-xs text-gray-500">1st Spin (RPM)</span>
              <span className="font-medium text-gray-900">{rpmFirstSpin || "—"}</span>
            </div>
            <div>
              <span className="block text-xs text-gray-500">2nd Spin (RPM)</span>
              <span className="font-medium text-gray-900">{rpmSecondSpin || "—"}</span>
            </div>
            <div className="col-span-2">
              <span className="block text-xs text-gray-500">Separation Time</span>
              <span className="font-medium text-gray-900">
                {separationTime ? formatDateTime(new Date(separationTime)) : "—"}
              </span>
            </div>
          </div>

          <div className="max-h-[35vh] overflow-y-auto border rounded-md divide-y">
            {bags.map((bag) => {
              const key = bagKeyFn(bag);
              const existing = Array.isArray(bag.components) ? bag.components : [];
              const staged = pendingByBag.get(key) || [];
              return (
                <div key={key} className="px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-gray-900">{bag.bagNo}</span>
                    <span className="text-xs text-gray-500">
                      {bag.bloodGroup} {bag.rh} — {formatDateTime(bag.collectionDate)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {existing.map((c, i) => (
                      <span
                        key={`e-${i}`}
                        className="px-2 py-0.5 rounded-full text-xs bg-gray-50 text-gray-600 border border-gray-200"
                      >
                        {COMPONENT_LABEL[c.componentType] || c.componentType} — {c.volumeMl} mL
                      </span>
                    ))}
                    {staged.map((c, i) => (
                      <span
                        key={`s-${i}`}
                        className="px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-200"
                      >
                        {COMPONENT_LABEL[c.componentType] || c.componentType} — {c.volumeMl} mL (new)
                      </span>
                    ))}
                    {existing.length === 0 && staged.length === 0 && (
                      <span className="text-xs text-gray-400">No components staged</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-3">
            To verify and authorize this action, please type your full signature/name below:
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-white"
              value={signatureText}
              onChange={(e) => setSignatureText(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting || !signatureText.trim()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Confirm & Complete Batch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
