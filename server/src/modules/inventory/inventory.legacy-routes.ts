// Legacy-path-compatible stock register routes. Mounted at
// /api/inventory so existing client calls (Stock/Reserve/Issue/
// NearExpiry pages) to /api/inventory, /api/inventory/unreserve, and
// /api/inventory/send-to-storage keep working unchanged.
import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requireRole } from '@/shared/middlewares/rbac';
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

router.get('/', authenticate, requireRole(READ_ROLES), controllers.listStock);
router.post('/unreserve', authenticate, requireRole(WRITE_ROLES), controllers.unreserve);
router.post('/send-to-storage', authenticate, requireRole(WRITE_ROLES), controllers.sendToStorage);
router.patch('/:id/storage', authenticate, requireRole(WRITE_ROLES), controllers.updateStorage);
router.post('/return-from-storage', authenticate, requireRole(WRITE_ROLES), controllers.returnFromStorage);

export default router;
