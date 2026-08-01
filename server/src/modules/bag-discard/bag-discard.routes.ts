import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createBagDiscardRepo } from '@/modules/bag-discard/bag-discard.repository';
import { createBagDiscardService } from '@/modules/bag-discard/bag-discard.service';
import { createBagDiscardControllers } from '@/modules/bag-discard/bag-discard.controller';
import { createBagStockRepo } from '@/modules/bag-stock/bag-stock.repository';

const service = createBagDiscardService({
  discards: createBagDiscardRepo(),
  bagStock: createBagStockRepo(),
});
const controllers = createBagDiscardControllers(service);

const router = Router();

router.get('/', authenticate, requirePermission('bag-discard:read'), controllers.list);

router.get('/:id', authenticate, requirePermission('bag-discard:read'), controllers.get);

router.post('/', authenticate, requirePermission('bag-discard:create'), controllers.create);

router.patch(
  '/:id/approve',
  authenticate,
  requirePermission('bag-discard:approve'),
  controllers.approve,
);

export default router;
