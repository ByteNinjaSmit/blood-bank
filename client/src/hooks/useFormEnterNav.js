// Enter-to-next-field keyboard navigation, reusable across any form.
//
// - Enter on a text/number/date/textarea input moves focus to the next
//   focusable field in the same container, instead of doing nothing (or
//   submitting the page).
// - Enter on a <select> opens its native dropdown via showPicker() where
//   supported (Chrome/Edge 121+), so arrow keys move the highlight and a
//   second Enter confirms it exactly like a custom listbox would — focus
//   then auto-advances to the next field once a value is chosen. Browsers
//   without showPicker() fall back to advancing immediately on the first
//   Enter, matching the old behavior.
//
// Usage: spread the two handlers onto the form's outer container (the
// same element whose descendants you want Enter-navigation to span).
//
//   const { onKeyDown, onChange } = createFormEnterNavHandlers({
//     validateField: (target) => { ...return true/false, toast on failure... },
//     onComplete: () => handleNext(),
//   });
//   <div onKeyDown={onKeyDown} onChange={onChange}>...form fields...</div>

const FOCUSABLE_SELECTOR =
  "input:not([disabled]):not([type=submit]):not([type=button]):not([type=radio]):not([type=checkbox]), select:not([disabled]), textarea:not([disabled])";

function advanceFocus(container, target, onComplete) {
  const all = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
  const idx = all.indexOf(target);
  if (idx !== -1 && idx < all.length - 1) {
    all[idx + 1].focus();
  } else if (idx === all.length - 1 && onComplete) {
    onComplete();
  }
}

export function createFormEnterNavHandlers({ validateField, onComplete } = {}) {
  const onKeyDown = (e) => {
    if (e.key !== "Enter") return;
    const target = e.target;

    if (
      target.tagName === "INPUT" &&
      ["submit", "button", "radio", "checkbox"].includes(target.type)
    ) {
      return;
    }
    if (!["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;

    e.preventDefault();

    if (target.tagName === "SELECT") {
      if (typeof target.showPicker === "function") {
        try {
          target.showPicker();
          // Marks this select as "awaiting a value from the picker" so the
          // delegated onChange handler below knows to advance focus once
          // the user confirms a choice (arrow keys + Enter, native popup).
          target.dataset.enterNavPending = "1";
          return;
        } catch {
          // showPicker() can throw (e.g. called outside a direct user
          // gesture in some edge cases) — fall through to the old
          // immediate-advance behavior instead of doing nothing.
        }
      }
      if (validateField && !validateField(target)) return;
      advanceFocus(e.currentTarget, target, onComplete);
      return;
    }

    if (validateField && !validateField(target)) return;
    advanceFocus(e.currentTarget, target, onComplete);
  };

  const onChange = (e) => {
    const target = e.target;
    if (target.tagName === "SELECT" && target.dataset.enterNavPending) {
      delete target.dataset.enterNavPending;
      advanceFocus(e.currentTarget, target, onComplete);
    }
  };

  return { onKeyDown, onChange };
}
