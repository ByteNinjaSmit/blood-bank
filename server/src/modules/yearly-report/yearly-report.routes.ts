import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createMonthlyReportRepo } from '@/modules/monthly-report/monthly-report.repository';
import { createMonthlyReportInputRepo } from '@/modules/monthly-report-input/monthly-report-input.repository';
import { createYearlyReportService } from './yearly-report.service';
import { createYearlyReportControllers } from './yearly-report.controller';

const service = createYearlyReportService({
  repo: createMonthlyReportRepo(),
  inputs: createMonthlyReportInputRepo(),
});
const controllers = createYearlyReportControllers(service);

const router = Router();

router.get('/', authenticate, requirePermission('report:read'), controllers.getReport);

export default router;
