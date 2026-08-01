import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { roleController } from './role.controller';

const router = Router();

router.get('/', authenticate, requirePermission('role:read'), roleController.list);

router.get('/:id', authenticate, requirePermission('role:read'), roleController.get);

router.post('/', authenticate, requirePermission('role:create'), roleController.create);

router.patch('/:id', authenticate, requirePermission('role:update'), roleController.update);

router.delete('/:id', authenticate, requirePermission('role:delete'), roleController.remove);

export default router;
