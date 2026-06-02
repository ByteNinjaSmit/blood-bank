import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { ConflictError } from '@/shared/errors';
import type { IAuditService } from '@/shared/interfaces';
import { auditService as defaultAudit } from '@/modules/audit/audit.service';
import type { TransfusionDto, TransfusionRepo } from './transfusion.repository';
import type { UnitRepo } from '@/modules/unit/unit.repository';
import type { TransfusionOutcome } from '@/shared/enums';

export interface RecordTransfusionInput {
  issueId: string;
  unitId: string;
  patientId: string;
  bedsideCheck: {
    checkedById: string;
    witnessedById: string;
    patientIdConfirmed: boolean;
    unitIdConfirmed: boolean;
    compatibilityConfirmed: boolean;
  };
  startedAt: Date;
  endedAt?: Date;
  vitalsLog?: Array<Record<string, unknown>>;
  outcome: TransfusionOutcome;
  hadReaction: boolean;
}

export interface TransfusionService {
  record(input: RecordTransfusionInput, actorId: string): Promise<TransfusionDto>;
}

export function createTransfusionService(deps: {
  transfusions: TransfusionRepo;
  units: UnitRepo;
  audit?: IAuditService;
}): TransfusionService {
  const log = childLogger({ module: 'transfusion-service' });
  const audit = deps.audit ?? defaultAudit;

  return {
    async record(input, actorId) {
      const c = input.bedsideCheck;
      if (
        !c.patientIdConfirmed ||
        !c.unitIdConfirmed ||
        !c.compatibilityConfirmed ||
        c.checkedById === c.witnessedById
      ) {
        throw new ConflictError(
          'Bedside check incomplete: need two distinct staff confirming patient ID, unit ID, and compatibility',
        );
      }

      const transfusionId = `TF-${dateStamp()}-${rand()}`;
      const event = input.outcome === 'COMPLETED' ? 'CONFIRM_TRANSFUSION' : 'RETURN_UNUSED';

      await deps.units.applyEvent({
        unitId: input.unitId,
        event,
        actorId,
        reason: `Transfusion ${transfusionId} (${input.outcome})`,
        set: input.outcome === 'COMPLETED' ? { transfusedAt: new Date() } : undefined,
      });

      const created = await deps.transfusions.create({ ...input, transfusionId }, actorId);

      await audit.record({
        actorId,
        action: 'STATE_TRANSITION',
        entityType: 'BloodUnit',
        entityId: input.unitId,
        after: { status: event === 'CONFIRM_TRANSFUSION' ? 'TRANSFUSED' : 'RETURNED_UNUSED' },
        reason: `transfusion ${transfusionId}`,
      });

      log.info(
        {
          transfusionId,
          unitId: input.unitId,
          outcome: input.outcome,
          hadReaction: input.hadReaction,
        },
        'transfusion recorded',
      );
      return created;
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
