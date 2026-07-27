import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createMonthlyReportInputRepo } from '@/modules/monthly-report-input/monthly-report-input.repository';
import { createMonthlyReportInputControllers } from '@/modules/monthly-report-input/monthly-report-input.controller';

const repo = createMonthlyReportInputRepo();
const controllers = createMonthlyReportInputControllers(repo);

const ROLES = ['system-admin', 'bbo', 'qa-manager', 'auditor', 'medical-officer'] as const;

const router = Router();

router.get('/', authenticate, requirePermission('report:read'), controllers.get);
router.post('/', authenticate, requirePermission('report:generate'), controllers.upsert);

export default router;
