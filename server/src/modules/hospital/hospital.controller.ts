import type { NextFunction, Request, Response } from 'express';
import { ValidateHospital } from './hospital.validator';
import { hospitalService } from './hospital.service';
import { UnauthorizedError } from '@/shared/errors';

const actor = (req: Request): string => {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
};

export const hospitalController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hospitalService.create(ValidateHospital.createBody(req), actor(req));
      res.status(201).json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { items, pagination } = await hospitalService.list(ValidateHospital.listQuery(req));
      res.json({ success: true, data: items, pagination, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = ValidateHospital.idParam(req);
      res.json({ success: true, data: await hospitalService.get(id), requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = ValidateHospital.idParam(req);
      const data = await hospitalService.update(id, ValidateHospital.updateBody(req), actor(req));
      res.json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = ValidateHospital.idParam(req);
      await hospitalService.remove(id, actor(req));
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },
};
