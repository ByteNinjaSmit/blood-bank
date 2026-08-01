import type { NextFunction, Request, Response } from 'express';
import { ValidateVendor } from '@/modules/vendor/vendor.validator';
import type { VendorService } from '@/modules/vendor/vendor.service';
import { UnauthorizedError } from '@/shared/errors';
import { extractEditReason } from '@/shared/utils/edit-reason';

export interface VendorControllers {
  list(req: Request, res: Response, next: NextFunction): Promise<void>;
  get(req: Request, res: Response, next: NextFunction): Promise<void>;
  create(req: Request, res: Response, next: NextFunction): Promise<void>;
  update(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
  remove(req: Request, res: Response, next: NextFunction): Promise<void>;
  restore(req: Request, res: Response, next: NextFunction): Promise<void>;
  permanentDelete(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export function createVendorControllers(service: VendorService): VendorControllers {
  const actorId = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async list(req, res, next) {
      try {
        const q = ValidateVendor.listQuery(req);
        const result = await service.list(q);
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async get(req, res, next) {
      try {
        const { id } = ValidateVendor.idParam(req);
        const data = await service.get(id);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async create(req, res, next) {
      try {
        const body = ValidateVendor.createBody(req);
        const data = await service.create(body, actorId(req));
        res.status(201).json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async update(req, res, next) {
      try {
        const { id } = ValidateVendor.idParam(req);
        const editReason = extractEditReason(req);
        const body = ValidateVendor.updateBody(req);
        const data = await service.update(id, body, actorId(req), editReason);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async updateStatus(req, res, next) {
      try {
        const { id } = ValidateVendor.idParam(req);
        const body = ValidateVendor.updateStatusBody(req);
        const data = await service.updateStatus(id, body, actorId(req));
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async remove(req, res, next) {
      try {
        const { id } = ValidateVendor.idParam(req);
        const { reason } = ValidateVendor.deleteReasonBody(req);
        await service.softDelete(id, actorId(req), reason);
        res.status(204).end();
      } catch (e) {
        next(e);
      }
    },

    async restore(req, res, next) {
      try {
        const { id } = ValidateVendor.idParam(req);
        const data = await service.restore(id, actorId(req));
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async permanentDelete(req, res, next) {
      try {
        const { id } = ValidateVendor.idParam(req);
        const { reason } = ValidateVendor.deleteReasonBody(req);
        await service.permanentDelete(id, actorId(req), reason);
        res.status(204).end();
      } catch (e) {
        next(e);
      }
    },
  };
}
