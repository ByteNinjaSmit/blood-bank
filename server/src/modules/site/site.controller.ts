import type { NextFunction, Request, Response } from 'express';
import { ValidateSite } from './site.validator';
import { siteService } from './site.service';
import { UnauthorizedError } from '@/shared/errors';

const actor = (req: Request): string => {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
};
const ok = (req: Request, res: Response, data: unknown) =>
  res.json({ success: true, data, requestId: req.id });

export const siteController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await siteService.create(ValidateSite.createBody(req), actor(req));
      res.status(201).json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = ValidateSite.idParam(req);
      ok(req, res, await siteService.update(id, ValidateSite.updateBody(req), actor(req)));
    } catch (e) {
      next(e);
    }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = ValidateSite.idParam(req);
      await siteService.remove(id, actor(req));
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },
  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = ValidateSite.idParam(req);
      ok(req, res, await siteService.detail(id));
    } catch (e) {
      next(e);
    }
  },
  async all(req: Request, res: Response, next: NextFunction) {
    try {
      ok(req, res, await siteService.all());
    } catch (e) {
      next(e);
    }
  },
  async campList(req: Request, res: Response, next: NextFunction) {
    try {
      ok(req, res, await siteService.campList());
    } catch (e) {
      next(e);
    }
  },
  async staffList(req: Request, res: Response, next: NextFunction) {
    try {
      ok(req, res, await siteService.staffList());
    } catch (e) {
      next(e);
    }
  },
  async campDonations(req: Request, res: Response, next: NextFunction) {
    try {
      const { siteId } = ValidateSite.siteIdParam(req);
      ok(req, res, await siteService.campDonations(siteId));
    } catch (e) {
      next(e);
    }
  },
  async campDonors(req: Request, res: Response, next: NextFunction) {
    try {
      const { siteId } = ValidateSite.siteIdParam(req);
      ok(req, res, await siteService.campDonors(siteId));
    } catch (e) {
      next(e);
    }
  },
  async voluntary(req: Request, res: Response, next: NextFunction) {
    try {
      const { items, pagination } = await siteService.voluntary(ValidateSite.voluntaryQuery(req));
      res.json({ success: true, data: items, pagination, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
};
