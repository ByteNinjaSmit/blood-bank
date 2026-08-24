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
  // user.model.ts. Usually treated identically to a module-wide grant
  // (the backend only enforces at the Permission-string level either
  // way), except where PAGE_PERMISSION_OVERRIDES below says this specific
  // page means something different by the same (moduleName, action) pair.
  pageId?: string | null;
  view?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
}

// A grid action can require MORE than one backend permission string at
// once (e.g. TTI's "Update" checkbox must earn both tti:edit AND
// tti:release, or the finalize/release route 403s even though the admin
// checked every box the editor showed them) — so overrides may resolve to
// an array, not just a single Permission.
type ActionOverrideMap = Partial<Record<'view' | 'create' | 'update' | 'delete', Permission | Permission[]>>;

// Module (resource-prefix) names whose actual enforced route permission
// keys don't follow the generic `{module}:{action}` convention below —
// most non-CRUD-shaped resources need one of these. Each entry is derived
// directly from the page → permission mappings declared in
// client/src/config/access-registry/*.js, so the admin panel's per-module
// or per-page grid checkboxes always translate into a permission string
// the corresponding route's requirePermission(...) actually checks.
//
// Applies to every page that uses a given (moduleName, action) pair. If a
// SPECIFIC page needs something different from every other page sharing
// that pair, add a scoped entry to PAGE_PERMISSION_OVERRIDES below instead
// of changing this table (which would silently over/under-grant every
// other page using the same pair).
const LEGACY_MODULE_PERMISSION_OVERRIDES: Partial<Record<string, ActionOverrideMap>> = {
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
  // purchase-order.routes.ts gates PATCH/DELETE/restore on po:create, not a
  // separate po:approve permission (no route checks po:approve anywhere) —
  // this must match that or Purchase Orders' "Update" checkbox 403s on
  // every edit even though it was granted exactly as intended.
  po: { update: 'po:create' },
  'bag-discard': { update: 'bag-discard:approve' },
  discard: { update: 'discard:restore' },
  // Chemical/reagent inventory only has read + one combined manage
  // permission server-side — every mutation gates on chemical:manage.
  chemical: { create: 'chemical:manage', update: 'chemical:manage' },
  report: { create: 'report:generate' },
  // Recording TTI results (tti:edit) and finalizing/releasing (tti:release)
  // are two separate route-level permissions, but the TTD Testing page's
  // Create/Update checkboxes are the only UI for either — so both boxes
  // must earn both permissions, or "release" 403s no matter what the admin
  // checked (see requirePermission('tti:release') on the finalize route).
  tti: { create: ['tti:edit', 'tti:release'], update: ['tti:edit', 'tti:release'] },
  user: { delete: 'user:deactivate' },
  hospital: { create: 'hospital:manage', update: 'hospital:manage', delete: 'hospital:manage' },
  requisition: { update: 'requisition:approve', delete: 'requisition:reject' },
  camp: { create: ['camp:manage', 'camp:read'], update: 'camp:manage', delete: 'camp:manage' },
  audit: { update: 'audit:write' },
  // donor:create is only ever offered as a checkbox on the Donor Creation
  // page (donor-list has no "create" action at all) — that flow always
  // also creates/updates the donor record and needs donor:update +
  // donor:read too, so this is safe as a blanket module-level grant. Camp
  // Donor Management is the only other page sharing donor:create, and it
  // separately needs donor:update/donor:read anyway (via its own update
  // and view actions), so this never over-grants anything there either.
  donor: { create: ['donor:create', 'donor:update', 'donor:read'] },
  // crossmatch:perform has no dedicated create/update route split — both
  // the Reserve wizard's "create" checkbox and Requisition's "update"
  // checkbox gate the same crossmatch action.
  crossmatch: { create: 'crossmatch:perform', update: 'crossmatch:perform' },
};

// Page-scoped overrides win over LEGACY_MODULE_PERMISSION_OVERRIDES above,
// for the (rare but real) case where the same (moduleName, action) pair
// means something different depending on which page's checkbox triggered
// it — e.g. donor:update on Camp Donor Management also implies donor
// deletion (that page has no separate Delete checkbox), while donor:update
// on the main Donor Register must NOT imply delete rights. Keyed by
// pageId → moduleName(prefix) → action, mirroring the shape above one
// level deeper. Every entry here should trace back to an access-registry
// `actions` array that a module-wide override would get wrong for this
// specific page.
const PAGE_PERMISSION_OVERRIDES: Partial<Record<string, Partial<Record<string, ActionOverrideMap>>>> = {
  // Camp Donor Management has no separate Delete checkbox for donors — its
  // Update checkbox is the only control, so it must also carry donor:delete.
  'camp-donors': {
    donor: { update: ['donor:update', 'donor:delete'] },
  },
  // Donor Creation's single "create" checkbox also always creates a
  // Donation record (see donor.js access-registry comment) — the blanket
  // `donor: { create: [...] }` module override below deliberately stays
  // donor-only because Camp Donor Management shares that same
  // (moduleName, action) pair and must NOT get donation:create.
  'donor-creation': {
    donor: { create: ['donor:create', 'donor:update', 'donor:read', 'donation:create'] },
  },
  // Inward Donation (bag-first) walks POST /inward, PATCH /link-donor,
  // PATCH /medical-history and PATCH /finalize, plus GET /:id when
  // resuming a deep link — all under this page's single "create" checkbox
  // (there's no separate update/view checkbox on this create-only form).
  // Missing any of these makes a later wizard step 403 even though the
  // admin granted the page.
  'donation-inward': {
    donor: {
      create: [
        'donor:create',
        'donor:update',
        'donor:read',
        'donation:create',
        'donation:update',
        'donation:read',
      ],
    },
  },
  // The Reserve wizard's single "create" checkbox performs the whole
  // requisition → crossmatch → reserve flow, unlike Requisition Manage's
  // create (which only creates the requisition record).
  'inventory-reserve-new': {
    requisition: { create: ['requisition:create', 'requisition:approve', 'requisition:reject'] },
  },
  // Issue page's "update" checkbox also covers creating a bulk transfer,
  // distinct from Recycle Bin's use of the same (bulk-transfer, update)
  // pair to mean "restore".
  'inventory-issue': {
    'bulk-transfer': { update: 'bulk-transfer:create' },
  },
  // Component List's "update" checkbox is really a read-only detail
  // view (unit:read), distinct from the Issue page's unit:update.
  'component-list': {
    unit: { update: 'unit:read' },
  },
  // Discard Register's "create" checkbox needs read access into donation
  // and bag-inspection records to select what's being discarded, not
  // create rights on either.
  'discard-list': {
    donation: { create: 'donation:read' },
    'bag-inspection': { create: 'bag-inspection:read' },
  },
  // Recycle Bin's Update = "restore", Delete = "permanently delete" —
  // meanings that diverge sharply from every other page sharing these
  // (moduleName, action) pairs.
  'mis-recycle-bin': {
    donor: { update: 'donor:delete', delete: 'donor:permanent-delete' },
    donation: { update: 'donation:delete', delete: 'donation:permanent-delete' },
    'bulk-transfer': { update: 'bulk-transfer:update' },
    unit: { update: 'unit:read' },
  },
};

function resolvePermissions(
  moduleName: string,
  pageId: string | null | undefined,
  action: 'view' | 'create' | 'update' | 'delete',
): Permission[] {
  const pageOverride = pageId ? PAGE_PERMISSION_OVERRIDES[pageId]?.[moduleName]?.[action] : undefined;
  const moduleOverride = LEGACY_MODULE_PERMISSION_OVERRIDES[moduleName]?.[action];
  const resolved = pageOverride ?? moduleOverride ?? ((action === 'view' ? `${moduleName}:read` : `${moduleName}:${action}`) as Permission);
  return Array.isArray(resolved) ? resolved : [resolved];
}

// Granted to every authenticated user server-side, regardless of grid, so
// cross-module lookups embedded in pages the user does have access to
// (e.g. Requisition's hospital picker, Donor Creation's bag-batch picker)
// succeed. report:export/upload:write/dashboard:read/notification:read/
// notification:manage are safe to also expose to the client as-is: no
// access-registry page uses any of them as a *view* gate (Dashboard's
// pages are `alwaysAllowed` and bypass permission checks entirely; the
// notification bell is global chrome rendered for every logged-in user in
// Master-Layout, not a gated access-registry page), so including them
// client-side never unlocks a page nobody granted.
const UNIVERSAL_PERMISSIONS: readonly Permission[] = [
  'report:export',
  'upload:write',
  'dashboard:read',
  'notification:read',
  'notification:manage',
];

// Same as above, but these ALSO happen to be the primary view-gate for a
// real, dedicated page (hospital:read → Hospital List; bag-stock:read →
// Bag Inventory; camp:read → Camp Listing/Details) — granting them
// universally server-side must not, on its own, make those specific
// pages appear unlocked to users who were never given Hospital/Bag
// Procurement/Camp access. Kept in the server's enforcement set (so the
// lookup API calls succeed — e.g. the Camp filter dropdown on Component
// List) but omitted from the permission list sent to the client for
// page-visibility purposes — see projectClientPermissions() below.
const DEPENDENCY_ONLY_PERMISSIONS: readonly Permission[] = [
  'hospital:read',
  'bag-stock:read',
  'camp:read',
];

// Converts the raw per-user grid into real backend Permission strings.
// This is the ENTIRE source of a non-full-access user's authorization —
// there is no role-based fallback.
function earnedPermissions(legacyPermissions: ReadonlyArray<LegacyPermissionEntry>): Permission[] {
  const explicit: Permission[] = [];
  for (const p of legacyPermissions) {
    const m = p.moduleName.toLowerCase();
    if (p.view) explicit.push(...resolvePermissions(m, p.pageId, 'view'));
    if (p.create) explicit.push(...resolvePermissions(m, p.pageId, 'create'));
    if (p.update) explicit.push(...resolvePermissions(m, p.pageId, 'update'));
    if (p.delete) explicit.push(...resolvePermissions(m, p.pageId, 'delete'));
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
