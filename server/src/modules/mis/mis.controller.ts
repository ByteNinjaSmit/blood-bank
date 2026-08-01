import type { NextFunction, Request, Response } from 'express';
import { ValidateMis } from '@/modules/mis/mis.validator';
import type { MisService } from '@/modules/mis/mis.service';

export function createMisControllers(service: MisService) {
  const withDateRange =
    (fn: (from?: Date, to?: Date) => Promise<any>) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { fromDate, toDate } = ValidateMis.dateRangeQuery(req);
        const data = await fn(fromDate, toDate);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    };

  const withNoParams =
    (fn: () => Promise<any>) => async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await fn();
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    };

  return {
    donors: withDateRange(service.getDonorStats),
    donations: withDateRange(service.getDonationStats),
    camps: withDateRange(service.getCampStats),
    bags: withDateRange(service.getBagStats),
    components: withDateRange(service.getComponentStats),
    inventory: withNoParams(service.getInventoryStats),
    issues: withNoParams(service.getIssueStats),
    discards: withNoParams(service.getDiscardStats),
    serology: withNoParams(service.getSerologyStats),
    audit: withNoParams(service.getAuditStats),
    regulatory: withNoParams(service.getRegulatoryStats),
    analytics: withNoParams(service.getAnalyticsStats),
    async executive(req: Request, res: Response, next: NextFunction) {
      try {
        const { period } = ValidateMis.executiveQuery(req);
        const data = await service.getExecutiveStats(period);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}

export type MisControllers = ReturnType<typeof createMisControllers>;
