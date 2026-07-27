// Pure conversion between the admin-editable "draft" shape (one entry per
// registry module, each either in whole-module or per-page mode) and the
// flat permission grid the backend stores/returns
// ({moduleName, pageId?, view, create, update, delete}[] — see
// server/src/modules/user/user.model.ts). Kept free of React/UI so it's
// easy to reason about and reuse (e.g. in tests) independently of the
// editor components.
import { ACCESS_MODULES } from '@/config/access-registry';

export const ACTIONS = ['view', 'create', 'update', 'delete'];

function emptyActionState() {
  return { view: false, create: false, update: false, delete: false };
}

// [{ prefix, actions: Set<action> }] — the distinct backend resource
// prefixes a page's declared actions touch, and which action(s) each
// prefix answers for. Almost always one entry (one prefix per page); a
// page like Recycle Bin that spans two resources gets two entries.
function prefixesForPage(page) {
  const map = new Map();
  for (const action of ACTIONS) {
    const strs = page.actions?.[action];
    if (!Array.isArray(strs)) continue;
    for (const s of strs) {
      const prefix = s.slice(0, s.lastIndexOf(':'));
      if (!map.has(prefix)) map.set(prefix, new Set());
      map.get(prefix).add(action);
    }
  }
  return [...map.entries()].map(([prefix, actions]) => ({ prefix, actions }));
}

export function emptyDraft() {
  const draft = {};
  for (const mod of ACCESS_MODULES) {
    const pages = {};
    for (const page of mod.pages) pages[page.id] = emptyActionState();
    draft[mod.id] = { mode: 'module', module: emptyActionState(), pages };
  }
  return draft;
}

// Reconstructs the draft an admin would see from a user's stored grid.
export function draftFromGrid(grid) {
  const rows = Array.isArray(grid) ? grid : [];
  const draft = emptyDraft();

  for (const mod of ACCESS_MODULES) {
    const pageIds = new Set(mod.pages.map((p) => p.id));
    const hasPageRows = rows.some((r) => r?.pageId && pageIds.has(r.pageId));
    const state = draft[mod.id];

    if (hasPageRows) {
      state.mode = 'page';
      for (const page of mod.pages) {
        for (const { prefix, actions } of prefixesForPage(page)) {
          const row = rows.find(
            (r) => r?.pageId === page.id && String(r.moduleName || '').trim().toLowerCase() === prefix,
          );
          if (!row) continue;
          for (const action of actions) {
            if (row[action]) state.pages[page.id][action] = true;
          }
        }
      }
      continue;
    }

    // Module-wide mode: an action reads as "on" only if every prefix the
    // module touches for that action has a matching module-wide grant —
    // a conservative default so a partial/inconsistent grid never
    // displays as fully granted.
    const prefixesByAction = { view: new Set(), create: new Set(), update: new Set(), delete: new Set() };
    for (const page of mod.pages) {
      for (const { prefix, actions } of prefixesForPage(page)) {
        actions.forEach((a) => prefixesByAction[a].add(prefix));
      }
    }
    for (const action of ACTIONS) {
      const prefixes = [...prefixesByAction[action]];
      if (prefixes.length === 0) continue;
      state.module[action] = prefixes.every((prefix) =>
        rows.some(
          (r) => !r?.pageId && String(r.moduleName || '').trim().toLowerCase() === prefix && r[action],
        ),
      );
    }
  }
  return draft;
}

// Serializes the draft back into the flat grid the backend expects.
export function gridFromDraft(draft) {
  const rows = [];
  for (const mod of ACCESS_MODULES) {
    const state = draft[mod.id];
    if (!state) continue;

    if (state.mode === 'module') {
      const prefixActions = new Map(); // prefix -> Set(action)
      for (const page of mod.pages) {
        for (const { prefix, actions } of prefixesForPage(page)) {
          if (!prefixActions.has(prefix)) prefixActions.set(prefix, new Set());
          actions.forEach((a) => prefixActions.get(prefix).add(a));
        }
      }
      for (const [prefix, actions] of prefixActions.entries()) {
        const row = { moduleName: prefix };
        let any = false;
        for (const action of actions) {
          row[action] = !!state.module[action];
          if (row[action]) any = true;
        }
        if (any) rows.push(row);
      }
      continue;
    }

    for (const page of mod.pages) {
      const pageState = state.pages[page.id];
      if (!pageState) continue;
      for (const { prefix, actions } of prefixesForPage(page)) {
        const row = { moduleName: prefix, pageId: page.id };
        let any = false;
        for (const action of actions) {
          row[action] = !!pageState[action];
          if (row[action]) any = true;
        }
        if (any) rows.push(row);
      }
    }
  }
  return rows;
}
