import { Router } from 'express';
import { authenticate } from '@/http/middlewares/authenticate';
import { requirePermission, requireRole } from '@/http/middlewares/rbac';
import { createDonorRepo } from '@/infra/db/repositories/donor-repo';
import { createDonationRepo } from '@/infra/db/repositories/donation-repo';
import { createDonationService } from '@/domain/donation/donation-service';
import { createDonationControllers } from '@/http/controllers/donation-controller';

const service = createDonationService({
  donations: createDonationRepo(),
  donors: createDonorRepo(),
});
const controllers = createDonationControllers(service);

const router = Router();

router.get(
  '/',
  authenticate,
  requireRole([
    'system-admin',
    'bbo',
    'medical-officer',
    'phlebotomist',
    'lab-tech-component',
    'lab-tech-serology',
    'store-keeper',
    'issue-counter',
    'apheresis-tech',
    'qa-manager',
    'auditor',
    'camp-organiser',
  ]),
  requirePermission('donation:read'),
  controllers.list,
);

router.get(
  '/:id',
  authenticate,
  requireRole([
    'system-admin',
    'bbo',
    'medical-officer',
    'phlebotomist',
    'lab-tech-component',
    'lab-tech-serology',
    'store-keeper',
    'issue-counter',
    'apheresis-tech',
    'qa-manager',
    'auditor',
  ]),
  requirePermission('donation:read'),
  controllers.get,
);

router.post(
  '/',
  authenticate,
  requireRole(['system-admin', 'phlebotomist', 'apheresis-tech', 'medical-officer']),
  requirePermission('donation:create'),
  controllers.create,
);

export default router;
