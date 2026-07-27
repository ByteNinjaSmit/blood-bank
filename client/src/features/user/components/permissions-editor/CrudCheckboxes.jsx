import { ACTIONS } from './grid-conversion';

// Renders only the columns a module/page actually supports — e.g. a
// read-only report page never shows a "Delete" checkbox.
export default function CrudCheckboxes({ supportedActions, value, onChange, disabled }) {
  const supported = ACTIONS.filter((a) => supportedActions.includes(a));
  if (supported.length === 0) return <span className="text-xs text-slate-400 italic">No actions</span>;
  const allChecked = supported.every((a) => value[a]);

  const setAll = (checked) => {
    const next = { ...value };
    supported.forEach((a) => { next[a] = checked; });
    onChange(next);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <label className="flex items-center gap-1 text-xs font-medium text-slate-700">
        <input type="checkbox" checked={allChecked} disabled={disabled} onChange={(e) => setAll(e.target.checked)} />
        All
      </label>
      {supported.map((action) => (
        <label key={action} className="flex items-center gap-1 text-xs capitalize text-slate-600">
          <input
            type="checkbox"
            checked={!!value[action]}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, [action]: e.target.checked })}
          />
          {action}
        </label>
      ))}
    </div>
  );
}
