import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { ttiService } from '@/modules/tti/tti.instance';
import { createTtiControllers } from '@/modules/tti/tti.controller';

const controllers = createTtiControllers(ttiService);

const router = Router();

router.get(
  '/:donationId',
  authenticate,
  requirePermission('tti:read'),
  controllers.get,
);

router.post(
  '/:donationId/tests',
  authenticate,
  requirePermission('tti:edit'),
  controllers.recordTests,
);

// The release gate. Only serology lead / BBO can finalize.
router.post(
  '/:donationId/finalize',
  authenticate,
  requirePermission('tti:release'),
  controllers.finalize,
);

export default router;
