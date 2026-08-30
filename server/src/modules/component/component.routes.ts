import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createUnitRepo } from '@/modules/unit/unit.repository';
import { createComponentRepo } from '@/modules/component/component.repository';
import { createComponentService } from '@/modules/component/component.service';
import { createComponentControllers } from '@/modules/component/component.controller';

const repo = createComponentRepo({ units: createUnitRepo() });
const service = createComponentService({ repo });
const controllers = createComponentControllers(service);

const router = Router();

router.get('/list', authenticate, requirePermission('unit:read'), controllers.list);

router.get(
  '/bags-to-separate',
  authenticate,
  requirePermission('unit:read'),
  controllers.bagsToSeparate,
);

router.post(
  '/separate',
  authenticate,
  requirePermission('component:separate'),
  controllers.separate,
);

router.post(
  '/separation-completed',
  authenticate,
  requirePermission('component:separate'),
  controllers.separationCompleted,
);

router.get('/near-expiry', authenticate, requirePermission('unit:read'), controllers.nearExpiry);

router.get('/:id', authenticate, requirePermission('unit:read'), controllers.getGroupDetail);

// PATCH /:id — edit a prepared component's editable fields (volume,
// storage location, expiry). `id` may be either the BloodUnit's Mongo
// _id or its human-readable unitId (e.g. "DON-2026-0001-PRBC-1").
// Modifying prepared-component data is a component-processing write —
// gated on `component:separate` (not `unit:read`, so a read-only viewer
// can't alter a released component's record). Every edit is audited with
// a mandatory reason (see component.service).
router.patch('/:id', authenticate, requirePermission('component:separate'), controllers.patch);

// PATCH /bag/:id — bag-level correction: component type/volume for any
// already-separated unit plus the shared spin log/separation time, in
// one call. `id` is the donation id (bag). Blocked once any component
// from this bag has been issued; always requires an edit reason.
router.patch('/bag/:id', authenticate, requirePermission('component:separate'), controllers.patchBag);

// Batch-draft flag: marks/clears Donation.separationBatchActive so the
// donation timeline/details screens can show "Under Separation" while a
// bag sits staged (not yet finalized) in the Component Separate batch UI.
// No BloodUnit is created by either of these — same permission as
// /separate since they're driven by the same screen/action.
router.post(
  '/batch-draft',
  authenticate,
  requirePermission('component:separate'),
  controllers.markBatchDraft,
);
router.post(
  '/batch-draft/clear',
  authenticate,
  requirePermission('component:separate'),
  controllers.clearBatchDraft,
);

export default router;
