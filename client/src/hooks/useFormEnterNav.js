// Enter-to-next-field keyboard navigation, reusable across any form.
//
// - Enter on a text/number/date/textarea input moves focus to the next
//   focusable field, instead of doing nothing (or submitting the page).
// - Enter on a <select>: first press opens its dropdown via showPicker()
//   where supported, so arrow keys move the highlight; a second Enter
//   always confirms and advances to the next field — even if the
//   highlighted option didn't change (so no native "change" event fired)
//   — instead of reopening the picker.
// - ArrowLeft/ArrowRight on a <select> never change its value (left bare,
//   native selects otherwise treat all four arrows as "cycle options");
//   they move to the previous/next field instead, same as Enter would.
// - ArrowLeft on a text/number input moves to the previous field once the
//   caret is already at position 0 (no selection); ArrowRight moves to the
//   next field once the caret is at the end of the value. Inside the text
//   the arrows still just move the caret, same as any input.
// - ArrowUp/ArrowDown are left to native handling — they're what
//   highlights/changes the option, both inside an open picker and on a
//   closed select.
// - Radio button groups (Yes/No questions, etc.) count as a single field:
//   Enter on any radio in the group moves to the next field, focusing
//   whichever option is already checked (or the first option if none is).
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
  "input:not([disabled]):not([type=submit]):not([type=button]):not([type=checkbox]), select:not([disabled]), textarea:not([disabled])";

// Input types whose selectionStart/selectionEnd are readable and whose
// left/right arrows move a text caret (as opposed to date/time/color pickers
// where the arrows drive segment/value changes instead).
const CURSOR_NAV_INPUT_TYPES = new Set(["text", "search", "tel", "url", "email", "password", "number"]);

function isRadio(el) {
  return el.tagName === "INPUT" && el.type === "radio";
}

// A radio group counts as one field: focusableList collapses each
// same-`name` group down to the first radio encountered in DOM order.
function focusableList(container) {
  const raw = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
  const seenRadioNames = new Set();
  return raw.filter((el) => {
    if (!isRadio(el)) return true;
    if (seenRadioNames.has(el.name)) return false;
    seenRadioNames.add(el.name);
    return true;
  });
}

// The element indexOf(target) should compare against for radios: the first
// radio in DOM order sharing target's name (same object focusableList kept).
function indexOfField(all, target) {
  if (isRadio(target)) {
    return all.findIndex((el) => isRadio(el) && el.name === target.name);
  }
  return all.indexOf(target);
}

// Focusing a radio-group entry should land on the checked option if there is
// one, falling back to the first option in the group.
function focusField(container, el) {
  if (!el) return;
  if (isRadio(el)) {
    const checked = container.querySelector(`input[type="radio"][name="${CSS.escape(el.name)}"]:checked`);
    (checked || el).focus();
    return;
  }
  el.focus();
}

function advanceFocus(container, target, onComplete) {
  const all = focusableList(container);
  const idx = indexOfField(all, target);
  if (idx !== -1 && idx < all.length - 1) {
    focusField(container, all[idx + 1]);
  } else if (idx === all.length - 1 && onComplete) {
    onComplete();
  }
}

function stepFocus(container, target, delta) {
  const all = focusableList(container);
  focusField(container, all[indexOfField(all, target) + delta]);
}

export function createFormEnterNavHandlers({ validateField, onComplete } = {}) {
  const onKeyDown = (e) => {
    const target = e.target;
    const isSelect = target.tagName === "SELECT";
    const isField =
      isSelect ||
      target.tagName === "TEXTAREA" ||
      (target.tagName === "INPUT" && !["submit", "button", "checkbox"].includes(target.type));
    if (!isField) return;

    if (isSelect && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      delete target.dataset.enterNavPending;
      stepFocus(e.currentTarget, target, e.key === "ArrowRight" ? 1 : -1);
      return;
    }

    if (
      !isSelect &&
      (e.key === "ArrowLeft" || e.key === "ArrowRight") &&
      (target.tagName === "TEXTAREA" ||
        (target.tagName === "INPUT" && CURSOR_NAV_INPUT_TYPES.has(target.type)))
    ) {
      let start = null;
      let end = null;
      try {
        start = target.selectionStart;
        end = target.selectionEnd;
      } catch {
        // Some input types (e.g. number, in some browsers) can throw on
        // selectionStart access — treat as "position unknown" and fall
        // through to native caret movement.
      }
      if (start != null && end != null) {
        const len = target.value.length;
        if (e.key === "ArrowLeft" && start === 0 && end === 0) {
          e.preventDefault();
          stepFocus(e.currentTarget, target, -1);
          return;
        }
        if (e.key === "ArrowRight" && start === len && end === len) {
          e.preventDefault();
          stepFocus(e.currentTarget, target, 1);
          return;
        }
      }
      return;
    }

    if (e.key !== "Enter") return;
    e.preventDefault();

    if (isSelect) {
      if (target.dataset.enterNavPending) {
        // Picker already open from a prior Enter — this one confirms and
        // advances regardless of whether the value actually changed.
        delete target.dataset.enterNavPending;
        if (validateField && !validateField(target)) return;
        advanceFocus(e.currentTarget, target, onComplete);
        return;
      }
      if (typeof target.showPicker === "function") {
        try {
          target.showPicker();
          target.dataset.enterNavPending = "1";
          return;
        } catch {
          // showPicker() can throw (e.g. called outside a direct user
          // gesture in some edge cases) — fall through to the immediate-
          // advance fallback below instead of doing nothing.
        }
      }
    }

    if (validateField && !validateField(target)) return;
    advanceFocus(e.currentTarget, target, onComplete);
  };

  const onChange = (e) => {
    const target = e.target;
    if (target.tagName === "SELECT" && target.dataset.enterNavPending) {
      delete target.dataset.enterNavPending;
      if (validateField && !validateField(target)) return;
      advanceFocus(e.currentTarget, target, onComplete);
    }
  };

  return { onKeyDown, onChange };
}
