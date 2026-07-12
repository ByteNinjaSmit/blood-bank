import type { NextFunction, Request, Response } from 'express';
import { ValidateInventoryLegacyView } from '@/modules/inventory/inventory.legacy-view.validator';
import type { InventoryLegacyViewService } from '@/modules/inventory/inventory.legacy-view.service';

export interface InventoryLegacyViewControllers {
  listStock: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  unreserve: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  sendToStorage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function createInventoryLegacyViewControllers(
  service: InventoryLegacyViewService,
): InventoryLegacyViewControllers {
  return {
    async listStock(req, res, next) {
      try {
        const filters = ValidateInventoryLegacyView.stockListQuery(req);
        const { data, total, totalPages, page, limit } = await service.listStock(filters);
        res.json({ success: true, data, pagination: { total, totalPages, page, limit } });
      } catch (e) {
        next(e);
      }
    },

    async unreserve(req, res, next) {
      try {
        const { inventoryIds, userId } = ValidateInventoryLegacyView.unreserveBody(req);
        const actorId = req.user?.id || userId;
        await service.unreserve(inventoryIds, actorId as string);
        res.json({ success: true, message: 'Blood units successfully unreserved.' });
      } catch (e) {
        next(e);
      }
    },

    async sendToStorage(req, res, next) {
      try {
        const body = ValidateInventoryLegacyView.sendToStorageBody(req);
        const actorId = req.user?.id || body.userId;
        const { message, skipped } = await service.sendToStorage({ ...body, actorId: actorId as string });
        res.json({ success: true, message, skipped });
      } catch (e) {
        next(e);
      }
    },
  };
}
