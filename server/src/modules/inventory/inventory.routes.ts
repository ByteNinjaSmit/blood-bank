import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission, requireRole } from '@/shared/middlewares/rbac';
import { createUnitRepo } from '@/modules/unit/unit.repository';
import { createBulkTransferRepo } from '@/modules/bulk-transfer/bulk-transfer.repository';
import { createInventoryService } from '@/modules/inventory/inventory.service';
import { createInventoryControllers } from '@/modules/inventory/inventory.controller';

const service = createInventoryService({
  units: createUnitRepo(),
  bulkTransfer: createBulkTransferRepo(),
});
const controllers = createInventoryControllers(service);

const router = Router();

const READ_ROLES = [
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
] as const;

router.get(
  '/summary',
  authenticate,
  requireRole([...READ_ROLES]),
  requirePermission('unit:read'),
  controllers.summary,
);
router.get(
  '/near-expiry',
  authenticate,
  requireRole([...READ_ROLES]),
  requirePermission('unit:read'),
  controllers.nearExpiry,
);
router.get(
  '/select',
  authenticate,
  requireRole([
    'system-admin',
    'bbo',
    'medical-officer',
    'lab-tech-serology',
    'store-keeper',
    'issue-counter',
  ]),
  requirePermission('unit:read'),
  controllers.select,
);
export default router;
