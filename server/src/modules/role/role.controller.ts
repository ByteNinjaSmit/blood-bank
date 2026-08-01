import type { NextFunction, Request, Response } from 'express';
import { ValidateRole } from './role.validator';
import { roleService } from './role.service';
import { UnauthorizedError } from '@/shared/errors';

const actor = (req: Request): string => {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
};

export const roleController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = ValidateRole.createBody(req);
      const data = await roleService.create(body, actor(req));
      res.status(201).json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const q = ValidateRole.listQuery(req);
      const { items, pagination } = await roleService.list(q);
      res.json({ success: true, data: items, pagination, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = ValidateRole.idParam(req);
      const data = await roleService.get(id);
      res.json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = ValidateRole.idParam(req);
      const body = ValidateRole.updateBody(req);
      const data = await roleService.update(id, body, actor(req));
      res.json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = ValidateRole.idParam(req);
      await roleService.remove(id, actor(req));
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },
};
