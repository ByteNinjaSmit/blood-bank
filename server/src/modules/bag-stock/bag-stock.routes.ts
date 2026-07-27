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
// No requireRole on these read-only lookups — bag-stock:read is a
// universal permission (role-map.ts projectPermissions()) precisely
// because other pages (e.g. Donor Creation's bag-batch picker) depend on
// this list regardless of the user's role; requirePermission alone is
// the real, meaningful gate here.
router.get('/summary', authenticate, requirePermission('bag-stock:read'), controllers.summary);

router.get('/', authenticate, requirePermission('bag-stock:read'), controllers.list);

router.get('/:id', authenticate, requirePermission('bag-stock:read'), controllers.get);

router.patch(
  '/:id/status',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  requirePermission('bag-stock:update'),
  controllers.updateStatus,
);

router.post(
  '/:id/open-box',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  requirePermission('bag-stock:update'),
  controllers.openBox,
);

export default router;
