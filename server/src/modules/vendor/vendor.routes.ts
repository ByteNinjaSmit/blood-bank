import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requireRole, requirePermission } from '@/shared/middlewares/rbac';
import { createVendorRepo } from '@/modules/vendor/vendor.repository';
import { createVendorService } from '@/modules/vendor/vendor.service';
import { createVendorControllers } from '@/modules/vendor/vendor.controller';

const service = createVendorService({ vendors: createVendorRepo() });
const controllers = createVendorControllers(service);

const router = Router();

router.get(
  '/',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'qa-manager']),
  requirePermission('vendor:read'),
  controllers.list,
);

router.get(
  '/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'qa-manager']),
  requirePermission('vendor:read'),
  controllers.get,
);

router.post(
  '/',
  authenticate,
  requireRole(['system-admin', 'bbo']),
  requirePermission('vendor:create'),
  controllers.create,
);

router.patch(
  '/:id',
  authenticate,
  requireRole(['system-admin', 'bbo']),
  requirePermission('vendor:update'),
  controllers.update,
);

router.patch(
  '/:id/status',
  authenticate,
  requireRole(['system-admin', 'bbo']),
  requirePermission('vendor:update'),
  controllers.updateStatus,
);

router.delete(
  '/:id',
  authenticate,
  requireRole(['system-admin']),
  requirePermission('vendor:delete'),
  controllers.remove,
);

export default router;
