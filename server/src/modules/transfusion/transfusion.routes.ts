import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission, requireRole } from '@/shared/middlewares/rbac';
import { createTransfusionRepo } from './transfusion.repository';
import { createUnitRepo } from '@/modules/unit/unit.repository';
import { createTransfusionService } from './transfusion.service';
import { createTransfusionControllers } from './transfusion.controller';

const service = createTransfusionService({
  transfusions: createTransfusionRepo(),
  units: createUnitRepo(),
});
const controllers = createTransfusionControllers(service);

const router = Router();

router.post(
  '/',
  authenticate,
  requireRole(['system-admin', 'medical-officer', 'issue-counter', 'bbo']),
  requirePermission('transfusion:record'),
  controllers.record,
);

export default router;
