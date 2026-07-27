import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createBagIssueRepo } from '@/modules/bag-issue/bag-issue.repository';
import { createBagIssueService } from '@/modules/bag-issue/bag-issue.service';
import { createBagIssueControllers } from '@/modules/bag-issue/bag-issue.controller';
import { createBagStockRepo } from '@/modules/bag-stock/bag-stock.repository';

const service = createBagIssueService({
  bagIssues: createBagIssueRepo(),
  bagStock: createBagStockRepo(),
});
const controllers = createBagIssueControllers(service);

const router = Router();

router.get(
  '/',
  authenticate,
  requirePermission('bag-issue:read'),
  controllers.list,
);

router.get(
  '/:id',
  authenticate,
  requirePermission('bag-issue:read'),
  controllers.get,
);

router.post(
  '/',
  authenticate,
  requirePermission('bag-issue:create'),
  controllers.issue,
);

router.patch(
  '/:id/mark-used',
  authenticate,
  requirePermission('bag-issue:create'),
  controllers.markUsed,
);

router.patch(
  '/:id/return',
  authenticate,
  requirePermission('bag-issue:create'),
  controllers.markReturned,
);

router.patch(
  '/:id/mark-damaged',
  authenticate,
  requirePermission('bag-issue:create'),
  controllers.markDamaged,
);

export default router;
