import type { NextFunction, Request, Response } from 'express';
import { ValidateBagIssue } from '@/modules/bag-issue/bag-issue.validator';
import type { BagIssueService } from '@/modules/bag-issue/bag-issue.service';
import { UnauthorizedError } from '@/shared/errors';

export interface BagIssueControllers {
  list(req: Request, res: Response, next: NextFunction): Promise<void>;
  get(req: Request, res: Response, next: NextFunction): Promise<void>;
  issue(req: Request, res: Response, next: NextFunction): Promise<void>;
  markUsed(req: Request, res: Response, next: NextFunction): Promise<void>;
  markReturned(req: Request, res: Response, next: NextFunction): Promise<void>;
  markDamaged(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export function createBagIssueControllers(service: BagIssueService): BagIssueControllers {
  const actorId = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async list(req, res, next) {
      try {
        const q = ValidateBagIssue.listQuery(req);
        const result = await service.list(q);
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async get(req, res, next) {
      try {
        const { id } = ValidateBagIssue.idParam(req);
        const data = await service.get(id);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async issue(req, res, next) {
      try {
        const body = ValidateBagIssue.createBody(req);
        const data = await service.issue(body, actorId(req));
        res.status(201).json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async markUsed(req, res, next) {
      try {
        const { id } = ValidateBagIssue.idParam(req);
        const body = ValidateBagIssue.markUsedBody(req);
        const data = await service.markUsed(id, body, actorId(req));
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async markReturned(req, res, next) {
      try {
        const { id } = ValidateBagIssue.idParam(req);
        const data = await service.markReturned(id, actorId(req));
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async markDamaged(req, res, next) {
      try {
        const { id } = ValidateBagIssue.idParam(req);
        const data = await service.markDamaged(id, actorId(req));
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
