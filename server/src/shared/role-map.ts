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
    'donation:read',
    'donation:create',
    'donation:update',
    'donation:delete',
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
    'report:read',
    'report:generate',
    'user:read',
    'user:create',
    'user:update',
    'user:deactivate',
    'vendor:read', 'vendor:create', 'vendor:update', 'vendor:delete',
    'po:read', 'po:create', 'po:approve',
    'grn:read', 'grn:create',
    'bag-stock:read', 'bag-stock:update',
    'bag-inspection:read', 'bag-inspection:create',
    'bag-issue:read', 'bag-issue:create',
    'bag-discard:read', 'bag-discard:create', 'bag-discard:approve',
  ],
  bbo: [
    'donor:read',
    'donation:read',
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
    'report:read',
    'report:generate',
    'vendor:read', 'vendor:create', 'vendor:update',
    'po:read', 'po:create', 'po:approve',
    'grn:read', 'grn:create',
    'bag-stock:read', 'bag-stock:update',
    'bag-inspection:read', 'bag-inspection:create',
    'bag-issue:read', 'bag-issue:create',
    'bag-discard:read', 'bag-discard:create', 'bag-discard:approve',
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
  ],
  counsellor: ['donor:read', 'donor:update', 'tti:read'],
  phlebotomist: [
    'donor:read', 'donor:create', 'donor:update', 'donation:read', 'donation:create',
    'bag-stock:read', 'bag-issue:read',
  ],
  'lab-tech-component': ['donation:read', 'unit:read', 'unit:create', 'component:separate'],
  'lab-tech-serology': [
    'donation:read',
    'unit:read',
    'tti:read',
    'tti:edit',
    'tti:release',
    'crossmatch:perform',
  ],
  'store-keeper': [
    'unit:read', 'unit:reserve', 'unit:return', 'report:read',
    'vendor:read',
    'po:read',
    'grn:read', 'grn:create',
    'bag-stock:read', 'bag-stock:update',
    'bag-inspection:read', 'bag-inspection:create',
    'bag-issue:read', 'bag-issue:create',
    'bag-discard:read', 'bag-discard:create',
  ],
  'issue-counter': ['unit:read', 'unit:issue', 'unit:return', 'requisition:read'],
  'apheresis-tech': ['donor:read', 'donor:create', 'donation:read', 'donation:create'],
  'qa-manager': [
    'audit:read', 'report:read', 'report:generate', 'unit:read',
    'vendor:read',
    'bag-stock:read',
    'bag-inspection:read', 'bag-inspection:create',
    'bag-discard:read', 'bag-discard:approve',
  ],
  auditor: [
    'donor:read',
    'donation:read',
    'unit:read',
    'tti:read',
    'requisition:read',
    'transfusion:record',
    'audit:read',
    'report:read',
    'lookback:run',
  ],
  'camp-organiser': ['donor:read', 'donor:create', 'donation:read'],
  'hospital-user': ['requisition:read', 'requisition:create', 'unit:read', 'report:read'],
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

/**
 * Project a legacy user's role + permission grid into the new
 * permission vocabulary. Combines role-default permissions with any
 * explicit grants in the legacy permissions[] array. Custom modules
 * use the convention `{moduleName}:{action}`.
 */
export function projectPermissions(
  newRole: Role,
  legacyPermissions: ReadonlyArray<LegacyPermissionEntry> = [],
): ReadonlyArray<Permission> {
  const defaults = ROLE_DEFAULT_PERMISSIONS[newRole] ?? [];
  const explicit: Permission[] = [];
  for (const p of legacyPermissions) {
    const m = p.moduleName.toLowerCase();
    if (p.view) explicit.push(`${m}:read` as Permission);
    if (p.create) explicit.push(`${m}:create` as Permission);
    if (p.update) explicit.push(`${m}:update` as Permission);
    if (p.delete) explicit.push(`${m}:delete` as Permission);
  }
  // de-dupe; the Permission union narrows at runtime via the Set
  return Array.from(new Set([...defaults, ...explicit]));
}
