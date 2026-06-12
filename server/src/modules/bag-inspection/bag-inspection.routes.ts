import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requireRole, requirePermission } from '@/shared/middlewares/rbac';
import { createBagInspectionRepo } from '@/modules/bag-inspection/bag-inspection.repository';
import { createBagInspectionService } from '@/modules/bag-inspection/bag-inspection.service';
import { createBagInspectionControllers } from '@/modules/bag-inspection/bag-inspection.controller';

const service = createBagInspectionService({ inspections: createBagInspectionRepo() });
const controllers = createBagInspectionControllers(service);

const router = Router();

router.get(
  '/',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'qa-manager']),
  requirePermission('bag-inspection:read'),
  controllers.list,
);

router.get(
  '/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'qa-manager']),
  requirePermission('bag-inspection:read'),
  controllers.get,
);

router.post(
  '/',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'qa-manager']),
  requirePermission('bag-inspection:create'),
  controllers.create,
);

router.patch(
  '/:id/report',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'qa-manager']),
  requirePermission('bag-inspection:create'),
  controllers.updateReport,
);

export default router;
