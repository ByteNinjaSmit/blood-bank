// Maps the legacy 6-role User schema onto the new 14-role table so
// tokens issued by the existing /api/auth endpoints can authenticate
// requests handled by the new src/ tree without forcing every user to
// re-register. Refine these mappings once user.role values are
// migrated to the new vocabulary.

import type { Role, Permission } from './enums';

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
  view?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
}

export function mapLegacyRole(legacy: string): Role {
  return LEGACY_TO_NEW[legacy] ?? 'auditor';
}

// Legacy admin-panel module names whose actual enforced route permission
// keys don't follow the generic `{module}:{action}` convention below.
// "Component" is the known offender: its routes require `unit:read` (list/
// bags-to-separate/near-expiry/detail/edit) and `component:separate`
// (separate/complete), not `component:read/create/update/delete` — so a
// grant made via the admin panel's "Component" checkboxes previously
// produced permissions the server never checked, 403-ing the page.
const LEGACY_MODULE_PERMISSION_OVERRIDES: Partial<
  Record<string, Partial<Record<'view' | 'create' | 'update' | 'delete', Permission>>>
> = {
  component: {
    view: 'unit:read',
    create: 'component:separate',
    update: 'unit:read',
  },
};

/**
 * Project a legacy user's role + permission grid into the new
 * permission vocabulary. Combines role-default permissions with any
 * explicit grants in the legacy permissions[] array. Custom modules
 * use the convention `{moduleName}:{action}`, unless overridden above.
 */
export function projectPermissions(
  newRole: Role,
  legacyPermissions: ReadonlyArray<LegacyPermissionEntry> = [],
): ReadonlyArray<Permission> {
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
  // Every authenticated staff role may export the report they're already
  // authorized to view and attach images to the forms they fill; grant
  // these generic, cross-cutting permissions globally so the shared
  // /export/excel and /upload endpoints are reachable without widening
  // report:read or coupling them to any one module.
  return Array.from(
    new Set<Permission>([...defaults, ...explicit, 'report:export', 'upload:write']),
  );
}
