import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
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
  requirePermission('po:read'),
  controllers.list,
);

router.get(
  '/:id',
  authenticate,
  requirePermission('po:read'),
  controllers.get,
);

router.post(
  '/',
  authenticate,
  requirePermission('po:create'),
  controllers.create,
);

router.patch(
  '/:id',
  authenticate,
  requirePermission('po:create'),
  controllers.update,
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('po:create'),
  controllers.remove,
);

router.post(
  '/:id/restore',
  authenticate,
  requirePermission('po:create'),
  controllers.restore,
);

router.delete(
  '/:id/permanent',
  authenticate,
  requirePermission('po:permanent-delete'),
  controllers.permanentDelete,
);

export default router;
