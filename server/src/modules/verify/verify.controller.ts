import type { NextFunction, Request, Response } from 'express';
import { ValidateVerify } from '@/modules/verify/verify.validator';
import type { VerifyService } from '@/modules/verify/verify.service';

export interface VerifyControllers {
  verifyUnit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function createVerifyControllers(service: VerifyService): VerifyControllers {
  return {
    async verifyUnit(req, res, next) {
      try {
        const { unitId } = ValidateVerify.unitIdParam(req);
        const data = await service.verifyUnit(unitId);
        res.json({ success: true, data, requestId: req.id });
      } catch (err) {
        next(err);
      }
    },
  };
}
