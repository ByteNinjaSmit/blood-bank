import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission, requireRole } from '@/shared/middlewares/rbac';
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

router.get('/list', authenticate, requireRole(READ_ROLES), requirePermission('unit:read'), controllers.list);

router.get(
  '/bags-to-separate',
  authenticate,
  requireRole(READ_ROLES),
  requirePermission('unit:read'),
  controllers.bagsToSeparate,
);

router.post(
  '/separate',
  authenticate,
  requireRole(SEPARATE_ROLES),
  requirePermission('component:separate'),
  controllers.separate,
);

router.post(
  '/separation-completed',
  authenticate,
  requireRole(SEPARATE_ROLES),
  requirePermission('component:separate'),
  controllers.separationCompleted,
);

router.get(
  '/near-expiry',
  authenticate,
  requireRole(READ_ROLES),
  requirePermission('unit:read'),
  controllers.nearExpiry,
);

router.get('/:id', authenticate, requireRole(READ_ROLES), requirePermission('unit:read'), controllers.getGroupDetail);

// PATCH /:id — edit a prepared component's editable fields (volume,
// storage location, expiry). `id` may be either the BloodUnit's Mongo
// _id or its human-readable unitId (e.g. "DON-2026-0001-PRBC-1").
// unit:read is the permission common to every CAN_EDIT_COMPONENT role
// (qa-manager lacks component:separate); the write restriction is carried
// by requireRole(CAN_EDIT_COMPONENT).
router.patch('/:id', authenticate, requireRole(CAN_EDIT_COMPONENT), requirePermission('unit:read'), controllers.patch);

// PATCH /bag/:id — bag-level correction: component type/volume for any
// already-separated unit plus the shared spin log/separation time, in
// one call. `id` is the donation id (bag). Blocked once any component
// from this bag has been issued; always requires an edit reason.
router.patch('/bag/:id', authenticate, requireRole(CAN_EDIT_COMPONENT), requirePermission('unit:read'), controllers.patchBag);

export default router;
