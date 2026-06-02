import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission, requireRole } from '@/shared/middlewares/rbac';
import { createRequisitionRepo } from '@/modules/requisition/requisition.repository';
import { createPatientRepo } from '@/modules/patient/patient.repository';
import { createUnitRepo } from '@/modules/unit/unit.repository';
import { createCrossmatchRepo } from '@/modules/crossmatch/crossmatch.repository';
import { createIssueRepo } from '@/modules/issue/issue.repository';
import { createTtiRepo } from '@/modules/tti/tti.repository';
import { createRequisitionService } from '@/modules/requisition/requisition.service';
import { createCrossmatchService } from '@/modules/crossmatch/crossmatch.service';
import { createIssueService } from '@/modules/issue/issue.service';
import { createRequisitionControllers } from '@/modules/requisition/requisition.controller';

// Shared repo instances.
const requisitions = createRequisitionRepo();
const patients = createPatientRepo();
const units = createUnitRepo();
const crossmatches = createCrossmatchRepo();
const issues = createIssueRepo();
const tti = createTtiRepo();

const requisitionService = createRequisitionService({ requisitions, units, patients });
const crossmatchService = createCrossmatchService({ crossmatches, requisitions, units });
const issueService = createIssueService({
  issues,
  requisitions,
  units,
  patients,
  crossmatches,
  tti,
});

const controllers = createRequisitionControllers({
  requisitions: requisitionService,
  crossmatch: crossmatchService,
  issue: issueService,
  patients,
});

const router = Router();

const CLINICAL_READ = [
  'system-admin', 'bbo', 'medical-officer', 'lab-tech-serology',
  'store-keeper', 'issue-counter', 'auditor', 'hospital-user',
] as const;

// --- Patient registration (needed before a requisition) ---
router.post(
  '/patient',
  authenticate,
  requireRole(['system-admin', 'bbo', 'medical-officer', 'lab-tech-serology', 'issue-counter', 'hospital-user']),
  requirePermission('requisition:create'),
  controllers.createPatient,
);

// --- Requisition lifecycle ---
router.post(
  '/',
  authenticate,
  requireRole(['system-admin', 'bbo', 'medical-officer', 'hospital-user', 'issue-counter']),
  requirePermission('requisition:create'),
  controllers.create,
);

router.get(
  '/:id',
  authenticate,
  requireRole([...CLINICAL_READ]),
  requirePermission('requisition:read'),
  controllers.get,
);

// Match = reserve compatible units (FEFO). Bank staff only.
router.post(
  '/:id/match',
  authenticate,
  requireRole(['system-admin', 'bbo', 'lab-tech-serology', 'store-keeper']),
  requirePermission('unit:reserve'),
  controllers.match,
);

router.post(
  '/:id/reject',
  authenticate,
  requireRole(['system-admin', 'bbo', 'medical-officer']),
  requirePermission('requisition:reject'),
  controllers.reject,
);

// --- Crossmatch (serology) ---
router.post(
  '/crossmatch',
  authenticate,
  requireRole(['system-admin', 'lab-tech-serology']),
  requirePermission('crossmatch:perform'),
  controllers.crossmatch,
);

// --- Issue (final gate). Override path is gated to MO/BBO via the
//     crossmatch:override permission; the gate logic enforces the rest. ---
router.post(
  '/issue',
  authenticate,
  requireRole(['system-admin', 'bbo', 'medical-officer', 'issue-counter']),
  requirePermission('unit:issue'),
  controllers.issue,
);

export default router;
