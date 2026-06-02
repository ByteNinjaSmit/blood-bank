import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requireRole, requirePermission } from '@/shared/middlewares/rbac';
import { createDonorRepo } from '@/modules/donor/donor.repository';
import { createDonorService } from '@/modules/donor/donor.service';
import { createDonorControllers } from '@/modules/donor/donor.controller';

const repo = createDonorRepo();
const service = createDonorService({ repo });
const controllers = createDonorControllers(service);

const router = Router();

router.get(
  '/',
  authenticate,
  requireRole([
    'system-admin', 'bbo', 'medical-officer', 'counsellor',
    'phlebotomist', 'lab-tech-component', 'lab-tech-serology',
    'store-keeper', 'issue-counter', 'apheresis-tech', 'qa-manager',
    'auditor', 'camp-organiser',
  ]),
  requirePermission('donor:read'),
  controllers.list,
);

router.get(
  '/:id',
  authenticate,
  requireRole([
    'system-admin', 'bbo', 'medical-officer', 'counsellor',
    'phlebotomist', 'lab-tech-component', 'lab-tech-serology',
    'store-keeper', 'issue-counter', 'apheresis-tech', 'qa-manager',
    'auditor', 'camp-organiser',
  ]),
  requirePermission('donor:read'),
  controllers.get,
);

router.post(
  '/',
  authenticate,
  requireRole(['system-admin', 'phlebotomist', 'counsellor', 'apheresis-tech', 'camp-organiser']),
  requirePermission('donor:create'),
  controllers.create,
);

router.put(
  '/:id',
  authenticate,
  requireRole(['system-admin', 'phlebotomist', 'counsellor', 'medical-officer', 'apheresis-tech']),
  requirePermission('donor:update'),
  controllers.update,
);

router.delete(
  '/:id',
  authenticate,
  requireRole(['system-admin', 'bbo']),
  requirePermission('donor:delete'),
  controllers.remove,
);

export default router;
