import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission, requireRole } from '@/shared/middlewares/rbac';
import { createLookbackRepo } from './lookback.repository';
import { createUnitRepo } from '@/modules/unit/unit.repository';
import { createLookbackService } from './lookback.service';
import { createLookbackControllers } from './lookback.controller';

const service = createLookbackService({
  lookback: createLookbackRepo(),
  units: createUnitRepo(),
});
const controllers = createLookbackControllers(service);

const router = Router();

// Lookback recall is a high-authority action — BBO / MO only.
router.post(
  '/run',
  authenticate,
  requireRole(['system-admin', 'bbo', 'medical-officer', 'counsellor']),
  requirePermission('lookback:run'),
  controllers.run,
);

export default router;
