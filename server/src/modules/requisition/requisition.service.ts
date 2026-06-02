import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { ConflictError } from '@/shared/errors';
import type { IAuditService } from '@/shared/interfaces';
import { auditService as defaultAudit } from '@/modules/audit/audit.service';
import { selectUnits } from '@/shared/compatibility/fefo';
import { classify, requiresCrossmatch, compatibleAboGroups } from '@/shared/compatibility/abo-rh';
import type {
  CreateRequisitionInput,
  MatchedUnitDto,
  RequisitionDto,
  RequisitionRepo,
} from '@/modules/requisition/requisition.repository';
import type { UnitRepo } from '@/modules/unit/unit.repository';
import type { PatientRepo } from '@/modules/patient/patient.repository';

export interface RequisitionService {
  create(
    input: Omit<CreateRequisitionInput, 'requisitionId'>,
    actorId: string,
  ): Promise<RequisitionDto>;
  match(
    id: string,
    actorId: string,
  ): Promise<{ requisition: RequisitionDto; shortages: Record<string, number> }>;
  /** BBO/MO approves the matched + crossmatched requisition before issue. */
  approve(id: string, actorId: string): Promise<RequisitionDto>;
  /** Mark COMPLETED after all units in this requisition are transfused/returned. */
  complete(id: string, actorId: string): Promise<RequisitionDto>;
  get(id: string): Promise<RequisitionDto>;
  reject(id: string, reason: string, actorId: string): Promise<RequisitionDto>;
}

export function createRequisitionService(deps: {
  requisitions: RequisitionRepo;
  units: UnitRepo;
  patients: PatientRepo;
  audit?: IAuditService;
}): RequisitionService {
  const log = childLogger({ module: 'requisition-service' });
  const audit = deps.audit ?? defaultAudit;

  return {
    async create(input, actorId) {
      await deps.patients.findById(input.patientId);
      const requisitionId = `RQ-${dateStamp()}-${rand()}`;
      const created = await deps.requisitions.create({ ...input, requisitionId }, actorId);
      await audit.record({
        actorId,
        action: 'CREATE',
        entityType: 'Requisition',
        entityId: created.requisitionId,
        after: { patientId: input.patientId, status: 'PENDING' },
      });
      log.info({ requisitionId, patientId: input.patientId, actorId }, 'requisition created');
      return created;
    },

    async match(id, actorId) {
      const req = await deps.requisitions.findById(id);
      if (req.status !== 'PENDING' && req.status !== 'MATCHED') {
        throw new ConflictError(`Cannot match requisition in status ${req.status}`);
      }
      const patient = await deps.patients.findById(req.patientId);

      const matched: MatchedUnitDto[] = [];
      const shortages: Record<string, number> = {};

      for (const rc of req.requestedComponents) {
        const aboGroups = [...compatibleAboGroups(rc.aboGroup, rc.componentType)];
        const candidates = await deps.units.selectable({
          componentType: rc.componentType,
          aboGroups,
        });
        const selection = selectUnits(candidates, {
          recipient: { aboGroup: rc.aboGroup, rhFactor: rc.rhFactor },
          component: rc.componentType,
          specialNeeds: patient.specialNeeds,
          unitsRequired: rc.units,
        });

        if (selection.shortage > 0) {
          shortages[`${rc.componentType}-${rc.aboGroup}${rc.rhFactor}`] = selection.shortage;
        }

        const needsXm = requiresCrossmatch(rc.componentType);
        for (const sel of selection.selected) {
          await deps.units.applyEvent({
            unitId: sel.unit.unitId,
            event: 'RESERVE',
            actorId,
            reason: `Reserved for requisition ${req.requisitionId}`,
            set: { reservedFor: req.id, reservedAt: new Date() },
          });
          matched.push({
            unitId: sel.unit.unitId,
            componentType: rc.componentType,
            compatibilityType: classify(
              { aboGroup: rc.aboGroup, rhFactor: rc.rhFactor },
              { aboGroup: sel.unit.aboGroup, rhFactor: sel.unit.rhFactor },
            ),
            crossmatchRequired: needsXm,
            crossmatchStatus: needsXm ? 'PENDING' : 'NOT_REQUIRED',
          });
        }
      }

      const updated = await deps.requisitions.setMatched(id, matched, actorId);
      log.info(
        { requisitionId: req.requisitionId, matched: matched.length, shortages },
        'requisition matched',
      );
      return { requisition: updated, shortages };
    },

    async approve(id, actorId) {
      const req = await deps.requisitions.findById(id);
      if (req.status !== 'MATCHED' && req.status !== 'CROSSMATCHED') {
        throw new ConflictError(
          `Cannot approve requisition in status ${req.status}. Must be MATCHED or CROSSMATCHED.`,
        );
      }
      const updated = await deps.requisitions.setStatus(id, 'APPROVED', actorId);
      await audit.record({
        actorId,
        action: 'RELEASE',
        entityType: 'Requisition',
        entityId: req.requisitionId,
        after: { status: 'APPROVED' },
      });
      log.info({ requisitionId: req.requisitionId, actorId }, 'requisition approved');
      return updated;
    },

    async complete(id, actorId) {
      const req = await deps.requisitions.findById(id);
      if (req.status !== 'ISSUED' && req.status !== 'APPROVED') {
        throw new ConflictError(`Cannot complete requisition in status ${req.status}.`);
      }
      const updated = await deps.requisitions.setStatus(id, 'COMPLETED', actorId);
      await audit.record({
        actorId,
        action: 'UPDATE',
        entityType: 'Requisition',
        entityId: req.requisitionId,
        after: { status: 'COMPLETED' },
      });
      log.info({ requisitionId: req.requisitionId, actorId }, 'requisition completed');
      return updated;
    },

    async get(id) {
      return deps.requisitions.findById(id);
    },

    async reject(id, reason, actorId) {
      const req = await deps.requisitions.findById(id);
      for (const m of req.matchedUnits) {
        await deps.units
          .applyEvent({
            unitId: m.unitId,
            event: 'UNRESERVE',
            actorId,
            reason: `Requisition ${req.requisitionId} rejected`,
          })
          .catch(() => undefined);
      }
      const updated = await deps.requisitions.reject(id, reason, actorId);
      await audit.record({
        actorId,
        action: 'DELETE',
        entityType: 'Requisition',
        entityId: req.requisitionId,
        after: { status: 'REJECTED', reason },
      });
      return updated;
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
