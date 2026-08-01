import type { NextFunction, Request, Response } from 'express';
import { ValidateBagStock } from '@/modules/bag-stock/bag-stock.validator';
import type { BagStockService } from '@/modules/bag-stock/bag-stock.service';
import { UnauthorizedError } from '@/shared/errors';

export interface BagStockControllers {
  list(req: Request, res: Response, next: NextFunction): Promise<void>;
  get(req: Request, res: Response, next: NextFunction): Promise<void>;
  summary(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
  openBox(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export function createBagStockControllers(service: BagStockService): BagStockControllers {
  const actorId = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async list(req, res, next) {
      try {
        const q = ValidateBagStock.listQuery(req);
        const result = await service.list(q);
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async get(req, res, next) {
      try {
        const { id } = ValidateBagStock.idParam(req);
        const data = await service.get(id);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async summary(req, res, next) {
      try {
        const data = await service.summary();
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async updateStatus(req, res, next) {
      try {
        const { id } = ValidateBagStock.idParam(req);
        const body = ValidateBagStock.updateStatusBody(req);
        const data = await service.updateStatus(id, body, actorId(req));
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async openBox(req, res, next) {
      try {
        const { id } = ValidateBagStock.idParam(req);
        const data = await service.openBox(id, actorId(req));
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
