import type { NextFunction, Request, Response } from 'express';
import { ValidateAdverseReaction } from './adverse-reaction.validator';
import type { AdverseReactionService } from './adverse-reaction.service';
import { UnauthorizedError } from '@/shared/errors';

export function createAdverseReactionControllers(service: AdverseReactionService) {
  const actor = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };
  return {
    async report(req: Request, res: Response, next: NextFunction) {
      try {
        const body = ValidateAdverseReaction.reportBody(req);
        const data = await service.report(body, actor(req));
        res.status(201).json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
    async list(req: Request, res: Response, next: NextFunction) {
      try {
        const { page, pageSize } = ValidateAdverseReaction.listQuery(req);
        const data = await service.list(page, pageSize);
        res.json({ success: true, data: { ...data, page, pageSize }, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
