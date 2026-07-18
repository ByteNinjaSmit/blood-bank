import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission, requireRole } from '@/shared/middlewares/rbac';
import { hospitalController } from './hospital.controller';

const router = Router();

const MANAGE = ['system-admin', 'bbo'] as const;
const READ = [
  'system-admin',
  'bbo',
  'medical-officer',
  'issue-counter',
  'store-keeper',
  'auditor',
  'hospital-user',
] as const;

const MANAGE_PERM = requirePermission('hospital:manage');
const READ_PERM = requirePermission('hospital:read');

router.post('/', authenticate, requireRole([...MANAGE]), MANAGE_PERM, hospitalController.create);
router.get('/', authenticate, requireRole([...READ]), READ_PERM, hospitalController.list);
router.get('/:id', authenticate, requireRole([...READ]), READ_PERM, hospitalController.get);
router.put('/:id', authenticate, requireRole([...MANAGE]), MANAGE_PERM, hospitalController.update);
router.delete('/:id', authenticate, requireRole([...MANAGE]), MANAGE_PERM, hospitalController.remove);
router.post('/:id/restore', authenticate, requireRole([...MANAGE]), MANAGE_PERM, hospitalController.restore);
router.delete('/:id/permanent', authenticate, requireRole(['system-admin']), MANAGE_PERM, hospitalController.permanentDelete);

export default router;
