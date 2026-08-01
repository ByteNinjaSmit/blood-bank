import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format-date";
import { COMPONENT_LABEL } from "@/constants/component-types";

export default function SeparateComponentModal({
  open,
  onOpenChange,
  activeBag,
  separateForm,
  setSeparateForm,
  availableComponentTypes,
  pendingComponents,
  addPendingComponent,
  removePendingComponent,
  submitSeparate,
  isActionLoading,
  onFormKeyDown,
  onFormChange,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Separate Component</DialogTitle>
        </DialogHeader>
        <div className="space-y-4" onKeyDown={onFormKeyDown} onChange={onFormChange}>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Bag: <span className="font-medium text-gray-900">{activeBag?.bagNo}</span></span>
          </div>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Component</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={separateForm.componentType}
                onChange={(e) => setSeparateForm((s) => ({ ...s, componentType: e.target.value }))}
                disabled={availableComponentTypes(activeBag).length === 0}
              >
                {availableComponentTypes(activeBag).length === 0 && (
                  <option value="">All components added</option>
                )}
                {availableComponentTypes(activeBag).map((t) => (
                  <option key={t} value={t}>{COMPONENT_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Volume (mL)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md"
                value={separateForm.volumeMl}
                onChange={(e) => setSeparateForm((s) => ({ ...s, volumeMl: e.target.value }))}
                min={1}
                placeholder="e.g. 250"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addPendingComponent}
              disabled={!separateForm.componentType || !(Number(separateForm.volumeMl) > 0)}
            >
              Add
            </Button>
          </div>

          {pendingComponents.length > 0 && (
            <div className="border rounded-md divide-y">
              {pendingComponents.map((item, idx) => (
                <div key={`${item.componentType}-${idx}`} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-gray-800">
                    {COMPONENT_LABEL[item.componentType] || item.componentType}
                    <span className="text-gray-500"> — {item.volumeMl} mL</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removePendingComponent(idx)}
                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">RPM</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">1st Spin</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g. 3400"
                  value={separateForm.rpmFirstSpin}
                  onChange={(e) => setSeparateForm((s) => ({ ...s, rpmFirstSpin: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">2nd Spin</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g. 1500"
                  value={separateForm.rpmSecondSpin}
                  onChange={(e) => setSeparateForm((s) => ({ ...s, rpmSecondSpin: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Collection Time</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500"
                  value={formatDateTime(activeBag?.collectionDate)}
                  disabled
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Separation Time</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border rounded-md"
                  value={separateForm.separationTime}
                  onChange={(e) => setSeparateForm((s) => ({ ...s, separationTime: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={submitSeparate}
            disabled={isActionLoading || pendingComponents.length === 0}
          >
            {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Separate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
