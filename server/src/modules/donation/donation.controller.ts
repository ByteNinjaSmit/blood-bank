import type { NextFunction, Request, Response } from 'express';
import { ValidateDonation } from '@/modules/donation/donation.validator';
import type { DonationService } from '@/modules/donation/donation.service';
import { UnauthorizedError } from '@/shared/errors';

export interface DonationControllers {
  create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  get: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function createDonationControllers(service: DonationService): DonationControllers {
  const actorIdOrThrow = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async create(req, res, next) {
      try {
        const body = ValidateDonation.createBody(req);
        const created = await service.register(body, actorIdOrThrow(req));
        res.status(201).json({ success: true, data: created, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async list(req, res, next) {
      try {
        const query = ValidateDonation.listQuery(req);
        const result = await service.list(query);
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async get(req, res, next) {
      try {
        const { id } = ValidateDonation.idParam(req);
        const found = await service.get(id);
        res.json({ success: true, data: found, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
