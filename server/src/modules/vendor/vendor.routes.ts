import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createVendorRepo } from '@/modules/vendor/vendor.repository';
import { createVendorService } from '@/modules/vendor/vendor.service';
import { createVendorControllers } from '@/modules/vendor/vendor.controller';

const service = createVendorService({ vendors: createVendorRepo() });
const controllers = createVendorControllers(service);

const router = Router();

router.get('/', authenticate, requirePermission('vendor:read'), controllers.list);

router.get('/:id', authenticate, requirePermission('vendor:read'), controllers.get);

router.post('/', authenticate, requirePermission('vendor:create'), controllers.create);

router.patch('/:id', authenticate, requirePermission('vendor:update'), controllers.update);

router.patch(
  '/:id/status',
  authenticate,
  requirePermission('vendor:update'),
  controllers.updateStatus,
);

router.delete('/:id', authenticate, requirePermission('vendor:delete'), controllers.remove);

router.post('/:id/restore', authenticate, requirePermission('vendor:delete'), controllers.restore);

router.delete(
  '/:id/permanent',
  authenticate,
  requirePermission('vendor:permanent-delete'),
  controllers.permanentDelete,
);

export default router;
