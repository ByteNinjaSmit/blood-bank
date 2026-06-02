// Requisition service. Create a request, then match: run the FEFO
// selector per requested component, reserve the chosen units (RELEASED
// -> RESERVED via state machine), and record them on the requisition
// with their compatibility + crossmatch-required flags.

import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { ConflictError } from '@/shared/errors';
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
  create(input: Omit<CreateRequisitionInput, 'requisitionId'>, actorId: string): Promise<RequisitionDto>;
  match(id: string, actorId: string): Promise<{ requisition: RequisitionDto; shortages: Record<string, number> }>;
  get(id: string): Promise<RequisitionDto>;
  reject(id: string, reason: string, actorId: string): Promise<RequisitionDto>;
}

export function createRequisitionService(deps: {
  requisitions: RequisitionRepo;
  units: UnitRepo;
  patients: PatientRepo;
}): RequisitionService {
  const log = childLogger({ module: 'requisition-service' });

  return {
    async create(input, actorId) {
      // Patient must exist (also surfaces special needs for matching).
      await deps.patients.findById(input.patientId);
      const requisitionId = `RQ-${dateStamp()}-${rand()}`;
      const created = await deps.requisitions.create({ ...input, requisitionId }, actorId);
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
          // Reserve: RELEASED -> RESERVED. State machine enforces legality.
          await deps.units.applyEvent({
            unitId: sel.unit.unitId,
            event: 'RESERVE',
            actorId,
            reason: `Reserved for requisition ${req.requisitionId}`,
            set: {
              reservedFor: req.id,
              reservedAt: new Date(),
            },
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

    async get(id) {
      return deps.requisitions.findById(id);
    },

    async reject(id, reason, actorId) {
      const req = await deps.requisitions.findById(id);
      // Release any reserved units back to stock.
      for (const m of req.matchedUnits) {
        await deps.units
          .applyEvent({
            unitId: m.unitId,
            event: 'UNRESERVE',
            actorId,
            reason: `Requisition ${req.requisitionId} rejected`,
          })
          .catch(() => undefined); // unit may already have moved
      }
      return deps.requisitions.reject(id, reason, actorId);
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
