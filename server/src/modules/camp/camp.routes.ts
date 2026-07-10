import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requireRole } from '@/shared/middlewares/rbac';
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
] as const;

router.post('/new', authenticate, requireRole([...MANAGE]), campController.create);
router.put('/update/:id', authenticate, requireRole([...MANAGE]), campController.update);
router.delete('/delete/:id', authenticate, requireRole([...MANAGE]), campController.remove);
router.post('/restore/:id', authenticate, requireRole([...MANAGE]), campController.restore);
router.get('/details/:id', authenticate, requireRole([...READ]), campController.detail);
router.get('/details', authenticate, requireRole([...READ]), campController.all);
router.get('/staff-list', authenticate, requireRole([...READ]), campController.staffList);
router.get('/list', authenticate, requireRole([...READ]), campController.campList);
router.get(
  '/donations/:campId',
  authenticate,
  requireRole([...READ]),
  campController.campDonations,
);
router.get('/donors/:campId', authenticate, requireRole([...READ]), campController.campDonors);
router.get('/voluntary-donations', authenticate, requireRole([...READ]), campController.voluntary);

export default router;
