import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createUnitRepo } from '@/modules/unit/unit.repository';
import { createInventoryService } from '@/modules/inventory/inventory.service';
import { createInventoryControllers } from '@/modules/inventory/inventory.controller';

const service = createInventoryService({
  units: createUnitRepo(),
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
  // Bag Issuance (bag-issue.routes.ts allows phlebotomist) looks up the
  // stock summary here to populate its own picker.
  'phlebotomist',
] as const;

router.get('/summary', authenticate, requirePermission('unit:read'), controllers.summary);
router.get('/near-expiry', authenticate, requirePermission('unit:read'), controllers.nearExpiry);
router.get('/select', authenticate, requirePermission('unit:read'), controllers.select);
export default router;
