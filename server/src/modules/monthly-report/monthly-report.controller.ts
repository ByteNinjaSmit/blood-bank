import type { NextFunction, Request, Response } from 'express';
import { ValidateMonthlyReport } from './monthly-report.validator';
import type { MonthlyReportService } from './monthly-report.service';

export interface MonthlyReportControllers {
  getReport(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export function createMonthlyReportControllers(service: MonthlyReportService): MonthlyReportControllers {
  return {
    async getReport(req, res, next) {
      try {
        const { month, year } = ValidateMonthlyReport.query(req);
        const data = await service.getReport(month, year);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
