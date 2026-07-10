import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requireRole, requirePermission } from '@/shared/middlewares/rbac';
import { createAppointmentRepo } from '@/modules/appointment/appointment.repository';
import { createAppointmentService } from '@/modules/appointment/appointment.service';
import { createAppointmentControllers } from '@/modules/appointment/appointment.controller';

const repo = createAppointmentRepo();
const service = createAppointmentService(repo);
const controllers = createAppointmentControllers(service);

const ROLES = ['system-admin', 'bbo', 'counsellor', 'camp-organiser', 'medical-officer'] as const;

const router = Router();

router.get('/', authenticate, requireRole([...ROLES]), requirePermission('appointment:read'), controllers.list);
router.get('/summary', authenticate, requireRole([...ROLES]), requirePermission('appointment:read'), controllers.summary);
router.patch(
  '/:id/status',
  authenticate,
  requireRole(['system-admin', 'bbo', 'counsellor']),
  requirePermission('appointment:update'),
  controllers.updateStatus,
);

export default router;
