import type { NextFunction, Request, Response } from 'express';
import { ValidateBagInspection } from '@/modules/bag-inspection/bag-inspection.validator';
import type { BagInspectionService } from '@/modules/bag-inspection/bag-inspection.service';
import { UnauthorizedError } from '@/shared/errors';

export interface BagInspectionControllers {
  list(req: Request, res: Response, next: NextFunction): Promise<void>;
  get(req: Request, res: Response, next: NextFunction): Promise<void>;
  create(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateReport(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export function createBagInspectionControllers(service: BagInspectionService): BagInspectionControllers {
  const actorId = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async list(req, res, next) {
      try {
        const q = ValidateBagInspection.listQuery(req);
        const result = await service.list(q);
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) { next(e); }
    },

    async get(req, res, next) {
      try {
        const { id } = ValidateBagInspection.idParam(req);
        const data = await service.get(id);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) { next(e); }
    },

    async create(req, res, next) {
      try {
        const body = ValidateBagInspection.createBody(req);
        const data = await service.create(body, actorId(req));
        res.status(201).json({ success: true, data, requestId: req.id });
      } catch (e) { next(e); }
    },

    async updateReport(req, res, next) {
      try {
        const { id } = ValidateBagInspection.idParam(req);
        const body = ValidateBagInspection.updateReportBody(req);
        const data = await service.updateReport(id, body, actorId(req));
        res.json({ success: true, data, requestId: req.id });
      } catch (e) { next(e); }
    },
  };
}
