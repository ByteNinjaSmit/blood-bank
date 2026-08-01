import type { NextFunction, Request, Response } from 'express';
import { ValidateBagDiscard } from '@/modules/bag-discard/bag-discard.validator';
import type { BagDiscardService } from '@/modules/bag-discard/bag-discard.service';
import { UnauthorizedError } from '@/shared/errors';

export interface BagDiscardControllers {
  list(req: Request, res: Response, next: NextFunction): Promise<void>;
  get(req: Request, res: Response, next: NextFunction): Promise<void>;
  create(req: Request, res: Response, next: NextFunction): Promise<void>;
  approve(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export function createBagDiscardControllers(service: BagDiscardService): BagDiscardControllers {
  const actorId = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async list(req, res, next) {
      try {
        const q = ValidateBagDiscard.listQuery(req);
        const result = await service.list(q);
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async get(req, res, next) {
      try {
        const { id } = ValidateBagDiscard.idParam(req);
        const data = await service.get(id);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async create(req, res, next) {
      try {
        const body = ValidateBagDiscard.createBody(req);
        const data = await service.create(body, actorId(req));
        res.status(201).json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async approve(req, res, next) {
      try {
        const { id } = ValidateBagDiscard.idParam(req);
        const body = ValidateBagDiscard.approveBody(req);
        const data = await service.approve(id, body, actorId(req));
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
