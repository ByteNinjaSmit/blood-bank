import type { NextFunction, Request, Response } from 'express';
import { ValidateTti } from '@/modules/tti/tti.validator';
import type { TtiService } from '@/modules/tti/tti.service';
import { UnauthorizedError } from '@/shared/errors';

export interface TtiControllers {
  recordTests: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  finalize: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  get: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function createTtiControllers(service: TtiService): TtiControllers {
  const actor = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async recordTests(req, res, next) {
      try {
        const { donationId } = ValidateTti.donationIdParam(req);
        const { tests } = ValidateTti.recordBody(req);
        const result = await service.recordTests(donationId, tests, actor(req));
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async finalize(req, res, next) {
      try {
        const { donationId } = ValidateTti.donationIdParam(req);
        const result = await service.finalize(donationId, actor(req), req.id);
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async get(req, res, next) {
      try {
        const { donationId } = ValidateTti.donationIdParam(req);
        const result = await service.get(donationId);
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
