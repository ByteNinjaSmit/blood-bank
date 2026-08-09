import { Loader2, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format-date";
import { RESULT_OPTIONS, statusBadge, formatBlood } from "./serology-helpers";
import RetestHistory from "./RetestHistory";

export default function SerologyDetailModal({
  selectedBag,
  isEditing,
  editedResults,
  editReason,
  setEditReason,
  setEditedResult,
  isSaving,
  canEditRole,
  onClose,
  onSave,
  onEdit,
  onViewComponents,
}) {
  if (!selectedBag) return null;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{`Bag ${selectedBag.bagNo} – Serology details${isEditing ? " (Editing)" : ""}`}</DialogTitle>
        {selectedBag.status && <DialogDescription>{`Status: ${selectedBag.status}`}</DialogDescription>}
      </DialogHeader>
      <div className="space-y-4 text-sm text-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bag Information</p>
            <p><span className="font-medium">Bag No:</span> {selectedBag.bagNo}</p>
            <p><span className="font-medium">Segment No:</span> {selectedBag.segmentNo || "-"}</p>
            <p><span className="font-medium">Blood Group:</span> {formatBlood(selectedBag.bloodGroup, selectedBag.rh)}</p>
            <p>
              <span className="font-medium">Collection Date:</span>{" "}
              {formatDateTime(selectedBag.collectionDate)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Summary</p>
            <p>
              <span className="font-medium">Status:</span> {selectedBag.status}{" "}
              {statusBadge(selectedBag.status)}
            </p>
            {selectedBag.updatedAt && (
              <p>
                <span className="font-medium">Last Updated:</span>{" "}
                {formatDateTime(selectedBag.updatedAt)}
              </p>
            )}
            {selectedBag.lastEditedAt && (
              <p>
                <span className="font-medium">Edited on:</span>{" "}
                {formatDateTime(selectedBag.lastEditedAt)}
                {selectedBag.editReason && (
                  <span className="text-xs text-slate-500"> — {selectedBag.editReason}</span>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-white/80 p-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Test Results</p>
          {isEditing ? (
            editedResults.length > 0 ? (
              <div className="divide-y text-sm">
                {editedResults.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 gap-3">
                    <p className="font-medium text-slate-800">{t.test}</p>
                    <Select value={t.result} onValueChange={(val) => setEditedResult(idx, val)}>
                      <SelectTrigger className="h-8 w-40 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESULT_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt} className="text-xs">
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No serology tests recorded for this bag.</p>
            )
          ) : Array.isArray(selectedBag.testResults) && selectedBag.testResults.length > 0 ? (
            <div className="divide-y text-sm">
              {selectedBag.testResults.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-slate-800">{t.test}</p>
                    {t.notes && <p className="text-xs text-slate-500 mt-0.5">{t.notes}</p>}
                  </div>
                  {(() => {
                    const normalized = String(t.result).toUpperCase();
                    const chipCls =
                      normalized === "REACTIVE" || normalized === "POSITIVE"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : normalized === "NEGATIVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200";
                    return (
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${chipCls}`}>
                        {t.result}
                      </span>
                    );
                  })()}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No serology tests recorded for this bag.</p>
          )}
        </div>

        <RetestHistory bagId={selectedBag._id} enabled={!isEditing && Boolean(selectedBag.lastEditedAt)} />

        {isEditing && (
          <>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              Saving re-evaluates the release decision for this donation. If this correction
              changes a negative result to reactive, all components from this donation are
              removed from stock and moved to discarded, and the donor is permanently deferred.
              If it changes to shadeness, any in-stock units are moved to quarantine (not
              requisitionable) and the donor is temporarily deferred until retest. If a
              reactive result is corrected back to negative, discarded units are restored to
              stock and the donor's deferral is lifted automatically.
            </p>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                Reason for Edit <span className="text-red-600">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 focus:border-red-400 focus:ring-red-400"
                rows={2}
                placeholder="Why are these results being corrected?"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                onClick={onSave}
                disabled={isSaving || editedResults.length === 0 || !editReason.trim()}
                className="bg-red-700 hover:bg-red-800"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1.5" />
                )}
                Save Results
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onViewComponents}>
                View Components
              </Button>
              {canEditRole && selectedBag.canEdit && (
                <Button variant="outline" onClick={() => onEdit(selectedBag)}>
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit Results
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      </DialogContent>
    </Dialog>
  );
}
