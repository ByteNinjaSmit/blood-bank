import type { NextFunction, Request, Response } from 'express';
import { ValidateTransfusion } from './transfusion.validator';
import type { TransfusionService } from './transfusion.service';
import { UnauthorizedError } from '@/shared/errors';

export function createTransfusionControllers(service: TransfusionService) {
  const actor = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };
  return {
    async record(req: Request, res: Response, next: NextFunction) {
      try {
        const body = ValidateTransfusion.recordBody(req);
        const data = await service.record(body, actor(req));
        res.status(201).json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
