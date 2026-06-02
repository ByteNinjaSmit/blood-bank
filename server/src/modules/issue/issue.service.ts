// Issue service. The final clinical gate before a unit leaves the
// bank. Runs checkIssueGate against TTI release state + crossmatch
// result + patient special needs, then transitions the unit to ISSUED.

import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { ForbiddenError, NotFoundError } from '@/shared/errors';
import { auditService } from '@/modules/audit/audit.service';
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
}): IssueService {
  const log = childLogger({ module: 'issue-service' });

  return {
    async issue(input, actorId) {
      const req = await deps.requisitions.findById(input.requisitionId);
      const matched = req.matchedUnits.find((m) => m.unitId === input.unitId);
      if (!matched) throw new NotFoundError('Matched unit on requisition', input.unitId);

      const unit = await deps.units.findByUnitId(input.unitId);
      if (!unit) throw new NotFoundError('BloodUnit', input.unitId);

      const patient = await deps.patients.findById(req.patientId);

      // TTI gate keyed by the unit's donation.
      const tti = await deps.tti.findByDonation(unit.donationId);
      const ttiDecision = tti?.releaseDecision ?? 'pending';

      // Latest crossmatch for this requisition + unit.
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

      if (!gate.allowed) {
        throw new ForbiddenError(`Issue blocked: ${gate.blockers.join('; ')}`);
      }

      // CROSSMATCHED -> ISSUED via state machine.
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

      await auditService.record({
        actorId,
        action: gate.usedOverride ? 'OVERRIDE' : 'ISSUE',
        entityType: 'BloodUnit',
        entityId: input.unitId,
        after: { status: 'ISSUED', issueId, requisitionId: req.requisitionId },
        reason: gate.usedOverride ? input.override?.reason : undefined,
      });

      log.info(
        { issueId, unitId: input.unitId, requisitionId: req.requisitionId, usedOverride: gate.usedOverride },
        gate.usedOverride ? 'unit ISSUED with override' : 'unit issued',
      );
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
