import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { hospitalController } from './hospital.controller';

const router = Router();

const MANAGE = ['system-admin', 'bbo'] as const;

const MANAGE_PERM = requirePermission('hospital:manage');
const READ_PERM = requirePermission('hospital:read');

router.post('/', authenticate, MANAGE_PERM, hospitalController.create);
// No requireRole on the read-only lookups — hospital:read is a universal
// permission (role-map.ts projectPermissions()) precisely because other
// pages (Requisition, Reservation) depend on this list to populate their
// own hospital picker regardless of the user's role; requirePermission
// alone is the real, meaningful gate here.
router.get('/', authenticate, READ_PERM, hospitalController.list);
router.get('/:id', authenticate, READ_PERM, hospitalController.get);
router.put('/:id', authenticate, MANAGE_PERM, hospitalController.update);
router.delete('/:id', authenticate, MANAGE_PERM, hospitalController.remove);
router.post('/:id/restore', authenticate, MANAGE_PERM, hospitalController.restore);
router.delete('/:id/permanent', authenticate, MANAGE_PERM, hospitalController.permanentDelete);

export default router;
