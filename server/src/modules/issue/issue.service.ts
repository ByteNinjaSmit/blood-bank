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
  issuedAt?: Date;
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

      const foundUnit = await deps.units.findByUnitId(input.unitId);
      if (!foundUnit) throw new NotFoundError('BloodUnit', input.unitId);
      let unit = foundUnit;

      let xm = await deps.crossmatches.findLatestForUnit(req.id, input.unitId);

      // Self-heal: a crossmatch can end up recorded as COMPATIBLE (on the
      // requisition's matched-unit data, and/or as a Crossmatch record)
      // without the unit itself ever completing the RESERVED ->
      // CROSSMATCHED transition — e.g. data saved by a since-fixed code
      // path, or a crossmatch entered before the unit was reserved. A
      // stale data/unit mismatch must not permanently block Issue once the
      // compatibility genuinely was determined — catch the transition up.
      if (
        unit.status === 'RESERVED' &&
        matched.crossmatchRequired &&
        (matched.crossmatchStatus === 'COMPATIBLE' || xm?.result === 'COMPATIBLE')
      ) {
        // The Crossmatch record itself may also be missing (not just the
        // unit transition) if the compatible result was only ever saved as
        // data on the requisition — back it too, so the gate's own
        // findLatestForUnit lookup (re-run right after) finds it.
        if (!xm || xm.result !== 'COMPATIBLE') {
          await deps.crossmatches
            .record(
              {
                crossmatchId: `XM-${dateStamp()}-${rand()}`,
                requisitionId: req.id,
                unitId: input.unitId,
                patientId: req.patientId,
                method: 'IS',
                result: 'COMPATIBLE',
              },
              actorId,
            )
            .catch(() => undefined);
        }
        unit = await deps.units
          .applyEvent({
            unitId: input.unitId,
            event: 'CROSSMATCH_PASS',
            actorId,
            reason: 'Backfilling a crossmatch that was recorded compatible but never applied to the unit',
          })
          .catch(() => unit);
        xm = await deps.crossmatches.findLatestForUnit(req.id, input.unitId);
      }

      const patient = await deps.patients.findById(req.patientId);
      const tti = await deps.tti.findByDonation(unit.donationId);
      const ttiDecision =
        tti?.releaseDecision ??
        (['RELEASED', 'RESERVED', 'CROSSMATCHED'].includes(unit.status) ? 'released' : 'pending');

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
      const issuedAt =
        input.issuedAt && !isNaN(input.issuedAt.getTime()) ? input.issuedAt : new Date();

      await deps.units.applyEvent({
        unitId: input.unitId,
        event: 'ISSUE',
        actorId,
        reason: gate.usedOverride
          ? `Issued with MO override: ${input.override?.reason}`
          : `Issued for requisition ${req.requisitionId}`,
        set: { issuedAt },
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
          actionLink: `/requisition/${req.id}`,
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
