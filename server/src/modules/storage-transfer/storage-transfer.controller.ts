import type { NextFunction, Request, Response } from 'express';
import { ValidateStorageTransfer } from '@/modules/storage-transfer/storage-transfer.validator';
import type { StorageTransferService } from '@/modules/storage-transfer/storage-transfer.service';
import { UnauthorizedError } from '@/shared/errors';
import { extractEditReason } from '@/shared/utils/edit-reason';

export interface StorageTransferControllers {
  list(req: Request, res: Response, next: NextFunction): Promise<void>;
  get(req: Request, res: Response, next: NextFunction): Promise<void>;
  create(req: Request, res: Response, next: NextFunction): Promise<void>;
  update(req: Request, res: Response, next: NextFunction): Promise<void>;
  remove(req: Request, res: Response, next: NextFunction): Promise<void>;
  restore(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export function createStorageTransferControllers(
  service: StorageTransferService,
): StorageTransferControllers {
  const actorId = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async list(req, res, next) {
      try {
        const q = ValidateStorageTransfer.listQuery(req);
        const result = await service.list(q);
        res.json({
          success: true,
          data: result.items,
          pagination: { total: result.total, page: result.page, limit: result.limit },
          requestId: req.id,
        });
      } catch (e) {
        next(e);
      }
    },

    async get(req, res, next) {
      try {
        const { id } = ValidateStorageTransfer.idParam(req);
        const data = await service.get(id);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async create(req, res, next) {
      try {
        const body = ValidateStorageTransfer.createBody(req);
        const data = await service.create(body, actorId(req));
        res.status(201).json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async update(req, res, next) {
      try {
        const { id } = ValidateStorageTransfer.idParam(req);
        const editReason = extractEditReason(req);
        const body = ValidateStorageTransfer.updateBody(req);
        const data = await service.update(id, body, actorId(req), editReason);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async remove(req, res, next) {
      try {
        const { id } = ValidateStorageTransfer.idParam(req);
        const { reason } = ValidateStorageTransfer.deleteReasonBody(req);
        const data = await service.remove(id, actorId(req), reason);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async restore(req, res, next) {
      try {
        const { id } = ValidateStorageTransfer.idParam(req);
        const data = await service.restore(id, actorId(req));
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
