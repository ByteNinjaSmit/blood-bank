// Permission resolution. `role` (User.model.ts) is a free-text display
// label only — it carries no authorization weight. What a user can
// actually do is determined entirely by:
//   1. `isFullAccess` — an explicit boolean bypass (unconditional access
//      to everything), completely decoupled from the role label.
//   2. The per-user permission grid (`User.permissions[]`), converted
//      into real backend Permission strings below.
// There is no role-based default permission set anymore — a user with an
// empty grid and isFullAccess=false has no permissions at all until an
// admin explicitly grants some via the Permissions editor.

import { PERMISSION, type Permission } from './enums';

export interface LegacyPermissionEntry {
  moduleName: string;
  // Page-scoped grants carry a pageId — see PermissionSchema in
  // user.model.ts. It's frontend-only metadata: the conversion below
  // treats a page-scoped entry identically to a module-wide one, since
  // the backend still only enforces at the Permission-string level.
  pageId?: string | null;
  view?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
}

// Module (resource-prefix) names whose actual enforced route permission
// keys don't follow the generic `{module}:{action}` convention below —
// most non-CRUD-shaped resources need one of these. Each entry is derived
// directly from the page → permission mappings declared in
// client/src/config/access-registry/*.js, so the admin panel's per-module
// or per-page grid checkboxes always translate into a permission string
// the corresponding route's requirePermission(...) actually checks.
const LEGACY_MODULE_PERMISSION_OVERRIDES: Partial<
  Record<string, Partial<Record<'view' | 'create' | 'update' | 'delete', Permission>>>
> = {
  // Component Separation: no component:read/create/update exist — its
  // pages actually gate on unit:read (list/near-expiry) and
  // component:separate (the separation action itself).
  component: {
    view: 'unit:read',
    create: 'component:separate',
    update: 'unit:read',
  },
  // BloodUnit: "create" on the Reserve page really means unit:reserve;
  // "update" on the Issue page really means unit:issue.
  unit: {
    create: 'unit:reserve',
    update: 'unit:issue',
  },
  po: { update: 'po:approve' },
  'bag-discard': { update: 'bag-discard:approve' },
  // Chemical/reagent inventory only has read + one combined manage
  // permission server-side — every mutation gates on chemical:manage.
  chemical: { create: 'chemical:manage', update: 'chemical:manage' },
  report: { create: 'report:generate' },
  tti: { create: 'tti:edit', update: 'tti:edit' },
  user: { delete: 'user:deactivate' },
  hospital: { create: 'hospital:manage', update: 'hospital:manage' },
  requisition: { update: 'requisition:approve', delete: 'requisition:reject' },
  camp: { create: 'camp:manage', update: 'camp:manage' },
  audit: { update: 'audit:write' },
};

// Granted to every authenticated user server-side, regardless of grid, so
// cross-module lookups embedded in pages the user does have access to
// (e.g. Requisition's hospital picker, Donor Creation's bag-batch picker)
// succeed. report:export/upload:write/dashboard:read are safe to also
// expose to the client as-is: no access-registry page uses them as a
// *view* gate (Dashboard's pages are `alwaysAllowed` and bypass
// permission checks entirely), so including them client-side never
// unlocks a page nobody granted.
const UNIVERSAL_PERMISSIONS: readonly Permission[] = ['report:export', 'upload:write', 'dashboard:read'];

// Same as above, but these ALSO happen to be the primary view-gate for a
// real, dedicated page (hospital:read → Hospital List; bag-stock:read →
// Bag Inventory; camp:read → Camp Listing/Details) — granting them
// universally server-side must not, on its own, make those specific
// pages appear unlocked to users who were never given Hospital/Bag
// Procurement/Camp access. Kept in the server's enforcement set (so the
// lookup API calls succeed — e.g. the Camp filter dropdown on Component
// List) but omitted from the permission list sent to the client for
// page-visibility purposes — see projectClientPermissions() below.
const DEPENDENCY_ONLY_PERMISSIONS: readonly Permission[] = ['hospital:read', 'bag-stock:read', 'camp:read'];

// Converts the raw per-user grid into real backend Permission strings.
// This is the ENTIRE source of a non-full-access user's authorization —
// there is no role-based fallback.
function earnedPermissions(legacyPermissions: ReadonlyArray<LegacyPermissionEntry>): Permission[] {
  const explicit: Permission[] = [];
  for (const p of legacyPermissions) {
    const m = p.moduleName.toLowerCase();
    const overrides = LEGACY_MODULE_PERMISSION_OVERRIDES[m];
    if (p.view) explicit.push((overrides?.view ?? `${m}:read`) as Permission);
    if (p.create) explicit.push((overrides?.create ?? `${m}:create`) as Permission);
    if (p.update) explicit.push((overrides?.update ?? `${m}:update`) as Permission);
    if (p.delete) explicit.push((overrides?.delete ?? `${m}:delete`) as Permission);
  }
  return explicit;
}

/**
 * Resolves a user's grid into the flat permission-string set
 * `authenticate.ts` attaches to `req.user.permissions` for actual
 * server-side requirePermission(...) enforcement. `isFullAccess` grants
 * every permission unconditionally (see rbac.ts's requirePermission,
 * which also short-circuits on it directly — kept here too so any other
 * caller of projectPermissions() gets a consistent answer).
 */
export function projectPermissions(
  isFullAccess: boolean,
  legacyPermissions: ReadonlyArray<LegacyPermissionEntry> = [],
): ReadonlyArray<Permission> {
  if (isFullAccess) return [...PERMISSION];
  const earned = earnedPermissions(legacyPermissions);
  return Array.from(
    new Set<Permission>([...earned, ...UNIVERSAL_PERMISSIONS, ...DEPENDENCY_ONLY_PERMISSIONS]),
  );
}

/**
 * Same underlying grant as projectPermissions(), but for the permission
 * list sent to the CLIENT (auth.service.ts toPublic()) — used there
 * purely for page-visibility gating (useAccess.js), not for authorizing
 * any API call. Omits the blanket DEPENDENCY_ONLY_PERMISSIONS add-on so a
 * user who was never granted Hospital/Bag Procurement access doesn't see
 * those pages unlock just because some other page they do have access to
 * depends on the same underlying lookup permission — a user who actually
 * earned hospital:read/bag-stock:read via an explicit grid grant keeps
 * seeing it, since that came from `earned`, not here.
 */
export function projectClientPermissions(
  isFullAccess: boolean,
  legacyPermissions: ReadonlyArray<LegacyPermissionEntry> = [],
): ReadonlyArray<Permission> {
  if (isFullAccess) return [...PERMISSION];
  const earned = earnedPermissions(legacyPermissions);
  return Array.from(new Set<Permission>([...earned, ...UNIVERSAL_PERMISSIONS]));
}
