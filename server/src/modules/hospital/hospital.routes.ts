import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requireRole } from '@/shared/middlewares/rbac';
import { hospitalController } from './hospital.controller';

const router = Router();

const MANAGE = ['system-admin', 'bbo'] as const;
const READ = ['system-admin', 'bbo', 'medical-officer', 'issue-counter', 'store-keeper', 'auditor', 'hospital-user'] as const;

router.post('/', authenticate, requireRole([...MANAGE]), hospitalController.create);
router.get('/', authenticate, requireRole([...READ]), hospitalController.list);
router.get('/:id', authenticate, requireRole([...READ]), hospitalController.get);
router.put('/:id', authenticate, requireRole([...MANAGE]), hospitalController.update);
router.delete('/:id', authenticate, requireRole(['system-admin']), hospitalController.remove);

export default router;
