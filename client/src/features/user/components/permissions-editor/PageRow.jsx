import CrudCheckboxes from './CrudCheckboxes';

export default function PageRow({ page, value, onChange, disabled }) {
  const supportedActions = Object.keys(page.actions || {});
  return (
    <div className="flex items-center justify-between gap-4 py-2 pl-8 pr-3 border-t border-slate-100">
      <span className="text-sm text-slate-700">{page.label}</span>
      <CrudCheckboxes supportedActions={supportedActions} value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}
