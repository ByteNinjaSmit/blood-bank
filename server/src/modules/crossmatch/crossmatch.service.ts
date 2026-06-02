// Crossmatch service. Records a crossmatch result for a reserved unit
// against the requisition's patient. On COMPATIBLE, transitions the
// unit RESERVED -> CROSSMATCHED. On INCOMPATIBLE, transitions it back
// RESERVED -> RELEASED (so it returns to the stock pool) and clears it
// from the requisition's effective matches.

import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { ConflictError, NotFoundError } from '@/shared/errors';
import type { CrossmatchRepo } from '@/modules/crossmatch/crossmatch.repository';
import type { RequisitionRepo } from '@/modules/requisition/requisition.repository';
import type { UnitRepo } from '@/modules/unit/unit.repository';

export interface PerformCrossmatchInput {
  requisitionId: string;
  unitId: string;
  method: 'IS' | 'AHG' | 'ELECTRONIC';
  phases?: { immediateSpin?: string; coombsAhg?: string };
  result: 'COMPATIBLE' | 'INCOMPATIBLE';
}

export interface CrossmatchService {
  perform(input: PerformCrossmatchInput, actorId: string): Promise<{
    crossmatchId: string;
    unitId: string;
    result: 'COMPATIBLE' | 'INCOMPATIBLE';
    unitStatus: string;
  }>;
}

export function createCrossmatchService(deps: {
  crossmatches: CrossmatchRepo;
  requisitions: RequisitionRepo;
  units: UnitRepo;
}): CrossmatchService {
  const log = childLogger({ module: 'crossmatch-service' });

  return {
    async perform(input, actorId) {
      const req = await deps.requisitions.findById(input.requisitionId);
      const matched = req.matchedUnits.find((m) => m.unitId === input.unitId);
      if (!matched) {
        throw new NotFoundError('Matched unit on requisition', input.unitId);
      }
      if (!matched.crossmatchRequired) {
        throw new ConflictError(`Unit ${input.unitId} does not require a crossmatch`);
      }

      const crossmatchId = `XM-${dateStamp()}-${rand()}`;
      await deps.crossmatches.record(
        {
          crossmatchId,
          requisitionId: req.id,
          unitId: input.unitId,
          patientId: req.patientId,
          method: input.method,
          phases: input.phases,
          result: input.result,
        },
        actorId,
      );

      let unitStatus: string;
      if (input.result === 'COMPATIBLE') {
        const u = await deps.units.applyEvent({
          unitId: input.unitId,
          event: 'CROSSMATCH_PASS',
          actorId,
          reason: `Crossmatch ${crossmatchId} compatible`,
        });
        unitStatus = u.status;
        await deps.requisitions.setCrossmatchStatus(req.id, input.unitId, 'COMPATIBLE', actorId);
      } else {
        const u = await deps.units.applyEvent({
          unitId: input.unitId,
          event: 'CROSSMATCH_FAIL',
          actorId,
          reason: `Crossmatch ${crossmatchId} incompatible`,
        });
        unitStatus = u.status;
        await deps.requisitions.setCrossmatchStatus(req.id, input.unitId, 'INCOMPATIBLE', actorId);
      }

      log.info(
        { crossmatchId, unitId: input.unitId, result: input.result, unitStatus },
        'crossmatch recorded',
      );
      return { crossmatchId, unitId: input.unitId, result: input.result, unitStatus };
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
