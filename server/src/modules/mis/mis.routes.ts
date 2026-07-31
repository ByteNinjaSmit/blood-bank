import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createMisRepo } from '@/modules/mis/mis.repository';
import { createMisService } from '@/modules/mis/mis.service';
import { createMisControllers } from '@/modules/mis/mis.controller';

const repo = createMisRepo();
const service = createMisService(repo);
const controllers = createMisControllers(service);

const ROLES = ['system-admin', 'bbo', 'qa-manager', 'auditor', 'medical-officer'] as const;

const router = Router();

const gate = [authenticate, requirePermission('report:read')] as const;

router.get('/donors', ...gate, controllers.donors);
router.get('/donations', ...gate, controllers.donations);
router.get('/camps', ...gate, controllers.camps);
router.get('/bags', ...gate, controllers.bags);
router.get('/components', ...gate, controllers.components);
router.get('/inventory', ...gate, controllers.inventory);
router.get('/issues', ...gate, controllers.issues);
router.get('/discards', ...gate, controllers.discards);
router.get('/serology', ...gate, controllers.serology);
router.get('/audit', ...gate, controllers.audit);
router.get('/regulatory', ...gate, controllers.regulatory);
router.get('/executive', ...gate, controllers.executive);
router.get('/analytics', ...gate, controllers.analytics);

export default router;
