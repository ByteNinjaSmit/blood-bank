import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requireRole, requirePermission } from '@/shared/middlewares/rbac';
import { createVendorRepo } from '@/modules/vendor/vendor.repository';
import { createPORepo } from '@/modules/purchase-order/purchase-order.repository';
import { createPOService } from '@/modules/purchase-order/purchase-order.service';
import { createPOControllers } from '@/modules/purchase-order/purchase-order.controller';

const service = createPOService({
  pos: createPORepo(),
  vendors: createVendorRepo(),
});
const controllers = createPOControllers(service);

const router = Router();

router.get(
  '/',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  requirePermission('po:read'),
  controllers.list,
);

router.get(
  '/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  requirePermission('po:read'),
  controllers.get,
);

router.post(
  '/',
  authenticate,
  requireRole(['system-admin', 'bbo']),
  requirePermission('po:create'),
  controllers.create,
);

router.patch(
  '/:id',
  authenticate,
  requireRole(['system-admin', 'bbo']),
  requirePermission('po:create'),
  controllers.update,
);

router.delete(
  '/:id',
  authenticate,
  requireRole(['system-admin', 'bbo']),
  requirePermission('po:create'),
  controllers.remove,
);

router.post(
  '/:id/restore',
  authenticate,
  requireRole(['system-admin', 'bbo']),
  requirePermission('po:create'),
  controllers.restore,
);

router.delete(
  '/:id/permanent',
  authenticate,
  requireRole(['system-admin']),
  requirePermission('po:permanent-delete'),
  controllers.permanentDelete,
);

export default router;
