import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requireRole, requirePermission } from '@/shared/middlewares/rbac';
import { createMonthlyReportRepo } from './monthly-report.repository';
import { createMonthlyReportService } from './monthly-report.service';
import { createMonthlyReportControllers } from './monthly-report.controller';
import { createMonthlyReportInputRepo } from '@/modules/monthly-report-input/monthly-report-input.repository';

const service = createMonthlyReportService({
  repo: createMonthlyReportRepo(),
  inputs: createMonthlyReportInputRepo(),
});
const controllers = createMonthlyReportControllers(service);

const router = Router();

router.get(
  '/',
  authenticate,
  requireRole(['system-admin', 'bbo', 'qa-manager', 'auditor', 'medical-officer']),
  requirePermission('report:read'),
  controllers.getReport,
);

export default router;
