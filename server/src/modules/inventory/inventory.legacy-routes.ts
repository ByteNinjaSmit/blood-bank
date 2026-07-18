// Legacy-path-compatible stock register routes. Mounted at
// /api/inventory so existing client calls (Stock/Reserve/Issue/
// NearExpiry pages) to /api/inventory, /api/inventory/unreserve, and
// /api/inventory/send-to-storage keep working unchanged.
import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission, requireRole } from '@/shared/middlewares/rbac';
import { createUnitRepo } from '@/modules/unit/unit.repository';
import { createInventoryLegacyViewRepo } from '@/modules/inventory/inventory.legacy-view.repository';
import { createInventoryLegacyViewService } from '@/modules/inventory/inventory.legacy-view.service';
import { createInventoryLegacyViewControllers } from '@/modules/inventory/inventory.legacy-view.controller';
import type { Role } from '@/shared/enums';

const repo = createInventoryLegacyViewRepo({ units: createUnitRepo() });
const service = createInventoryLegacyViewService({ repo });
const controllers = createInventoryLegacyViewControllers(service);

const router = Router();

const READ_ROLES: Role[] = [
  'system-admin',
  'bbo',
  'medical-officer',
  'lab-tech-component',
  'lab-tech-serology',
  'store-keeper',
  'issue-counter',
  'qa-manager',
  'auditor',
  'hospital-user',
];
const WRITE_ROLES: Role[] = [
  'system-admin',
  'bbo',
  'medical-officer',
  'lab-tech-serology',
  'store-keeper',
  'issue-counter',
];

// These are unit/stock-domain operations; the finer write restriction is
// carried by requireRole(WRITE_ROLES) — requirePermission('unit:read') is the
// shared gate held by every role in both lists (no single unit:* write
// permission is common to all WRITE_ROLES).
router.get('/', authenticate, requireRole(READ_ROLES), requirePermission('unit:read'), controllers.listStock);
router.post('/unreserve', authenticate, requireRole(WRITE_ROLES), requirePermission('unit:read'), controllers.unreserve);
router.post('/send-to-storage', authenticate, requireRole(WRITE_ROLES), requirePermission('unit:read'), controllers.sendToStorage);
router.patch('/:id/storage', authenticate, requireRole(WRITE_ROLES), requirePermission('unit:read'), controllers.updateStorage);
router.post('/return-from-storage', authenticate, requireRole(WRITE_ROLES), requirePermission('unit:read'), controllers.returnFromStorage);

export default router;
