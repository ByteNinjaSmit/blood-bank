import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission, requireRole } from '@/shared/middlewares/rbac';
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

router.get('/', authenticate, requireRole([...CLINICAL_READ]), requirePermission('requisition:read'), controllers.list);
router.post(
  '/',
  authenticate,
  requireRole(['system-admin', 'bbo', 'medical-officer', 'hospital-user', 'issue-counter']),
  requirePermission('requisition:create'),
  controllers.create,
);

export default router;
