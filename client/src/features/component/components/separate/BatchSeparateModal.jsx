import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format-date";
import { COMPONENT_LABEL } from "@/constants/component-types";

// Cells addressable by data-row/data-col inside the grid container.
function focusCell(container, row, col) {
  const el = container.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (el && !el.disabled) {
    el.focus();
    return true;
  }
  return false;
}

// Skips forward over bags that have nothing left to add (their Component
// select is disabled once every separable type is staged/entered).
function focusNextAddableRow(container, fromRow) {
  let row = fromRow;
  while (true) {
    const sel = container.querySelector(`[data-row="${row}"][data-col="0"]`);
    if (!sel) return false;
    if (!sel.disabled) {
      focusCell(container, row, 1);
      return true;
    }
    row += 1;
  }
}

// Builds the whole dialog's onKeyDown: the RPM/separation-time header
// fields Enter-navigate field to field like any other form, and — once past
// the last header field — Enter drops into the first addable bag's Volume
// slot. Inside the bag grid, ArrowUp/Down move within a column across bags,
// ArrowLeft/Right move within a row's fields, and Enter on the Volume field
// ADDS the component (unlike a pure-navigation grid) then jumps to the next
// component slot for the same bag, or — once that bag has nothing left to
// add — to the next addable bag's Volume field.
function createBatchModalKeyDownHandler(addHandlersRef) {
  return (e) => {
    const target = e.target;
    const container = e.currentTarget;
    const { row, col } = target.dataset || {};

    if (row === undefined || col === undefined) {
      // Header field (RPM 1st/2nd spin, separation time).
      if (e.key !== "Enter") return;
      e.preventDefault();
      const headerFields = Array.from(container.querySelectorAll("[data-header-field]"));
      const idx = headerFields.indexOf(target);
      if (idx !== -1 && idx < headerFields.length - 1) {
        headerFields[idx + 1].focus();
      } else {
        focusNextAddableRow(container, 0);
      }
      return;
    }

    const rowIdx = parseInt(row, 10);
    const colIdx = parseInt(col, 10);
    if (Number.isNaN(rowIdx) || Number.isNaN(colIdx)) return;

    const isSelect = target.tagName === "SELECT";

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      focusCell(container, e.key === "ArrowUp" ? rowIdx - 1 : rowIdx + 1, colIdx);
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      if (isSelect) e.preventDefault();
      const targetCol = e.key === "ArrowLeft" ? colIdx - 1 : colIdx + 1;
      if (focusCell(container, rowIdx, targetCol)) e.preventDefault();
      return;
    }

    if (e.key !== "Enter") return;
    e.preventDefault();

    if (colIdx === 0) {
      // Component picked — move to Volume, no side effect.
      focusCell(container, rowIdx, 1);
      return;
    }

    // Volume field: Enter adds this component (equivalent to clicking Add).
    const addFn = addHandlersRef.current[rowIdx];
    if (!addFn) return;
    const result = addFn();
    if (result === "invalid") {
      toast.error("Enter a valid volume before continuing");
      return;
    }
    if (result === "more") {
      focusCell(container, rowIdx, 1);
    } else {
      focusNextAddableRow(container, rowIdx + 1);
    }
  };
}

// One bag's component-entry block inside the batch modal — mirrors the
// single-bag SeparateComponentModal's "pick type, enter volume, Add" row,
// but scoped to this bag's own pending list.
function BagComponentBlock({ bag, bagKey, rowIndex, availableTypes, pending, onAdd, onRemove, registerAddHandler }) {
  const [componentType, setComponentType] = useState(availableTypes[0] || "");
  const [volumeMl, setVolumeMl] = useState("");

  const remainingTypes = availableTypes.filter(
    (t) => !pending.some((p) => p.componentType === t),
  );
  const selected = remainingTypes.includes(componentType) ? componentType : remainingTypes[0] || "";

  // Returns "more" (another type is now selected and ready for entry),
  // "done" (nothing left to add for this bag), or "invalid" (no-op, bad input).
  const handleAdd = () => {
    const vol = Number(volumeMl);
    if (!(vol > 0) || !selected) return "invalid";
    onAdd(bagKey, selected, vol);
    const nextRemaining = remainingTypes.filter((t) => t !== selected);
    setComponentType(nextRemaining[0] || "");
    setVolumeMl("");
    return nextRemaining.length > 0 ? "more" : "done";
  };

  useEffect(() => {
    registerAddHandler(rowIndex, handleAdd);
  });

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
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={!selected || !(Number(volumeMl) > 0)}
        >
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
  const addHandlersRef = useRef({});
  const registerAddHandler = (rowIndex, fn) => {
    addHandlersRef.current[rowIndex] = fn;
  };
  const handleKeyDown = createBatchModalKeyDownHandler(addHandlersRef);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enter Components — {bags.length} bag(s)</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-gray-500 -mt-2">
          Nothing is saved yet — these details stay staged until the batch is confirmed and signed.
        </p>

        <div className="space-y-4" onKeyDown={handleKeyDown}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">RPM (applies to whole batch)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">1st Spin</label>
                <input
                  type="text"
                  data-header-field
                  autoFocus
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
                  data-header-field
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
              data-header-field
              className="w-full px-3 py-2 border rounded-md"
              value={separationTime}
              onChange={(e) => setSeparationTime(e.target.value)}
            />
          </div>

          <div className="max-h-[45vh] overflow-y-auto space-y-3 pr-1">
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
                  registerAddHandler={registerAddHandler}
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
