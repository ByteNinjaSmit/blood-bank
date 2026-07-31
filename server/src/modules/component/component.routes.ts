import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createUnitRepo } from '@/modules/unit/unit.repository';
import { createComponentRepo } from '@/modules/component/component.repository';
import { createComponentService } from '@/modules/component/component.service';
import { createComponentControllers } from '@/modules/component/component.controller';
import type { Role } from '@/shared/enums';

const repo = createComponentRepo({ units: createUnitRepo() });
const service = createComponentService({ repo });
const controllers = createComponentControllers(service);

const router = Router();

const READ_ROLES: Role[] = [
  'system-admin',
  'bbo',
  'lab-tech-component',
  'lab-tech-serology',
  'qa-manager',
  'store-keeper',
  'issue-counter',
  'auditor',
];
const SEPARATE_ROLES: Role[] = ['system-admin', 'bbo', 'lab-tech-component'];
const CAN_EDIT_COMPONENT: Role[] = ['system-admin', 'bbo', 'lab-tech-component', 'qa-manager'];

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

router.get(
  '/near-expiry',
  authenticate,
  requirePermission('unit:read'),
  controllers.nearExpiry,
);

router.get('/:id', authenticate, requirePermission('unit:read'), controllers.getGroupDetail);

// PATCH /:id — edit a prepared component's editable fields (volume,
// storage location, expiry). `id` may be either the BloodUnit's Mongo
// _id or its human-readable unitId (e.g. "DON-2026-0001-PRBC-1").
// unit:read is the permission common to every CAN_EDIT_COMPONENT role
// (qa-manager lacks component:separate); the write restriction is carried
// by requireRole(CAN_EDIT_COMPONENT).
router.patch('/:id', authenticate, requirePermission('unit:read'), controllers.patch);

// PATCH /bag/:id — bag-level correction: component type/volume for any
// already-separated unit plus the shared spin log/separation time, in
// one call. `id` is the donation id (bag). Blocked once any component
// from this bag has been issued; always requires an edit reason.
router.patch('/bag/:id', authenticate, requirePermission('unit:read'), controllers.patchBag);

export default router;
