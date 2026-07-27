import { useMemo } from 'react';
import { useAuth } from '@/store/auth';
import { findModule, findPage } from '@/config/access-registry';

// system-admin/bbo (and the legacy 'admin' role string) always have full
// access — matches the existing behavior in both of the app's previous
// checkAccess() implementations.
const FULL_ACCESS_ROLES = new Set(['system-admin', 'bbo', 'admin']);

function prefixOf(permissionString) {
  const i = permissionString.lastIndexOf(':');
  return i === -1 ? permissionString : permissionString.slice(0, i);
}

// Baseline access comes from `user.effectivePermissions` — the backend's
// already-resolved flat permission-string set (role defaults + this
// user's explicit grid grants, merged — see auth.service.ts toPublic()).
// Consulting this directly means roles that get their access purely from
// ROLE_DEFAULT_PERMISSIONS (no admin-panel grant ever made) still work.
//
// The raw per-user grid (`user.permissions[]`) is only consulted to
// *narrow* access for pages that share one backend permission string with
// a sibling page (e.g. Camp Donor Management and Camp Donation Management
// both gate on `camp:manage`) — once any page-scoped row exists for a
// module, that module switches to page mode: only the pages with their
// own explicit row are shown, even though effectivePermissions would
// technically authorize both.
export default function useAccess() {
  const { user } = useAuth();
  const grid = Array.isArray(user?.permissions) ? user.permissions : [];
  const effective = new Set(Array.isArray(user?.effectivePermissions) ? user.effectivePermissions : []);
  const fullAccess = FULL_ACCESS_ROLES.has(user?.role);

  return useMemo(() => {
    function isPageMode(moduleId) {
      const mod = findModule(moduleId);
      if (!mod) return false;
      const pageIds = new Set(mod.pages.map((p) => p.id));
      return grid.some((e) => e?.pageId && pageIds.has(e.pageId));
    }

    function grantedByGridRow(action, pageId, requiredStrings) {
      return requiredStrings.every((str) => {
        const prefix = prefixOf(str);
        return grid.some(
          (e) =>
            e &&
            typeof e === 'object' &&
            e.pageId === pageId &&
            String(e.moduleName || '').trim().toLowerCase() === prefix &&
            e[action] === true,
        );
      });
    }

    function grantedByEffective(requiredStrings) {
      return requiredStrings.every((str) => effective.has(str));
    }

    // Lower-level escape hatch for cross-cutting capability checks that
    // don't correspond to one specific registered page (e.g. "can this
    // user delete a donor record", checked from Camp Donor Management as
    // well as the main donor register) — checks a raw backend permission
    // string directly against the effective set, bypassing the
    // module/page resolution above entirely.
    function hasPermission(permissionString) {
      if (fullAccess) return true;
      return effective.has(permissionString);
    }

    function can(moduleId, action, pageId) {
      if (fullAccess) return true;
      const page = pageId ? findPage(moduleId, pageId) : null;
      if (page?.alwaysAllowed) return true;
      const required = page?.actions?.[action];
      if (!Array.isArray(required) || required.length === 0) return false;
      if (isPageMode(moduleId)) return grantedByGridRow(action, pageId, required);
      return grantedByEffective(required);
    }

    function canViewPage(moduleId, pageId) {
      if (fullAccess) return true;
      const page = findPage(moduleId, pageId);
      if (!page) return false;
      if (page.alwaysAllowed) return true;
      const actions = page.actions || {};
      if (actions.view) return can(moduleId, 'view', pageId);
      // No dedicated view action (e.g. a create-only form) — visible once
      // any of its declared actions is granted.
      return Object.keys(actions).some((a) => can(moduleId, a, pageId));
    }

    function canViewModule(moduleId) {
      if (fullAccess) return true;
      const mod = findModule(moduleId);
      if (!mod) return false;
      return mod.pages.some((p) => canViewPage(moduleId, p.id));
    }

    return { can, canViewPage, canViewModule, hasPermission };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(grid), JSON.stringify([...effective]), fullAccess]);
}
