// Legacy-path-compatible donation lookup, used by the discard-entry
// form to prefill batch/segment number from a scanned bag number.
// Mounted at /api/donation (outside /api/v2) so the existing client
// call to /api/donation/lookup/:bagNo keeps working unchanged.
import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission, requireRole } from '@/shared/middlewares/rbac';
import { createDonationRepo } from '@/modules/donation/donation.repository';
import { NotFoundError } from '@/shared/errors';

const donations = createDonationRepo();
const router = Router();

router.get(
  '/lookup/:bagNo',
  authenticate,
  requireRole([
    'system-admin',
    'bbo',
    'lab-tech-component',
    'lab-tech-serology',
    'qa-manager',
    'store-keeper',
  ]),
  requirePermission('donation:read'),
  async (req, res, next) => {
    try {
      const bagNo = String(req.params.bagNo);
      const result = await donations.lookupByBagNo(bagNo);
      if (!result) throw new NotFoundError('Donation', bagNo);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
