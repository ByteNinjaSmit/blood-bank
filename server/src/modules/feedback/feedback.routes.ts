import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createFeedbackRepo } from '@/modules/feedback/feedback.repository';
import { createFeedbackService } from '@/modules/feedback/feedback.service';
import { createFeedbackControllers } from '@/modules/feedback/feedback.controller';

const repo = createFeedbackRepo();
const service = createFeedbackService(repo);
const controllers = createFeedbackControllers(service);

const router = Router();

// Grouped under the client's Appointments nav section, which grid-grants
// appointment:read as one coarse module-level permission (see
// client/src/config/access-registry/appointment.js) — reuse it here rather
// than adding a permission string the grid has no way to grant.
router.get('/', authenticate, requirePermission('appointment:read'), controllers.list);

export default router;
