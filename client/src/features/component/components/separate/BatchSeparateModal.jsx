import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format-date";
import { COMPONENT_LABEL } from "@/constants/component-types";
import { createGridKeyboardNavHandler } from "@/hooks/useGridKeyboardNav";

const { onKeyDown: onGridKeyDown } = createGridKeyboardNavHandler();

// One bag's component-entry block inside the batch modal — mirrors the
// single-bag SeparateComponentModal's "pick type, enter volume, Add" row,
// but scoped to this bag's own pending list.
function BagComponentBlock({ bag, bagKey, rowIndex, availableTypes, pending, onAdd, onRemove }) {
  const [componentType, setComponentType] = useState(availableTypes[0] || "");
  const [volumeMl, setVolumeMl] = useState("");

  const remainingTypes = availableTypes.filter(
    (t) => !pending.some((p) => p.componentType === t),
  );
  const selected = remainingTypes.includes(componentType) ? componentType : remainingTypes[0] || "";

  const handleAdd = () => {
    const vol = Number(volumeMl);
    if (!(vol > 0) || !selected) return;
    onAdd(bagKey, selected, vol);
    const nextRemaining = remainingTypes.filter((t) => t !== selected);
    setComponentType(nextRemaining[0] || "");
    setVolumeMl("");
  };

  return (
    <div className="border rounded-md p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-gray-900">Bag: {bag.bagNo}</span>
        <span className="text-gray-500">
          Collection Time: <span className="text-gray-700">{formatDateTime(bag.collectionDate)}</span>
        </span>
      </div>

      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Component</label>
          <select
            data-row={rowIndex}
            data-col={0}
            className="w-full px-2 py-1.5 border rounded-md text-sm"
            value={selected}
            onChange={(e) => setComponentType(e.target.value)}
            disabled={remainingTypes.length === 0}
          >
            {remainingTypes.length === 0 && <option value="">All components added</option>}
            {remainingTypes.map((t) => (
              <option key={t} value={t}>
                {COMPONENT_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Volume (mL)</label>
          <input
            data-row={rowIndex}
            data-col={1}
            type="number"
            className="w-full px-2 py-1.5 border rounded-md text-sm"
            value={volumeMl}
            onChange={(e) => setVolumeMl(e.target.value)}
            min={1}
            placeholder="e.g. 250"
          />
        </div>
        <Button type="button" size="sm" variant="outline" onClick={handleAdd} disabled={!selected || !(Number(volumeMl) > 0)}>
          Add
        </Button>
      </div>

      {pending.length > 0 && (
        <div className="border rounded-md divide-y">
          {pending.map((item, idx) => (
            <div key={`${item.componentType}-${idx}`} className="flex items-center justify-between px-3 py-1.5 text-sm">
              <span className="text-gray-800">
                {COMPONENT_LABEL[item.componentType] || item.componentType}
                <span className="text-gray-500"> — {item.volumeMl} mL</span>
              </span>
              <button
                type="button"
                onClick={() => onRemove(bagKey, idx)}
                className="text-red-600 hover:text-red-800 text-xs font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BatchSeparateModal({
  open,
  onOpenChange,
  bags,
  bagKeyFn,
  availableTypesFor,
  pendingByBag,
  addPendingComponent,
  removePendingComponent,
  rpmFirstSpin,
  setRpmFirstSpin,
  rpmSecondSpin,
  setRpmSecondSpin,
  separationTime,
  setSeparationTime,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enter Components — {bags.length} bag(s)</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-gray-500 -mt-2">
          Nothing is saved yet — these details stay staged until the batch is confirmed and signed.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">RPM (applies to whole batch)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">1st Spin</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g. 3400"
                  value={rpmFirstSpin}
                  onChange={(e) => setRpmFirstSpin(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">2nd Spin</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g. 1500"
                  value={rpmSecondSpin}
                  onChange={(e) => setRpmSecondSpin(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Separation Time (applies to whole batch)</label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border rounded-md"
              value={separationTime}
              onChange={(e) => setSeparationTime(e.target.value)}
            />
          </div>

          <div className="max-h-[45vh] overflow-y-auto space-y-3 pr-1" onKeyDown={onGridKeyDown}>
            {bags.map((bag, rowIndex) => {
              const key = bagKeyFn(bag);
              return (
                <BagComponentBlock
                  key={key}
                  bag={bag}
                  bagKey={key}
                  rowIndex={rowIndex}
                  availableTypes={availableTypesFor(bag)}
                  pending={pendingByBag.get(key) || []}
                  onAdd={addPendingComponent}
                  onRemove={removePendingComponent}
                />
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
