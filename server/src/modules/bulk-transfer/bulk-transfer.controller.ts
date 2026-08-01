import type { NextFunction, Request, Response } from 'express';
import { ValidateBulkTransfer } from '@/modules/bulk-transfer/bulk-transfer.validator';
import type { BulkTransferService } from '@/modules/bulk-transfer/bulk-transfer.service';
import { UnauthorizedError } from '@/shared/errors';
import { extractEditReason } from '@/shared/utils/edit-reason';

export interface BulkTransferControllers {
  list(req: Request, res: Response, next: NextFunction): Promise<void>;
  get(req: Request, res: Response, next: NextFunction): Promise<void>;
  create(req: Request, res: Response, next: NextFunction): Promise<void>;
  update(req: Request, res: Response, next: NextFunction): Promise<void>;
  remove(req: Request, res: Response, next: NextFunction): Promise<void>;
  restore(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export function createBulkTransferControllers(
  service: BulkTransferService,
): BulkTransferControllers {
  const actorId = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async list(req, res, next) {
      try {
        const q = ValidateBulkTransfer.listQuery(req);
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
        const { id } = ValidateBulkTransfer.idParam(req);
        const data = await service.get(id);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async create(req, res, next) {
      try {
        const body = ValidateBulkTransfer.createBody(req);
        const data = await service.create(body, actorId(req));
        res.status(201).json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async update(req, res, next) {
      try {
        const { id } = ValidateBulkTransfer.idParam(req);
        const editReason = extractEditReason(req);
        const body = ValidateBulkTransfer.updateBody(req);
        const data = await service.update(id, body, actorId(req), editReason);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async remove(req, res, next) {
      try {
        const { id } = ValidateBulkTransfer.idParam(req);
        const { reason } = ValidateBulkTransfer.deleteReasonBody(req);
        const data = await service.remove(id, actorId(req), reason);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async restore(req, res, next) {
      try {
        const { id } = ValidateBulkTransfer.idParam(req);
        const data = await service.restore(id, actorId(req));
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
