import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission, requireRole } from '@/shared/middlewares/rbac';
import { userController } from './user.controller';

const router = Router();

router.post(
  '/',
  authenticate,
  requireRole(['system-admin']),
  requirePermission('user:create'),
  userController.create,
);

router.get(
  '/',
  authenticate,
  requireRole(['system-admin', 'bbo', 'qa-manager', 'auditor']),
  requirePermission('user:read'),
  userController.list,
);

router.get(
  '/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'qa-manager', 'auditor']),
  requirePermission('user:read'),
  userController.get,
);

router.put(
  '/:id',
  authenticate,
  requireRole(['system-admin', 'bbo']),
  requirePermission('user:update'),
  userController.update,
);

router.delete(
  '/:id',
  authenticate,
  requireRole(['system-admin']),
  requirePermission('user:deactivate'),
  userController.deactivate,
);

export default router;
