import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createDonorRepo } from '@/modules/donor/donor.repository';
import { createDonationRepo } from '@/modules/donation/donation.repository';
import { createDeferralRepo } from '@/modules/deferral/deferral.repository';
import { createDonationService } from '@/modules/donation/donation.service';
import { createDonationControllers } from '@/modules/donation/donation.controller';
import { createBagStockRepo } from '@/modules/bag-stock/bag-stock.repository';
import { createBagIssueRepo } from '@/modules/bag-issue/bag-issue.repository';

const service = createDonationService({
  donations: createDonationRepo(),
  donors: createDonorRepo(),
  deferrals: createDeferralRepo(),
  bagStock: createBagStockRepo(),
  bagIssues: createBagIssueRepo(),
});
const controllers = createDonationControllers(service);

const router = Router();

router.get('/', authenticate, requirePermission('donation:read'), controllers.list);

router.get('/:id', authenticate, requirePermission('donation:read'), controllers.get);

router.post('/', authenticate, requirePermission('donation:create'), controllers.create);

router.patch('/:id', authenticate, requirePermission('donation:update'), controllers.update);

router.delete('/:id', authenticate, requirePermission('donation:delete'), controllers.remove);
router.post(
  '/:id/restore',
  authenticate,
  requirePermission('donation:delete'),
  controllers.restore,
);
router.delete(
  '/:id/permanent',
  authenticate,
  requirePermission('donation:permanent-delete'),
  controllers.permanentDelete,
);

export default router;
