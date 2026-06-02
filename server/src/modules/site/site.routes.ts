import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requireRole } from '@/shared/middlewares/rbac';
import { siteController } from './site.controller';

const router = Router();

const MANAGE = ['system-admin', 'bbo', 'camp-organiser'] as const;
const READ = [
  'system-admin', 'bbo', 'medical-officer', 'phlebotomist', 'lab-tech-component',
  'lab-tech-serology', 'store-keeper', 'auditor', 'camp-organiser',
] as const;

router.post('/new', authenticate, requireRole([...MANAGE]), siteController.create);
router.put('/update/:id', authenticate, requireRole([...MANAGE]), siteController.update);
router.delete('/delete/:id', authenticate, requireRole([...MANAGE]), siteController.remove);
router.get('/details/:id', authenticate, requireRole([...READ]), siteController.detail);
router.get('/details', authenticate, requireRole([...READ]), siteController.all);
router.get('/staff-list', authenticate, requireRole([...READ]), siteController.staffList);
router.get('/list', authenticate, requireRole([...READ]), siteController.campList);
router.get('/camp-donations/:siteId', authenticate, requireRole([...READ]), siteController.campDonations);
router.get('/camp-donors/:siteId', authenticate, requireRole([...READ]), siteController.campDonors);
router.get('/voluntary-donations', authenticate, requireRole([...READ]), siteController.voluntary);

export default router;
