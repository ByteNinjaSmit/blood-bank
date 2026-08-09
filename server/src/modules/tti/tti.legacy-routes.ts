// Legacy-path-compatible TTI/serology routes. Mounted at /api/serology
// (outside the /api/v2 registry) so the existing client calls to
// /api/serology/bags, /results, /results/:id keep working unchanged
// while the implementation lives in the proper tti module.
import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { ttiRepo, ttiService } from '@/modules/tti/tti.instance';
import { createTtiLegacyViewRepo } from '@/modules/tti/tti.legacy-view.repository';
import { createTtiLegacyViewService } from '@/modules/tti/tti.legacy-view.service';
import { createTtiLegacyViewControllers } from '@/modules/tti/tti.legacy-view.controller';
import { createUnitRepo } from '@/modules/unit/unit.repository';

const service = createTtiLegacyViewService({ view: createTtiLegacyViewRepo() });
const controllers = createTtiLegacyViewControllers({
  view: service,
  tti: ttiRepo,
  ttiService,
  units: createUnitRepo(),
});

const router = Router();

const READ_ROLES = [
  'system-admin',
  'bbo',
  'medical-officer',
  'lab-tech-serology',
  'auditor',
  'qa-manager',
] as const;

router.get('/bags', authenticate, requirePermission('tti:read'), controllers.listQuarantined);

router.get('/results', authenticate, requirePermission('tti:read'), controllers.listDecided);

// Must be registered before '/results/:id' so these literal paths aren't
// swallowed by the ':id' param route.
router.post(
  '/results/batch',
  authenticate,
  requirePermission(['tti:edit', 'tti:release']),
  controllers.recordAndFinalizeBatch,
);

router.get('/results/:id/history', authenticate, requirePermission('tti:read'), controllers.getHistory);

router.post(
  '/results/:id',
  authenticate,
  requirePermission(['tti:edit', 'tti:release']),
  controllers.recordAndFinalize,
);

export default router;
