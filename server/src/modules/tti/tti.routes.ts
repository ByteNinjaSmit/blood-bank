import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission, requireRole } from '@/shared/middlewares/rbac';
import { createTtiRepo } from '@/modules/tti/tti.repository';
import { createUnitRepo } from '@/modules/unit/unit.repository';
import { createDeferralRepo } from '@/modules/deferral/deferral.repository';
import { createDonationRepo } from '@/modules/donation/donation.repository';
import { createLookbackRepo } from '@/modules/lookback/lookback.repository';
import { createLookbackService } from '@/modules/lookback/lookback.service';
import { createTtiService } from '@/modules/tti/tti.service';
import { createTtiControllers } from '@/modules/tti/tti.controller';
import { env } from '@/core/config/env';

const units = createUnitRepo();
const lookback = createLookbackService({ lookback: createLookbackRepo(), units });

const service = createTtiService({
  tti: createTtiRepo(),
  units,
  deferrals: createDeferralRepo(),
  donations: createDonationRepo(),
  // Reactive result auto-triggers recall + alerts the configured inbox.
  lookback,
  counsellorEmail: env.ADMIN_EMAIL,
});
const controllers = createTtiControllers(service);

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
