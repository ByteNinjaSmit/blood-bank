import { Types } from 'mongoose';
import { TransfusionModel } from './transfusion.model';
import { NotFoundError } from '@/shared/errors';
import type { TransfusionOutcome } from '@/shared/enums';

export interface TransfusionDto {
  id: string;
  transfusionId: string;
  unitId: string;
  patientId: string;
  outcome?: TransfusionOutcome;
  hadReaction: boolean;
  startedAt?: string;
  endedAt?: string;
}

interface RawT {
  _id: { toString(): string };
  transfusionId: string;
  unitId: string;
  patientId: { toString(): string };
  outcome?: TransfusionOutcome;
  hadReaction: boolean;
  startedAt?: Date;
  endedAt?: Date;
}

function toDto(r: RawT): TransfusionDto {
  return {
    id: r._id.toString(),
    transfusionId: r.transfusionId,
    unitId: r.unitId,
    patientId: r.patientId.toString(),
    outcome: r.outcome,
    hadReaction: r.hadReaction,
    startedAt: r.startedAt?.toISOString(),
    endedAt: r.endedAt?.toISOString(),
  };
}

export interface RecordTransfusionInput {
  transfusionId: string;
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

export interface TransfusionRepo {
  create(input: RecordTransfusionInput, actorId: string): Promise<TransfusionDto>;
  findByTransfusionId(transfusionId: string): Promise<TransfusionDto>;
  markReaction(transfusionId: string, actorId: string): Promise<void>;
}

export function createTransfusionRepo(): TransfusionRepo {
  return {
    async create(input, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await TransfusionModel.create({
        transfusionId: input.transfusionId,
        issueId: new Types.ObjectId(input.issueId),
        unitId: input.unitId,
        patientId: new Types.ObjectId(input.patientId),
        bedsideCheck: {
          checkedById: new Types.ObjectId(input.bedsideCheck.checkedById),
          witnessedById: new Types.ObjectId(input.bedsideCheck.witnessedById),
          patientIdConfirmed: input.bedsideCheck.patientIdConfirmed,
          unitIdConfirmed: input.bedsideCheck.unitIdConfirmed,
          compatibilityConfirmed: input.bedsideCheck.compatibilityConfirmed,
        },
        startedAt: input.startedAt,
        endedAt: input.endedAt,
        vitalsLog: input.vitalsLog ?? [],
        outcome: input.outcome,
        hadReaction: input.hadReaction,
        createdBy: actor,
        updatedBy: actor,
      });
      return toDto(doc.toObject() as RawT);
    },

    async findByTransfusionId(transfusionId) {
      const raw = (await TransfusionModel.findOne({ transfusionId }).lean()) as RawT | null;
      if (!raw) throw new NotFoundError('Transfusion', transfusionId);
      return toDto(raw);
    },

    async markReaction(transfusionId, actorId) {
      const res = await TransfusionModel.updateOne(
        { transfusionId },
        { hadReaction: true, updatedBy: new Types.ObjectId(actorId) },
      );
      if (res.matchedCount === 0) throw new NotFoundError('Transfusion', transfusionId);
    },
  };
}
