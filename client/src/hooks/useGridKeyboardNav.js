// Excel-style keyboard navigation (Enter, Arrow Up/Down/Left/Right) for
// batch data-entry grids (rows x columns of inputs/selects), keyed off
// `data-row` / `data-col` attributes on each focusable cell.
//
// - ArrowUp/ArrowDown move focus to the same column, one row up/down.
// - ArrowLeft/ArrowRight move focus to the same row, one column left/right.
//   On a <select>, e.preventDefault() also stops the native left/right
//   option-cycling behaviour (same precedent as useFormEnterNav.js).
// - Enter moves focus to the next column in the same row, wrapping to
//   column 0 of the next row when at the end of a row. It is PURE
//   navigation — no click/submit side effects — so Enter never triggers
//   host "Add"/save actions.
//
// Usage: spread the returned handler onto the grid's container element
// (a <table> or wrapping <div>), and add data-row / data-col attributes
// to each focusable cell inside it.
//
//   const { onKeyDown } = createGridKeyboardNavHandler();
//   <table onKeyDown={onKeyDown}>...cells with data-row/data-col...</table>

const FOCUSABLE_SELECTOR =
  "input:not([disabled]):not([type=submit]):not([type=button]):not([type=radio]):not([type=checkbox]), select:not([disabled]), textarea:not([disabled])";

function focusCell(container, row, col) {
  const el = container.querySelector(
    `[data-row="${row}"][data-col="${col}"]`
  );
  if (el && el.matches(FOCUSABLE_SELECTOR)) {
    el.focus();
    return true;
  }
  return false;
}

export function createGridKeyboardNavHandler() {
  const onKeyDown = (e) => {
    const target = e.target;
    const { row, col } = target.dataset || {};
    if (row === undefined || col === undefined) return;

    const rowIdx = parseInt(row, 10);
    const colIdx = parseInt(col, 10);
    if (Number.isNaN(rowIdx) || Number.isNaN(colIdx)) return;

    const isSelect = target.tagName === "SELECT";

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const targetRow = e.key === "ArrowUp" ? rowIdx - 1 : rowIdx + 1;
      focusCell(e.currentTarget, targetRow, colIdx);
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      if (isSelect) e.preventDefault();
      const targetCol = e.key === "ArrowLeft" ? colIdx - 1 : colIdx + 1;
      if (focusCell(e.currentTarget, rowIdx, targetCol)) {
        e.preventDefault();
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (focusCell(e.currentTarget, rowIdx, colIdx + 1)) return;
      focusCell(e.currentTarget, rowIdx + 1, 0);
    }
  };

  return { onKeyDown };
}
