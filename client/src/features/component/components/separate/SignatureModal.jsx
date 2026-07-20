import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format-date";

export default function SignatureModal({
  open,
  onOpenChange,
  signatureBag,
  signatureText,
  setSignatureText,
  user,
  bagKey,
  setReadyToSignBags,
  handleConfirmSignature,
  isActionLoading,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-xl p-6">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600 animate-pulse" />
            Technician Verification
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-600">
            You are marking component separation as completed for Bag <strong className="text-gray-900">{signatureBag?.bagNo}</strong>.
          </p>

          {signatureBag && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                Separation Details
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-3 py-3 text-sm">
                <div>
                  <span className="block text-xs text-gray-500">Bag No</span>
                  <span className="font-medium text-gray-900">{signatureBag.bagNo}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500">Blood Group</span>
                  <span className="font-medium text-gray-900">{signatureBag.bloodGroup} {signatureBag.rh}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500">Collection Time</span>
                  <span className="font-medium text-gray-900">{formatDateTime(signatureBag.collectionDate)}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500">Separation Time</span>
                  <span className="font-medium text-gray-900">
                    {signatureBag.separationTime ? formatDateTime(signatureBag.separationTime) : "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500">1st Spin (RPM)</span>
                  <span className="font-medium text-gray-900">{signatureBag.rpmFirstSpin || "—"}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500">2nd Spin (RPM)</span>
                  <span className="font-medium text-gray-900">{signatureBag.rpmSecondSpin || "—"}</span>
                </div>
              </div>

              {Array.isArray(signatureBag.components) && signatureBag.components.length > 0 && (
                <div className="border-t border-gray-100">
                  <div className="px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Components Separated
                  </div>
                  <div className="px-3 pb-3 pt-1 flex flex-wrap gap-1.5">
                    {signatureBag.components.map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-100 font-medium"
                      >
                        {c.componentType} — {c.volumeMl} mL
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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

          {/* Elegant Signature Preview Box */}
          {signatureText.trim() && (
            <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50/50 to-slate-50/50 flex flex-col items-center justify-center min-h-[80px] shadow-sm relative overflow-hidden">
              <span className="absolute top-2 left-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Preview
              </span>
              <span
                className="text-2xl text-green-800 select-none antialiased"
                style={{ fontFamily: "'Dancing Script', 'Brush Script MT', 'Caveat', cursive, sans-serif" }}
              >
                {signatureText}
              </span>
            </div>
          )}
        </div>
        <DialogFooter className="flex flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              if (signatureBag) {
                setReadyToSignBags((prev) => prev.filter((b) => b !== bagKey(signatureBag)));
              }
              onOpenChange(false);
            }}
            className="rounded-xl px-5 h-11 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 text-xs sm:text-sm font-semibold"
          >
            Edit Separation
          </Button>
          <Button
            onClick={handleConfirmSignature}
            disabled={isActionLoading || !signatureText.trim()}
            className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 h-11 transition-all duration-300 font-semibold flex items-center justify-center shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none text-xs sm:text-sm"
          >
            {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-1.5" /> : null}
            Confirm & Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
