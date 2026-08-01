import type { NextFunction, Request, Response } from 'express';
import type { DashboardService } from '@/modules/dashboard/dashboard.service';

export interface DashboardControllers {
  getDashboard(req: Request, res: Response, next: NextFunction): Promise<void>;
  getAlerts(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export function createDashboardControllers(service: DashboardService): DashboardControllers {
  return {
    async getDashboard(req, res, next) {
      try {
        const fromStr = req.query.from as string | undefined;
        const toStr = req.query.to as string | undefined;
        const fromDate = fromStr ? new Date(fromStr) : undefined;
        const toDate = toStr ? new Date(toStr) : undefined;

        const data = await service.getFullDashboard(fromDate, toDate);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async getAlerts(req, res, next) {
      try {
        const data = await service.getAlerts();
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
