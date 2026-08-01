import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { userController } from './user.controller';

const router = Router();

router.post('/', authenticate, requirePermission('user:create'), userController.create);

router.get('/', authenticate, requirePermission('user:read'), userController.list);

router.get('/:id', authenticate, requirePermission('user:read'), userController.get);

router.put('/:id', authenticate, requirePermission('user:update'), userController.update);

router.delete(
  '/:id',
  authenticate,
  requirePermission('user:deactivate'),
  userController.deactivate,
);

export default router;
