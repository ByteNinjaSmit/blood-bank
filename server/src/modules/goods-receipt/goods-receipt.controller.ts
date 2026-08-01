import type { NextFunction, Request, Response } from 'express';
import { ValidateGRN } from '@/modules/goods-receipt/goods-receipt.validator';
import type { GRNService } from '@/modules/goods-receipt/goods-receipt.service';
import { UnauthorizedError } from '@/shared/errors';

export interface GRNControllers {
  list(req: Request, res: Response, next: NextFunction): Promise<void>;
  get(req: Request, res: Response, next: NextFunction): Promise<void>;
  create(req: Request, res: Response, next: NextFunction): Promise<void>;
  update(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export function createGRNControllers(service: GRNService): GRNControllers {
  const actorId = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async list(req, res, next) {
      try {
        const q = ValidateGRN.listQuery(req);
        const result = await service.list(q);
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async get(req, res, next) {
      try {
        const { id } = ValidateGRN.idParam(req);
        const data = await service.get(id);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async create(req, res, next) {
      try {
        const body = ValidateGRN.createBody(req);
        const data = await service.create(body, actorId(req));
        res.status(201).json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async update(req, res, next) {
      try {
        const { id } = ValidateGRN.idParam(req);
        const body = ValidateGRN.updateBody(req);
        const data = await service.update(id, body, actorId(req));
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
