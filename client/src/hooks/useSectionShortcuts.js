// Ctrl+G / Ctrl+B shortcuts for repeating "component section" forms
// (Bulk Transfer give/take-loan, Send to Storage): Ctrl+G always appends a
// new top-level section; Ctrl+B appends an item (blood group / bag) to
// whichever section the focus was last inside — falling back to the last
// section in the list if focus was never inside one (e.g. shortcut pressed
// right after the modal opened).
//
// Usage: mark each section's wrapper element with data-section-index={idx},
// then spread the two handlers onto the form's outer container.
//
//   const shortcuts = createSectionShortcutHandler({
//     onAddSection: () => setRows([...rows, newRow]),
//     onAddItem: (sectionIndex) => { ...push into rows[sectionIndex]... },
//     sectionCount: () => rows.length,
//   });
//   <div onKeyDown={shortcuts.onKeyDown} onFocusCapture={shortcuts.onFocusCapture}>

export function createSectionShortcutHandler({ onAddSection, onAddItem, sectionCount }) {
  let lastSectionIndex = null;

  const onFocusCapture = (e) => {
    const el = e.target.closest?.("[data-section-index]");
    if (el) lastSectionIndex = Number(el.dataset.sectionIndex);
  };

  const onKeyDown = (e) => {
    if (!e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key.toLowerCase();

    if (key === "g") {
      e.preventDefault();
      onAddSection();
      return;
    }

    if (key === "b") {
      e.preventDefault();
      const el = e.target.closest?.("[data-section-index]");
      const count = sectionCount();
      if (count === 0) return;
      const idx = el ? Number(el.dataset.sectionIndex) : (lastSectionIndex ?? count - 1);
      onAddItem(Math.min(Math.max(idx, 0), count - 1));
    }
  };

  return { onKeyDown, onFocusCapture };
}
