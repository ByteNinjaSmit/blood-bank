// Legacy-path-compatible clinical discard routes. Mounted at
// /api/discard so the existing client calls to /api/discard/get-list
// and /api/discard/create keep working unchanged.
import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createDiscardRepo } from '@/modules/discard/discard.repository';
import { createDiscardService } from '@/modules/discard/discard.service';
import { createDiscardControllers } from '@/modules/discard/discard.controller';
import { createUnitRepo } from '@/modules/unit/unit.repository';
import { ttiService } from '@/modules/tti/tti.instance';
import type { Role } from '@/shared/enums';

const service = createDiscardService({ repo: createDiscardRepo({ units: createUnitRepo(), ttiService }) });
const controllers = createDiscardControllers(service);

const router = Router();

const READ_ROLES: Role[] = [
  'system-admin',
  'bbo',
  'lab-tech-component',
  'lab-tech-serology',
  'qa-manager',
  'store-keeper',
  'auditor',
];
const WRITE_ROLES: Role[] = ['system-admin', 'bbo', 'lab-tech-component', 'qa-manager'];

router.get('/get-list', authenticate, requirePermission('discard:read'), controllers.list);
router.post('/create', authenticate, requirePermission('discard:create'), controllers.create);

export default router;
