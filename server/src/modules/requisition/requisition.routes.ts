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

const requisitions = createRequisitionRepo();
const patients = createPatientRepo();
const units = createUnitRepo();
const crossmatches = createCrossmatchRepo();
const issues = createIssueRepo();
const tti = createTtiRepo();

const crossmatchService = createCrossmatchService({ crossmatches, requisitions, units });
const issueService = createIssueService({
  issues,
  requisitions,
  units,
  patients,
  crossmatches,
  tti,
});
const requisitionService = createRequisitionService({
  requisitions,
  units,
  patients,
  crossmatch: crossmatchService,
  issue: issueService,
});

const controllers = createRequisitionControllers({
  requisitions: requisitionService,
  crossmatch: crossmatchService,
  issue: issueService,
  patients,
});

const router = Router();

const CLINICAL_READ = [
  'system-admin',
  'bbo',
  'medical-officer',
  'lab-tech-serology',
  'store-keeper',
  'issue-counter',
  'auditor',
  'hospital-user',
] as const;

router.get(
  '/',
  authenticate,
  requireRole([...CLINICAL_READ]),
  requirePermission('requisition:read'),
  controllers.list,
);
router.post(
  '/patient',
  authenticate,
  requireRole([
    'system-admin',
    'bbo',
    'medical-officer',
    'lab-tech-serology',
    'issue-counter',
    'hospital-user',
  ]),
  requirePermission('requisition:create'),
  controllers.createPatient,
);
router.post(
  '/',
  authenticate,
  requireRole(['system-admin', 'bbo', 'medical-officer', 'hospital-user', 'issue-counter']),
  requirePermission('requisition:create'),
  controllers.create,
);

router.put(
  '/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'medical-officer', 'hospital-user', 'issue-counter']),
  requirePermission('requisition:create'),
  controllers.update,
);

router.get(
  '/:id',
  authenticate,
  requireRole([...CLINICAL_READ]),
  requirePermission('requisition:read'),
  controllers.get,
);

router.post(
  '/:id/match',
  authenticate,
  requireRole(['system-admin', 'bbo', 'lab-tech-serology', 'store-keeper']),
  requirePermission('unit:reserve'),
  controllers.match,
);
router.post(
  '/:id/approve',
  authenticate,
  requireRole(['system-admin', 'bbo', 'medical-officer']),
  requirePermission('requisition:approve'),
  controllers.approve,
);
router.patch(
  '/:id/approve',
  authenticate,
  requireRole(['system-admin', 'bbo', 'medical-officer']),
  requirePermission('requisition:approve'),
  controllers.approve,
);
router.post(
  '/:id/complete',
  authenticate,
  requireRole(['system-admin', 'bbo', 'issue-counter']),
  requirePermission('requisition:approve'),
  controllers.complete,
);
router.patch(
  '/:id/complete',
  authenticate,
  requireRole(['system-admin', 'bbo', 'issue-counter']),
  requirePermission('requisition:approve'),
  controllers.complete,
);
router.post(
  '/:id/reject',
  authenticate,
  requireRole(['system-admin', 'bbo', 'medical-officer']),
  requirePermission('requisition:reject'),
  controllers.reject,
);
router.patch(
  '/:id/reject',
  authenticate,
  requireRole(['system-admin', 'bbo', 'medical-officer']),
  requirePermission('requisition:reject'),
  controllers.reject,
);

// Static paths before /:id-dependent sub-paths to avoid Express shadowing.
router.post(
  '/crossmatch',
  authenticate,
  requireRole(['system-admin', 'lab-tech-serology']),
  requirePermission('crossmatch:perform'),
  controllers.crossmatch,
);
router.post(
  '/issue',
  authenticate,
  requireRole(['system-admin', 'bbo', 'medical-officer', 'issue-counter']),
  requirePermission('unit:issue'),
  controllers.issue,
);
router.post(
  '/:id/issue',
  authenticate,
  requireRole(['system-admin', 'bbo', 'medical-officer', 'issue-counter']),
  requirePermission('unit:issue'),
  controllers.issueAll,
);
router.patch(
  '/:id/issue',
  authenticate,
  requireRole(['system-admin', 'bbo', 'medical-officer', 'issue-counter']),
  requirePermission('unit:issue'),
  controllers.issueAll,
);

// Update crossmatch status for a matched unit
router.patch(
  '/:id/crossmatch',
  authenticate,
  requireRole(['system-admin', 'lab-tech-serology']),
  requirePermission('crossmatch:perform'),
  controllers.updateCrossmatchLegacy,
);

// Match Review: available bags an operator may pick for a component.
router.get(
  '/:id/available-units',
  authenticate,
  requireRole(['system-admin', 'bbo', 'lab-tech-serology', 'store-keeper']),
  requirePermission('unit:reserve'),
  controllers.availableUnits,
);

// Match Review: swap the proposed bag (no reservation until approval).
router.patch(
  '/:id/matched-unit',
  authenticate,
  requireRole(['system-admin', 'bbo', 'lab-tech-serology', 'store-keeper']),
  requirePermission('unit:reserve'),
  controllers.swapMatchedUnit,
);

// Recipient (patient-side) blood-grouping worksheet.
router.patch(
  '/:id/grouping',
  authenticate,
  requireRole(['system-admin', 'lab-tech-serology']),
  requirePermission('crossmatch:perform'),
  controllers.setRecipientGrouping,
);

// Per-bag (donor-side) blood-grouping worksheet.
router.patch(
  '/:id/matched-unit/grouping',
  authenticate,
  requireRole(['system-admin', 'lab-tech-serology']),
  requirePermission('crossmatch:perform'),
  controllers.setMatchedUnitGrouping,
);

export default router;
