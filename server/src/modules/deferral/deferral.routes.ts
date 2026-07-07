import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission, requireRole } from '@/shared/middlewares/rbac';
import { createDeferralRepo } from '@/modules/deferral/deferral.repository';
import { createDeferralControllers } from '@/modules/deferral/deferral.controller';

const repo = createDeferralRepo();
const controllers = createDeferralControllers(repo);

const router = Router();

router.get(
  '/',
  authenticate,
  requireRole([
    'system-admin',
    'bbo',
    'medical-officer',
    'counsellor',
    'phlebotomist',
    'lab-tech-serology',
    'auditor',
  ]),
  requirePermission('donor:read'),
  controllers.list,
);

router.get(
  '/donor/:donorId',
  authenticate,
  requireRole([
    'system-admin',
    'bbo',
    'medical-officer',
    'counsellor',
    'phlebotomist',
    'lab-tech-serology',
    'auditor',
  ]),
  requirePermission('donor:read'),
  controllers.listByDonor,
);

router.post(
  '/',
  authenticate,
  requireRole(['system-admin', 'bbo', 'medical-officer', 'counsellor', 'lab-tech-serology']),
  requirePermission('donor:update'),
  controllers.create,
);

// Lifting a deferral is a clinical override — BBO / MO only.
router.post(
  '/:id/lift',
  authenticate,
  requireRole(['system-admin', 'bbo', 'medical-officer']),
  requirePermission('donor:update'),
  controllers.lift,
);

export default router;
