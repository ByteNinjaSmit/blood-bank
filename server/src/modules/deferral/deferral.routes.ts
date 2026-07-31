import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createDeferralRepo } from '@/modules/deferral/deferral.repository';
import { createDeferralControllers } from '@/modules/deferral/deferral.controller';

const repo = createDeferralRepo();
const controllers = createDeferralControllers(repo);

const router = Router();

router.get(
  '/',
  authenticate,
  requirePermission('donor:read'),
  controllers.list,
);

router.get(
  '/donor/:donorId',
  authenticate,
  requirePermission('donor:read'),
  controllers.listByDonor,
);

router.post(
  '/',
  authenticate,
  requirePermission('donor:update'),
  controllers.create,
);

// Lifting a deferral is a clinical override — BBO / MO only.
router.post(
  '/:id/lift',
  authenticate,
  requirePermission('donor:update'),
  controllers.lift,
);

export default router;
