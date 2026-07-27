// Maps the legacy 6-role User schema onto the new 14-role table so
// tokens issued by the existing /api/auth endpoints can authenticate
// requests handled by the new src/ tree without forcing every user to
// re-register. Refine these mappings once user.role values are
// migrated to the new vocabulary.

import { ROLE, type Role, type Permission } from './enums';

const NEW_ROLES = new Set<string>(ROLE);

const LEGACY_TO_NEW: Readonly<Record<string, Role>> = {
  admin: 'system-admin',
  'lab-tech': 'lab-tech-serology',
  inventory: 'store-keeper',
  hospital: 'hospital-user',
  viewer: 'auditor',
  staff: 'phlebotomist',
};

const ROLE_DEFAULT_PERMISSIONS: Readonly<Record<Role, ReadonlyArray<Permission>>> = {
  'system-admin': [
    'donor:read',
    'donor:create',
    'donor:update',
    'donor:delete',
    'donor:permanent-delete',
    'donation:read',
    'donation:create',
    'donation:update',
    'donation:delete',
    'donation:permanent-delete',
    'unit:read',
    'unit:create',
    'unit:release',
    'unit:reserve',
    'unit:issue',
    'unit:return',
    'unit:discard',
    'tti:read',
    'tti:edit',
    'tti:release',
    'component:separate',
    'requisition:read',
    'requisition:create',
    'requisition:approve',
    'requisition:reject',
    'crossmatch:perform',
    'crossmatch:override',
    'transfusion:record',
    'adverse-reaction:record',
    'lookback:run',
    'audit:read',
    'audit:export',
    'audit:write',
    'report:read',
    'report:generate',
    'user:read',
    'user:create',
    'user:update',
    'user:deactivate',
    'vendor:read', 'vendor:create', 'vendor:update', 'vendor:delete', 'vendor:permanent-delete',
    'po:read', 'po:create', 'po:approve', 'po:permanent-delete',
    'grn:read', 'grn:create',
    'bag-stock:read', 'bag-stock:update',
    'bag-inspection:read', 'bag-inspection:create',
    'bag-issue:read', 'bag-issue:create',
    'bag-discard:read', 'bag-discard:create', 'bag-discard:approve',
    'bulk-transfer:read', 'bulk-transfer:create', 'bulk-transfer:update', 'bulk-transfer:delete',
    'appointment:read', 'appointment:update',
    'notification:read', 'notification:manage',
    'camp:read', 'camp:manage', 'hospital:read', 'hospital:manage', 'dashboard:read',
    'chemical:read', 'chemical:manage', 'discard:read', 'discard:create',
  ],
  bbo: [
    'donor:read',
    'donor:delete',
    'donation:read',
    'donation:delete',
    'unit:read',
    'unit:release',
    'unit:discard',
    'tti:read',
    'tti:release',
    'requisition:read',
    'requisition:approve',
    'requisition:reject',
    'crossmatch:override',
    'lookback:run',
    'audit:read',
    'audit:write',
    'report:read',
    'report:generate',
    'vendor:read', 'vendor:create', 'vendor:update', 'vendor:delete',
    'po:read', 'po:create', 'po:approve',
    'grn:read', 'grn:create',
    'bag-stock:read', 'bag-stock:update',
    'bag-inspection:read', 'bag-inspection:create',
    'bag-issue:read', 'bag-issue:create',
    'bag-discard:read', 'bag-discard:create', 'bag-discard:approve',
    'bulk-transfer:read', 'bulk-transfer:create', 'bulk-transfer:update', 'bulk-transfer:delete',
    'appointment:read', 'appointment:update',
    'notification:read', 'notification:manage',
    'camp:read', 'camp:manage', 'hospital:read', 'hospital:manage', 'dashboard:read',
    'chemical:read', 'chemical:manage', 'discard:read', 'discard:create',
  ],
  'medical-officer': [
    'donor:read',
    'donation:read',
    'unit:read',
    'tti:read',
    'requisition:read',
    'requisition:approve',
    'requisition:reject',
    'crossmatch:override',
    'transfusion:record',
    'adverse-reaction:record',
    'report:read',
    'audit:write',
    'notification:read', 'notification:manage',
    'camp:read', 'hospital:read', 'dashboard:read',
  ],
  counsellor: [
    'donor:read', 'donor:update', 'tti:read', 'appointment:read', 'appointment:update',
    'notification:read', 'notification:manage',
  ],
  phlebotomist: [
    'donor:read', 'donor:create', 'donor:update', 'donation:read', 'donation:create',
    'bag-stock:read', 'bag-issue:read',
    'notification:read', 'notification:manage',
    'camp:read',
  ],
  'lab-tech-component': [
    'donation:read', 'unit:read', 'unit:create', 'component:separate',
    'notification:read', 'notification:manage',
    'camp:read', 'discard:read', 'discard:create',
  ],
  'lab-tech-serology': [
    'donation:read',
    'unit:read',
    'tti:read',
    'tti:edit',
    'tti:release',
    'crossmatch:perform',
    'notification:read', 'notification:manage',
    'camp:read', 'dashboard:read', 'chemical:read', 'chemical:manage', 'discard:read',
  ],
  'store-keeper': [
    'unit:read', 'unit:reserve', 'unit:return', 'report:read', 'audit:write',
    'vendor:read',
    'po:read',
    'grn:read', 'grn:create',
    'bag-stock:read', 'bag-stock:update',
    'bag-inspection:read', 'bag-inspection:create',
    'bag-issue:read', 'bag-issue:create',
    'bag-discard:read', 'bag-discard:create',
    'bulk-transfer:read', 'bulk-transfer:create', 'bulk-transfer:update', 'bulk-transfer:delete',
    'notification:read', 'notification:manage',
    'camp:read', 'hospital:read', 'dashboard:read', 'chemical:read', 'chemical:manage', 'discard:read',
  ],
  'issue-counter': [
    'unit:read', 'unit:issue', 'unit:return', 'requisition:read', 'audit:write',
    'notification:read', 'notification:manage',
    'hospital:read',
  ],
  'apheresis-tech': [
    'donor:read', 'donor:create', 'donation:read', 'donation:create',
    'notification:read', 'notification:manage',
  ],
  'qa-manager': [
    'audit:read', 'audit:export', 'report:read', 'report:generate', 'unit:read',
    'vendor:read',
    'bag-stock:read',
    'bag-inspection:read', 'bag-inspection:create',
    'bag-discard:read', 'bag-discard:approve',
    'notification:read', 'notification:manage',
    'dashboard:read', 'chemical:read', 'discard:read', 'discard:create',
  ],
  auditor: [
    'donor:read',
    'donation:read',
    'unit:read',
    'tti:read',
    'requisition:read',
    'transfusion:record',
    'audit:read',
    'audit:export',
    'report:read',
    'lookback:run',
    'vendor:read',
    'notification:read', 'notification:manage',
    'camp:read', 'hospital:read', 'discard:read',
  ],
  'camp-organiser': [
    'donor:read', 'donor:create', 'donation:read', 'appointment:read',
    'notification:read', 'notification:manage',
    'camp:read', 'camp:manage', 'dashboard:read',
  ],
  'hospital-user': [
    'requisition:read', 'requisition:create', 'unit:read', 'report:read', 'audit:write',
    'notification:read', 'notification:manage',
    'hospital:read',
  ],
};

export interface LegacyPermissionEntry {
  moduleName: string;
  // Page-scoped grants carry a pageId — see PermissionSchema in
  // user.model.ts. It's frontend-only metadata: projectPermissions()
  // below treats a page-scoped entry identically to a module-wide one,
  // since the backend still only enforces at the Permission-string level.
  pageId?: string | null;
  view?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
}

export function mapLegacyRole(legacy: string): Role {
  return LEGACY_TO_NEW[legacy] ?? 'auditor';
}

// If the stored role is already one of the 14 new-vocabulary roles, use it
// directly; only run the legacy→new mapping for old 6-role values. Shared
// by authenticate.ts (route-level enforcement) and auth.service.ts (the
// /login and /current response) so both resolve the same effective role.
export function resolveRole(rawRole: string): Role {
  return NEW_ROLES.has(rawRole) ? (rawRole as Role) : mapLegacyRole(rawRole);
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

// Granted to every authenticated user server-side, regardless of role or
// grid, so cross-module lookups embedded in pages the user does have
// access to (e.g. Requisition's hospital picker, Donor Creation's
// bag-batch picker) succeed. report:export/upload:write/dashboard:read
// are safe to also expose to the client as-is: no access-registry page
// uses them as a *view* gate (Dashboard's pages are `alwaysAllowed` and
// bypass permission checks entirely), so including them client-side never
// unlocks a page nobody granted.
const UNIVERSAL_PERMISSIONS: readonly Permission[] = ['report:export', 'upload:write', 'dashboard:read'];

// Same as above, but these ALSO happen to be the primary view-gate for a
// real, dedicated page (hospital:read → Hospital List; bag-stock:read →
// Bag Inventory) — granting them universally server-side must not, on its
// own, make those specific pages appear unlocked to users who were never
// given Hospital/Bag Procurement access. Kept in the server's enforcement
// set (so the lookup API calls succeed) but stripped back out before the
// permission list is sent to the client for page-visibility purposes —
// see projectClientPermissions() below.
const DEPENDENCY_ONLY_PERMISSIONS: readonly Permission[] = ['hospital:read', 'bag-stock:read'];

// What the user has actually earned, from their role defaults (or, once
// the grid is authoritative, from it instead) plus explicit grid grants —
// before either UNIVERSAL_PERMISSIONS or DEPENDENCY_ONLY_PERMISSIONS are
// layered on. Shared by both projections below so a legitimately-earned
// hospital:read (e.g. a hospital-user's own role default) is never
// confused with the blanket dependency-only grant everyone else gets.
function earnedPermissions(
  newRole: Role,
  legacyPermissions: ReadonlyArray<LegacyPermissionEntry>,
): Permission[] {
  const defaults = ROLE_DEFAULT_PERMISSIONS[newRole] ?? [];
  const explicit: Permission[] = [];
  for (const p of legacyPermissions) {
    const m = p.moduleName.toLowerCase();
    const overrides = LEGACY_MODULE_PERMISSION_OVERRIDES[m];
    if (p.view) explicit.push((overrides?.view ?? `${m}:read`) as Permission);
    if (p.create) explicit.push((overrides?.create ?? `${m}:create`) as Permission);
    if (p.update) explicit.push((overrides?.update ?? `${m}:update`) as Permission);
    if (p.delete) explicit.push((overrides?.delete ?? `${m}:delete`) as Permission);
  }

  // system-admin/bbo always keep full role-default access regardless of
  // any per-user grid — matches the frontend's FULL_ACCESS_ROLES treatment
  // (useAccess.js) and guarantees a stray/leftover grid entry can never
  // accidentally lock out an administrator.
  const alwaysFullAccess = newRole === 'system-admin' || newRole === 'bbo';
  const base = alwaysFullAccess || legacyPermissions.length === 0 ? defaults : [];

  return [...base, ...explicit];
}

/**
 * Project a legacy user's role + permission grid into the new
 * permission vocabulary. Custom modules use the convention
 * `{moduleName}:{action}`, unless overridden above. This is the set
 * `authenticate.ts` attaches to `req.user.permissions` for actual
 * server-side requirePermission(...) enforcement.
 *
 * Once an admin has explicitly configured ANY permission for a user via
 * the Permissions editor, that grid becomes authoritative — role
 * defaults are NOT also blended in, otherwise a deliberately narrow grant
 * (e.g. "view only" on Requisition) would be silently widened back out by
 * whatever broad access the user's role happens to carry by default. A
 * user nobody has ever configured (empty grid) still gets the role's
 * baseline access so new accounts aren't locked out of everything before
 * an admin gets around to setting permissions.
 */
export function projectPermissions(
  newRole: Role,
  legacyPermissions: ReadonlyArray<LegacyPermissionEntry> = [],
): ReadonlyArray<Permission> {
  const earned = earnedPermissions(newRole, legacyPermissions);
  return Array.from(
    new Set<Permission>([...earned, ...UNIVERSAL_PERMISSIONS, ...DEPENDENCY_ONLY_PERMISSIONS]),
  );
}

/**
 * Same underlying grant (role defaults or grid, whichever is
 * authoritative) as projectPermissions(), but for the permission list
 * sent to the CLIENT (auth.service.ts toPublic()) — used there purely for
 * page-visibility gating (useAccess.js), not for authorizing any API
 * call. Omits the blanket DEPENDENCY_ONLY_PERMISSIONS add-on so a user
 * who was never granted Hospital/Bag Procurement access doesn't see those
 * pages unlock just because some other page they do have access to
 * depends on the same underlying lookup permission — a user who actually
 * earned hospital:read/bag-stock:read (via role default or an explicit
 * grid grant) keeps seeing it, since that came from `earned`, not here.
 */
export function projectClientPermissions(
  newRole: Role,
  legacyPermissions: ReadonlyArray<LegacyPermissionEntry> = [],
): ReadonlyArray<Permission> {
  const earned = earnedPermissions(newRole, legacyPermissions);
  return Array.from(new Set<Permission>([...earned, ...UNIVERSAL_PERMISSIONS]));
}
