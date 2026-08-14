import type { NextFunction, Request, Response } from 'express';
import { ValidateYearlyReport } from './yearly-report.validator';
import type { YearlyReportService } from './yearly-report.service';

export interface YearlyReportControllers {
  getReport(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export function createYearlyReportControllers(
  service: YearlyReportService,
): YearlyReportControllers {
  return {
    async getReport(req, res, next) {
      try {
        const { year } = ValidateYearlyReport.query(req);
        const data = await service.getReport(year);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
