import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requireRole, requirePermission } from '@/shared/middlewares/rbac';
import { createBagStockRepo } from '@/modules/bag-stock/bag-stock.repository';
import { createBagStockService } from '@/modules/bag-stock/bag-stock.service';
import { createBagStockControllers } from '@/modules/bag-stock/bag-stock.controller';

const service = createBagStockService({ bagStock: createBagStockRepo() });
const controllers = createBagStockControllers(service);

const router = Router();

// NOTE: /summary must be declared before /:id to avoid "summary" being captured as an id param
router.get(
  '/summary',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'phlebotomist', 'qa-manager']),
  requirePermission('bag-stock:read'),
  controllers.summary,
);

router.get(
  '/',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'phlebotomist', 'qa-manager']),
  requirePermission('bag-stock:read'),
  controllers.list,
);

router.get(
  '/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'phlebotomist', 'qa-manager']),
  requirePermission('bag-stock:read'),
  controllers.get,
);

router.patch(
  '/:id/status',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  requirePermission('bag-stock:update'),
  controllers.updateStatus,
);

export default router;
