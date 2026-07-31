import type { NextFunction, Request, Response } from 'express';
import { ValidateNotification } from './notification.validator';
import type { NotificationCenterService } from './notification-center.service';
import { NotFoundError, UnauthorizedError } from '@/shared/errors';

export function createNotificationControllers(service: NotificationCenterService) {
  const actor = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async list(req: Request, res: Response, next: NextFunction) {
      try {
        const { page, pageSize, read, severity, module } = ValidateNotification.listQuery(req);
        // Best-effort: keep the dashboard stock digest fresh without a cron job.
        service.checkAndCreateStockSummary().catch(() => undefined);
        const data = await service.list(actor(req), { read, severity, module }, page, pageSize);
        res.json({ success: true, data: { ...data, page, pageSize }, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async unreadCount(req: Request, res: Response, next: NextFunction) {
      try {
        const count = await service.unreadCount(actor(req));
        res.json({ success: true, data: { count }, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async markRead(req: Request, res: Response, next: NextFunction) {
      try {
        const { id } = ValidateNotification.idParam(req);
        const data = await service.markRead(id, actor(req));
        if (!data) throw new NotFoundError('Notification not found');
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async markUnread(req: Request, res: Response, next: NextFunction) {
      try {
        const { id } = ValidateNotification.idParam(req);
        const data = await service.markUnread(id, actor(req));
        if (!data) throw new NotFoundError('Notification not found');
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async markAllRead(req: Request, res: Response, next: NextFunction) {
      try {
        const count = await service.markAllRead(actor(req));
        res.json({ success: true, data: { count }, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async clearRead(req: Request, res: Response, next: NextFunction) {
      try {
        const count = await service.clearRead(actor(req));
        res.json({ success: true, data: { count }, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async remove(req: Request, res: Response, next: NextFunction) {
      try {
        const { id } = ValidateNotification.idParam(req);
        const ok = await service.remove(id, actor(req));
        if (!ok) throw new NotFoundError('Notification not found');
        res.json({ success: true, data: { id }, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
