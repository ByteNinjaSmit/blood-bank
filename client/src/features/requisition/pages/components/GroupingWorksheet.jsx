import React, { useEffect, useMemo, useRef, useState } from 'react';
import GradingSelect from './GradingSelect';

// Worksheet layout: ordered groups → ordered fields. The flat order across
// all groups defines the Enter-to-next focus chain.
const GROUPS = [
  {
    key: 'cellGrouping',
    title: 'Cell Grouping',
    fields: [
      { key: 'antiA', label: 'Anti-A' },
      { key: 'antiA1', label: 'Anti-A1' },
      { key: 'antiB', label: 'Anti-B' },
      { key: 'antiAB', label: 'Anti-AB' },
      { key: 'antiH', label: 'Anti-H' },
    ],
  },
  {
    key: 'serumGrouping',
    title: 'Serum Grouping',
    fields: [
      { key: 'aCell', label: 'A Cell' },
      { key: 'bCell', label: 'B Cell' },
      { key: 'oCell', label: 'O Cell' },
    ],
  },
  {
    key: 'rhTyping',
    title: 'Rh Typing',
    fields: [
      { key: 'antiD', label: 'Anti-D' },
      { key: 'antiDBovine', label: 'Anti-D (Bovine)' },
      { key: 'indirectCoombs', label: "Indirect Coombs" },
    ],
  },
];

// Flat [groupKey, fieldKey] chain used for focus advancement.
const CHAIN = GROUPS.flatMap((g) => g.fields.map((f) => [g.key, f.key]));

/**
 * Full blood-grouping worksheet (cell grouping, serum grouping, Rh typing).
 * Used both for the recipient (top of Match Review) and per donor bag.
 * Enter walks the whole sheet; the last field triggers Save.
 */
export default function GroupingWorksheet({ title, value, onSave, saving, disabled }) {
  const [draft, setDraft] = useState(() => value || {});
  const refs = useRef([]);

  // Re-sync when the persisted value changes (e.g. after reload / swap).
  useEffect(() => {
    setDraft(value || {});
  }, [value]);

  const dirty = useMemo(() => JSON.stringify(draft || {}) !== JSON.stringify(value || {}), [draft, value]);

  const setField = (groupKey, fieldKey, v) => {
    setDraft((prev) => ({
      ...prev,
      [groupKey]: { ...(prev?.[groupKey] || {}), [fieldKey]: v },
    }));
  };

  const focusNext = (index) => {
    const next = refs.current[index + 1];
    if (next) next.focus();
  };

  const handleSave = () => {
    if (!dirty || saving || disabled) return;
    onSave(draft);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-3">
      {title && (
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
          {dirty && !disabled && <span className="text-[11px] text-amber-600 font-medium">Unsaved</span>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {GROUPS.map((group) => (
          <div key={group.key} className="space-y-2">
            <div className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">{group.title}</div>
            <div className="grid grid-cols-2 gap-2">
              {group.fields.map((field) => {
                const chainIndex = CHAIN.findIndex(([g, f]) => g === group.key && f === field.key);
                return (
                  <GradingSelect
                    key={field.key}
                    ref={(el) => {
                      refs.current[chainIndex] = el;
                    }}
                    label={field.label}
                    value={draft?.[group.key]?.[field.key] || ''}
                    disabled={disabled}
                    onChange={(v) => setField(group.key, field.key, v)}
                    onAdvance={() => {
                      if (chainIndex === CHAIN.length - 1) handleSave();
                      else focusNext(chainIndex);
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {!disabled && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
              dirty && !saving
                ? 'bg-orange-800 text-white hover:bg-orange-900 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving…' : 'Save Grouping'}
          </button>
        </div>
      )}
    </div>
  );
}
