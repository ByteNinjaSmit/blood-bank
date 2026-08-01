import type { NextFunction, Request, Response } from 'express';
import { ValidateLookback } from './lookback.validator';
import type { LookbackService } from './lookback.service';
import { UnauthorizedError } from '@/shared/errors';

export function createLookbackControllers(service: LookbackService) {
  const actor = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };
  return {
    async run(req: Request, res: Response, next: NextFunction) {
      try {
        const body = ValidateLookback.runBody(req);
        const data = body.donationId
          ? await service.runForDonation(body.donationId, actor(req), body.notifyEmail)
          : await service.runForDonor(body.donorId!, actor(req), body.notifyEmail);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
