import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createGRNRepo } from '@/modules/goods-receipt/goods-receipt.repository';
import { createGRNService } from '@/modules/goods-receipt/goods-receipt.service';
import { createGRNControllers } from '@/modules/goods-receipt/goods-receipt.controller';
import { createPORepo } from '@/modules/purchase-order/purchase-order.repository';
import { createBagStockRepo } from '@/modules/bag-stock/bag-stock.repository';

const service = createGRNService({
  grns: createGRNRepo(),
  pos: createPORepo(),
  bagStock: createBagStockRepo(),
});
const controllers = createGRNControllers(service);

const router = Router();

router.get('/', authenticate, requirePermission('grn:read'), controllers.list);

router.get('/:id', authenticate, requirePermission('grn:read'), controllers.get);

router.post('/', authenticate, requirePermission('grn:create'), controllers.create);

router.patch('/:id', authenticate, requirePermission('grn:create'), controllers.update);

export default router;
