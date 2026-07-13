import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission, requireRole } from '@/shared/middlewares/rbac';
import { ROLE } from '@/shared/enums';
import { notificationCenterService } from './notification-center.service';
import { createNotificationControllers } from './notification.controller';

const controllers = createNotificationControllers(notificationCenterService);

const router = Router();

router.get(
  '/',
  authenticate,
  requireRole([...ROLE]),
  requirePermission('notification:read'),
  controllers.list,
);

router.get(
  '/unread-count',
  authenticate,
  requireRole([...ROLE]),
  requirePermission('notification:read'),
  controllers.unreadCount,
);

router.patch(
  '/mark-all-read',
  authenticate,
  requireRole([...ROLE]),
  requirePermission('notification:manage'),
  controllers.markAllRead,
);

router.delete(
  '/clear-read',
  authenticate,
  requireRole([...ROLE]),
  requirePermission('notification:manage'),
  controllers.clearRead,
);

router.patch(
  '/:id/read',
  authenticate,
  requireRole([...ROLE]),
  requirePermission('notification:manage'),
  controllers.markRead,
);

router.patch(
  '/:id/unread',
  authenticate,
  requireRole([...ROLE]),
  requirePermission('notification:manage'),
  controllers.markUnread,
);

router.delete(
  '/:id',
  authenticate,
  requireRole([...ROLE]),
  requirePermission('notification:manage'),
  controllers.remove,
);

export default router;
