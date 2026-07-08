import type { NextFunction, Request, Response } from 'express';
import { ValidateMonthlyReportInput } from '@/modules/monthly-report-input/monthly-report-input.validator';
import type { MonthlyReportInputRepo } from '@/modules/monthly-report-input/monthly-report-input.repository';
import { UnauthorizedError } from '@/shared/errors';

export interface MonthlyReportInputControllers {
  upsert: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  get: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function createMonthlyReportInputControllers(repo: MonthlyReportInputRepo): MonthlyReportInputControllers {
  const actor = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async upsert(req, res, next) {
      try {
        const body = ValidateMonthlyReportInput.upsertBody(req);
        const data = await repo.upsert(body, actor(req));
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async get(req, res, next) {
      try {
        const { month, year } = ValidateMonthlyReportInput.periodQuery(req);
        const data = await repo.findByPeriod(month, year);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
