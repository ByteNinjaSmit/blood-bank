import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission, requireRole } from '@/shared/middlewares/rbac';
import { createUnitRepo } from '@/modules/unit/unit.repository';
import { createPatientRepo } from '@/modules/patient/patient.repository';
import { createRequisitionRepo } from '@/modules/requisition/requisition.repository';
import { createDonationRepo } from '@/modules/donation/donation.repository';
import { createInventoryService } from '@/modules/inventory/inventory.service';
import { createInventoryControllers } from '@/modules/inventory/inventory.controller';

const service = createInventoryService({
  units: createUnitRepo(),
  patients: createPatientRepo(),
  requisitions: createRequisitionRepo(),
  donations: createDonationRepo(),
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
router.post(
  '/reserve',
  authenticate,
  requireRole([
    'system-admin',
    'bbo',
    'medical-officer',
    'lab-tech-serology',
    'store-keeper',
    'issue-counter',
  ]),
  requirePermission('unit:reserve'),
  controllers.reserve,
);

export default router;
