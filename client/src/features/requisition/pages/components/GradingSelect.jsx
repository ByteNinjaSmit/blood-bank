import React, { forwardRef } from 'react';
import { GRADING_OPTIONS } from './grading';

// Keyboard shortcut → grading value.
//   4/3/2/1 → +4..+1, 0 or N → Neg (0), H → H, M → MF
function keyToGrade(key) {
  const k = key.toLowerCase();
  if (k === '4') return 'POS_4';
  if (k === '3') return 'POS_3';
  if (k === '2') return 'POS_2';
  if (k === '1') return 'POS_1';
  if (k === '0' || k === 'n') return 'NEG_0';
  if (k === 'h') return 'H';
  if (k === 'm') return 'MF';
  return null;
}

/**
 * A single grading dropdown with keyboard shortcuts. Typing a shortcut key
 * selects the reaction; Enter confirms and calls `onAdvance` to move focus
 * to the next grading field in the worksheet.
 */
const GradingSelect = forwardRef(function GradingSelect(
  { label, value, onChange, onAdvance, onNavigate, disabled },
  ref,
) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAdvance?.();
      return;
    }
    // Arrow keys move focus between boxes instead of changing the value.
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      onNavigate?.(1);
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      onNavigate?.(-1);
      return;
    }
    const grade = keyToGrade(e.key);
    if (grade) {
      e.preventDefault();
      onChange(grade);
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-[11px] font-medium text-gray-600 mb-1">{label}</label>
      )}
      <select
        ref={ref}
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || null)}
        onKeyDown={handleKeyDown}
        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-orange-300 focus:border-orange-400 disabled:bg-gray-100"
      >
        <option value="">—</option>
        {GRADING_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
});

export default GradingSelect;
