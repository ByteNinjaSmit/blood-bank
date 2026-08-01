import type { NextFunction, Request, Response } from 'express';
import { ValidateUser } from './user.validator';
import { userService } from './user.service';
import { UnauthorizedError } from '@/shared/errors';
import { extractEditReason } from '@/shared/utils/edit-reason';

const actor = (req: Request): string => {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
};

export const userController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = ValidateUser.createBody(req);
      const data = await userService.create(body, actor(req));
      res.status(201).json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const q = ValidateUser.listQuery(req);
      const { items, pagination } = await userService.list(q);
      res.json({ success: true, data: items, pagination, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = ValidateUser.idParam(req);
      const data = await userService.get(id);
      res.json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = ValidateUser.idParam(req);
      const editReason = extractEditReason(req);
      const body = ValidateUser.updateBody(req);
      const data = await userService.update(id, body, actor(req), editReason);
      res.json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = ValidateUser.idParam(req);
      const { reason } = ValidateUser.deactivateBody(req);
      await userService.deactivate(id, actor(req), reason);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },
};
