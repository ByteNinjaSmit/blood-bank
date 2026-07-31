import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { getModuleActions } from '@/config/access-registry';
import CrudCheckboxes from './CrudCheckboxes';
import PageRow from './PageRow';

// One module in the Permissions editor. Two mutually-exclusive modes:
//  - "module": one set of checkboxes cascades identically to every page.
//  - "page": each page gets its own checkboxes; the module-wide row is
//    ignored while any page override exists.
// Switching modes clears the other mode's state so they can't both be
// half-populated at once.
export default function ModuleRow({ module, state, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const moduleActions = getModuleActions(module.id);
  const isPageMode = state.mode === 'page';

  const emptyActions = () => ({ view: false, create: false, update: false, delete: false });

  // Switching modes shouldn't feel like the admin's existing choices got
  // wiped — seed the newly-active side from whatever was already checked
  // on the other side, only touching actions each page actually supports.
  const switchToPageMode = () => {
    const pages = {};
    for (const p of module.pages) {
      const supported = Object.keys(p.actions || {});
      const seeded = emptyActions();
      supported.forEach((a) => { seeded[a] = !!state.module[a]; });
      pages[p.id] = seeded;
    }
    onChange({ ...state, mode: 'page', pages });
    setExpanded(true);
  };

  const switchToModuleMode = () => {
    const seeded = emptyActions();
    for (const action of moduleActions) {
      seeded[action] = module.pages.every((p) => {
        const supported = Object.keys(p.actions || {});
        if (!supported.includes(action)) return true; // this page has no say on this action
        return !!(state.pages[p.id] && state.pages[p.id][action]);
      });
    }
    onChange({ ...state, mode: 'module', module: seeded });
  };

  const updatePage = (pageId, value) => {
    onChange({ ...state, pages: { ...state.pages, [pageId]: value } });
  };

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <div className="flex items-center justify-between gap-4 py-2.5 px-3 bg-slate-50/60">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 font-medium text-sm text-slate-800 cursor-pointer"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {module.label}
        </button>

        <div className="flex items-center gap-4">
          {!isPageMode && (
            <CrudCheckboxes
              supportedActions={moduleActions}
              value={state.module}
              onChange={(value) => onChange({ ...state, module: value })}
            />
          )}
          {isPageMode && <span className="text-xs italic text-slate-500">Per-page permissions</span>}
          <button
            type="button"
            onClick={isPageMode ? switchToModuleMode : switchToPageMode}
            className="text-xs font-medium text-red-700 hover:text-red-900 whitespace-nowrap cursor-pointer"
          >
            {isPageMode ? 'Use module-wide permission' : 'Use per-page permissions'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="bg-white">
          {module.pages.map((page) => (
            <PageRow
              key={page.id}
              page={page}
              value={state.pages[page.id] || { view: false, create: false, update: false, delete: false }}
              onChange={(value) => updatePage(page.id, value)}
              disabled={!isPageMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
