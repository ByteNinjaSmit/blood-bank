import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createAdverseReactionRepo } from './adverse-reaction.repository';
import { createTransfusionRepo } from '@/modules/transfusion/transfusion.repository';
import { createAdverseReactionService } from './adverse-reaction.service';
import { createAdverseReactionControllers } from './adverse-reaction.controller';

const service = createAdverseReactionService({
  reactions: createAdverseReactionRepo(),
  transfusions: createTransfusionRepo(),
});
const controllers = createAdverseReactionControllers(service);

const router = Router();

router.post(
  '/',
  authenticate,
  requirePermission('adverse-reaction:record'),
  controllers.report,
);

router.get(
  '/',
  authenticate,
  requirePermission('report:read'),
  controllers.list,
);

export default router;
