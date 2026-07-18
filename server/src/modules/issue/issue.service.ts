import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { ForbiddenError, NotFoundError } from '@/shared/errors';
import type { IAuditService } from '@/shared/interfaces';
import { auditService as defaultAudit } from '@/modules/audit/audit.service';
import { notificationCenterService } from '@/modules/notification/notification-center.service';
import { checkIssueGate } from './issue.gate';
import type { IssueRepo } from '@/modules/issue/issue.repository';
import type { RequisitionRepo } from '@/modules/requisition/requisition.repository';
import type { UnitRepo } from '@/modules/unit/unit.repository';
import type { PatientRepo } from '@/modules/patient/patient.repository';
import type { CrossmatchRepo } from '@/modules/crossmatch/crossmatch.repository';
import type { TtiRepo } from '@/modules/tti/tti.repository';

export interface IssueUnitInput {
  requisitionId: string;
  unitId: string;
  collectedByName?: string;
  transportTempCelsius?: number;
  override?: { reason: string };
}

export interface IssueService {
  issue(input: IssueUnitInput, actorId: string): Promise<{ issueId: string; unitId: string }>;
}

export function createIssueService(deps: {
  issues: IssueRepo;
  requisitions: RequisitionRepo;
  units: UnitRepo;
  patients: PatientRepo;
  crossmatches: CrossmatchRepo;
  tti: TtiRepo;
  audit?: IAuditService;
}): IssueService {
  const log = childLogger({ module: 'issue-service' });
  const audit = deps.audit ?? defaultAudit;

  return {
    async issue(input, actorId) {
      const req = await deps.requisitions.findById(input.requisitionId);
      const matched = req.matchedUnits.find((m) => m.unitId === input.unitId);
      if (!matched) throw new NotFoundError('Matched unit on requisition', input.unitId);

      const unit = await deps.units.findByUnitId(input.unitId);
      if (!unit) throw new NotFoundError('BloodUnit', input.unitId);

      const patient = await deps.patients.findById(req.patientId);
      const tti = await deps.tti.findByDonation(unit.donationId);
      const ttiDecision = tti?.releaseDecision ?? (
        ['RELEASED', 'RESERVED', 'CROSSMATCHED'].includes(unit.status) ? 'released' : 'pending'
      );
      const xm = await deps.crossmatches.findLatestForUnit(req.id, input.unitId);

      const gate = checkIssueGate({
        componentType: unit.componentType,
        unitStatus: unit.status,
        ttiReleaseDecision: ttiDecision,
        crossmatchResult: xm?.result,
        unitSpecialAttributes: unit.specialAttributes,
        patientSpecialNeeds: patient.specialNeeds,
        override: input.override
          ? { isOverride: true, reason: input.override.reason, authorizedBy: actorId }
          : undefined,
      });

      if (!gate.allowed) throw new ForbiddenError(`Issue blocked: ${gate.blockers.join('; ')}`);

      const issueId = `IS-${dateStamp()}-${rand()}`;

      await deps.units.applyEvent({
        unitId: input.unitId,
        event: 'ISSUE',
        actorId,
        reason: gate.usedOverride
          ? `Issued with MO override: ${input.override?.reason}`
          : `Issued for requisition ${req.requisitionId}`,
        set: { issuedAt: new Date() },
      });

      const issue = await deps.issues.create(
        {
          issueId,
          requisitionId: req.id,
          unitId: input.unitId,
          patientId: req.patientId,
          collectedByName: input.collectedByName,
          transportTempCelsius: input.transportTempCelsius,
        },
        actorId,
      );

      await audit.record({
        actorId,
        module: 'issue',
        action: gate.usedOverride ? 'OVERRIDE' : 'ISSUE',
        entityType: 'BloodUnit',
        entityId: input.unitId,
        before: { status: unit.status },
        after: {
          status: 'ISSUED',
          issueId,
          requisitionId: req.requisitionId,
          componentType: unit.componentType,
          issuedAt: new Date(),
        },
        reason: gate.usedOverride ? input.override?.reason : undefined,
      });

      log.info(
        {
          issueId,
          unitId: input.unitId,
          requisitionId: req.requisitionId,
          usedOverride: gate.usedOverride,
        },
        gate.usedOverride ? 'unit ISSUED with override' : 'unit issued',
      );
      void notificationCenterService
        .notify({
          title: gate.usedOverride ? 'Emergency issue (MO override)' : 'Blood issued successfully',
          message: `Unit ${input.unitId} issued for requisition ${req.requisitionId}${gate.usedOverride ? ' with medical-officer override' : ''}`,
          module: 'ISSUE_BLOOD',
          category: gate.usedOverride ? 'EMERGENCY_ISSUE' : 'BLOOD_ISSUED',
          severity: gate.usedOverride ? 'WARNING' : 'SUCCESS',
          relatedRecordId: issueId,
          relatedRecordType: 'Issue',
          actionLink: `/requisition-management/${req.id}`,
        })
        .catch(() => undefined);
      return { issueId: issue.issueId, unitId: input.unitId };
    },
  };
}

function dateStamp(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}
function rand(): string {
  return new Types.ObjectId().toHexString().slice(-6).toUpperCase();
}
