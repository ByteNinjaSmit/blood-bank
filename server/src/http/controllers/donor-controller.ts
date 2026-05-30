// HTTP only. Validate, call service, format response. Errors thrown
// here flow through the single error middleware.

import type { Request, Response, NextFunction } from 'express';
import { Validate } from '@/http/validators/donor';
import type { DonorService } from '@/domain/donor/donor-service';
import { UnauthorizedError } from '@/shared/errors';

export interface DonorControllers {
  create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  get: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  remove: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function createDonorControllers(service: DonorService): DonorControllers {
  const actorIdOrThrow = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async create(req, res, next) {
      try {
        const body = Validate.createBody(req);
        const created = await service.register(body, actorIdOrThrow(req));
        res.status(201).json({ success: true, data: created, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async update(req, res, next) {
      try {
        const { id } = Validate.idParam(req);
        const body = Validate.updateBody(req);
        const updated = await service.update(id, body, actorIdOrThrow(req));
        res.json({ success: true, data: updated, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async get(req, res, next) {
      try {
        const { id } = Validate.idParam(req);
        const donor = await service.get(id);
        if (!donor) {
          res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Donor not found', requestId: req.id });
          return;
        }
        res.json({ success: true, data: donor, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async list(req, res, next) {
      try {
        const query = Validate.listQuery(req);
        const result = await service.list(query);
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async remove(req, res, next) {
      try {
        const { id } = Validate.idParam(req);
        actorIdOrThrow(req);
        await service.remove(id);
        res.status(204).end();
      } catch (e) {
        next(e);
      }
    },
  };
}
