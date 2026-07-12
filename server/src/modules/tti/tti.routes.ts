import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission, requireRole } from '@/shared/middlewares/rbac';
import { ttiService } from '@/modules/tti/tti.instance';
import { createTtiControllers } from '@/modules/tti/tti.controller';

const controllers = createTtiControllers(ttiService);

const router = Router();

router.get(
  '/:donationId',
  authenticate,
  requireRole([
    'system-admin',
    'bbo',
    'medical-officer',
    'lab-tech-serology',
    'auditor',
    'qa-manager',
  ]),
  requirePermission('tti:read'),
  controllers.get,
);

router.post(
  '/:donationId/tests',
  authenticate,
  requireRole(['system-admin', 'lab-tech-serology']),
  requirePermission('tti:edit'),
  controllers.recordTests,
);

// The release gate. Only serology lead / BBO can finalize.
router.post(
  '/:donationId/finalize',
  authenticate,
  requireRole(['system-admin', 'bbo', 'lab-tech-serology']),
  requirePermission('tti:release'),
  controllers.finalize,
);

export default router;
