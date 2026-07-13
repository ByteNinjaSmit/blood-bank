import type { NextFunction, Request, Response } from 'express';
import { ValidatePO } from '@/modules/purchase-order/purchase-order.validator';
import type { POService } from '@/modules/purchase-order/purchase-order.service';
import { UnauthorizedError } from '@/shared/errors';
import { extractEditReason } from '@/shared/utils/edit-reason';

export interface POControllers {
  list(req: Request, res: Response, next: NextFunction): Promise<void>;
  get(req: Request, res: Response, next: NextFunction): Promise<void>;
  create(req: Request, res: Response, next: NextFunction): Promise<void>;
  update(req: Request, res: Response, next: NextFunction): Promise<void>;
  remove(req: Request, res: Response, next: NextFunction): Promise<void>;
  restore(req: Request, res: Response, next: NextFunction): Promise<void>;
  permanentDelete(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export function createPOControllers(service: POService): POControllers {
  const actorId = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async list(req, res, next) {
      try {
        const q = ValidatePO.listQuery(req);
        const result = await service.list(q);
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async get(req, res, next) {
      try {
        const { id } = ValidatePO.idParam(req);
        const data = await service.get(id);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) { next(e); }
    },

    async create(req, res, next) {
      try {
        const body = ValidatePO.createBody(req);
        const data = await service.create(body, actorId(req));
        res.status(201).json({ success: true, data, requestId: req.id });
      } catch (e) { next(e); }
    },

    async update(req, res, next) {
      try {
        const { id } = ValidatePO.idParam(req);
        const editReason = extractEditReason(req);
        const body = ValidatePO.updateBody(req);
        const data = await service.update(id, body, actorId(req), editReason);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) { next(e); }
    },

    async remove(req, res, next) {
      try {
        const { id } = ValidatePO.idParam(req);
        const { reason } = ValidatePO.deleteReasonBody(req);
        await service.delete(id, actorId(req), reason);
        res.json({ success: true, message: 'Purchase order deleted successfully', requestId: req.id });
      } catch (e) { next(e); }
    },

    async restore(req, res, next) {
      try {
        const { id } = ValidatePO.idParam(req);
        const data = await service.restore(id, actorId(req));
        res.json({ success: true, data, requestId: req.id });
      } catch (e) { next(e); }
    },

    async permanentDelete(req, res, next) {
      try {
        const { id } = ValidatePO.idParam(req);
        const { reason } = ValidatePO.deleteReasonBody(req);
        await service.permanentDelete(id, actorId(req), reason);
        res.status(204).end();
      } catch (e) { next(e); }
    },
  };
}
