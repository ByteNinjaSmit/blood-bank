import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createDonorCardRepo } from '@/modules/donor-card/donor-card.repository';
import { createDonorCardControllers } from '@/modules/donor-card/donor-card.controller';

const repo = createDonorCardRepo();
const controllers = createDonorCardControllers(repo);

const CLINICAL_READ = [
  'system-admin',
  'bbo',
  'medical-officer',
  'lab-tech-serology',
  'store-keeper',
  'issue-counter',
  'auditor',
  'hospital-user',
] as const;

const router = Router();

router.get('/', authenticate, requirePermission('requisition:read'), controllers.list);
router.get(
  '/by-requisition/:requisitionId',
  authenticate,
  requirePermission('requisition:read'),
  controllers.getByRequisition,
);
router.post('/', authenticate, requirePermission('requisition:create'), controllers.create);

export default router;
