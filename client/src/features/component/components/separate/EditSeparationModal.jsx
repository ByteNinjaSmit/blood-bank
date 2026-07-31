import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { COMPONENT_LABEL } from "@/constants/component-types";

export default function EditSeparationModal({
  open,
  onOpenChange,
  editBag,
  editComponents,
  editAvailableTypesForSlot,
  updateEditComponent,
  removeEditComponent,
  editRpmFirstSpin,
  setEditRpmFirstSpin,
  editRpmSecondSpin,
  setEditRpmSecondSpin,
  editSeparationTime,
  setEditSeparationTime,
  submitEditBag,
  canSaveEdit,
  isActionLoading,
  onFormKeyDown,
  onFormChange,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Separation — RPM &amp; Components</DialogTitle>
        </DialogHeader>
        <div className="space-y-4" onKeyDown={onFormKeyDown} onChange={onFormChange}>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Bag: <span className="font-medium text-gray-900">{editBag?.bagNo}</span></span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Separated Components</label>
            <div className="border rounded-md divide-y">
              {editComponents.map((item, idx) => (
                <div key={item.unitId || idx} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  {item.editing ? (
                    <div className="grid grid-cols-[1fr_1fr] gap-2 flex-1">
                      <select
                        className="w-full px-2 py-1.5 border rounded-md text-sm"
                        value={item.componentType}
                        onChange={(e) => updateEditComponent(idx, { componentType: e.target.value })}
                      >
                        <option value="">Select component</option>
                        {editAvailableTypesForSlot(idx).map((t) => (
                          <option key={t} value={t}>{COMPONENT_LABEL[t]}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        className="w-full px-2 py-1.5 border rounded-md text-sm"
                        placeholder="Volume (mL)"
                        min={1}
                        value={item.volumeMl}
                        onChange={(e) => updateEditComponent(idx, { volumeMl: e.target.value })}
                      />
                    </div>
                  ) : (
                    <span className="text-gray-800">
                      {COMPONENT_LABEL[item.componentType] || item.componentType}
                      <span className="text-gray-500"> — {item.volumeMl} mL</span>
                    </span>
                  )}
                  {!item.editing && (
                    <button
                      type="button"
                      onClick={() => removeEditComponent(idx)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium shrink-0"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">RPM</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">1st Spin</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g. 3400"
                  value={editRpmFirstSpin}
                  onChange={(e) => setEditRpmFirstSpin(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">2nd Spin</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g. 1500"
                  value={editRpmSecondSpin}
                  onChange={(e) => setEditRpmSecondSpin(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Separation Time</label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border rounded-md"
              value={editSeparationTime}
              onChange={(e) => setEditSeparationTime(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submitEditBag} disabled={isActionLoading || !canSaveEdit}>
            {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
