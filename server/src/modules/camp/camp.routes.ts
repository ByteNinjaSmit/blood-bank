import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { campController } from './camp.controller';

const router = Router();

const MANAGE = ['system-admin', 'bbo', 'camp-organiser'] as const;
const READ = [
  'system-admin',
  'bbo',
  'medical-officer',
  'phlebotomist',
  'lab-tech-component',
  'lab-tech-serology',
  'store-keeper',
  'auditor',
  'camp-organiser',
  // Camp Donor Appointment List (appointment.routes.ts allows counsellor)
  // looks up camps/voluntary-donations here to populate its own picker.
  'counsellor',
] as const;

const MANAGE_PERM = requirePermission('camp:manage');
const READ_PERM = requirePermission('camp:read');

router.post('/new', authenticate, MANAGE_PERM, campController.create);
router.put('/update/:id', authenticate, MANAGE_PERM, campController.update);
router.delete('/delete/:id', authenticate, MANAGE_PERM, campController.remove);
router.post('/restore/:id', authenticate, MANAGE_PERM, campController.restore);
router.get('/details/:id', authenticate, READ_PERM, campController.detail);
router.get('/details', authenticate, READ_PERM, campController.all);
router.get('/staff-list', authenticate, READ_PERM, campController.staffList);
router.get('/list', authenticate, READ_PERM, campController.campList);
router.get(
  '/donations/:campId',
  authenticate,
  READ_PERM,
  campController.campDonations,
);
router.get('/donors/:campId', authenticate, READ_PERM, campController.campDonors);
router.get('/voluntary-donations', authenticate, READ_PERM, campController.voluntary);

export default router;
