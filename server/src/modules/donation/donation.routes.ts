import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createDonorRepo } from '@/modules/donor/donor.repository';
import { createDonorService } from '@/modules/donor/donor.service';
import { createDonationRepo } from '@/modules/donation/donation.repository';
import { createDeferralRepo } from '@/modules/deferral/deferral.repository';
import { createDonationService } from '@/modules/donation/donation.service';
import { createDonationControllers } from '@/modules/donation/donation.controller';
import { createBagStockRepo } from '@/modules/bag-stock/bag-stock.repository';
import { createBagIssueRepo } from '@/modules/bag-issue/bag-issue.repository';

const donorRepo = createDonorRepo();

const service = createDonationService({
  donations: createDonationRepo(),
  donors: donorRepo,
  deferrals: createDeferralRepo(),
  bagStock: createBagStockRepo(),
  bagIssues: createBagIssueRepo(),
  donorService: createDonorService({ repo: donorRepo }),
});
const controllers = createDonationControllers(service);

const router = Router();

router.get('/', authenticate, requirePermission('donation:read'), controllers.list);

// Inward Donation (bag-first) — static paths registered before the
// `/:id` param routes below so Express doesn't swallow them (e.g.
// GET /incomplete would otherwise match GET /:id with id="incomplete").
// Same permissions as standard donor/donation creation — no additional
// role restriction for this feature per product decision.
router.get(
  '/incomplete',
  authenticate,
  requirePermission('donation:read'),
  controllers.listIncomplete,
);
router.post(
  '/inward',
  authenticate,
  requirePermission('donation:create'),
  controllers.createInward,
);

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

router.patch(
  '/:id/link-donor',
  authenticate,
  requirePermission('donation:update'),
  controllers.linkDonor,
);
router.patch(
  '/:id/medical-history',
  authenticate,
  requirePermission('donation:update'),
  controllers.saveMedicalHistory,
);
router.patch(
  '/:id/finalize',
  authenticate,
  requirePermission('donation:update'),
  controllers.finalizeInward,
);

export default router;
