import { Types } from 'mongoose';
import { CrossmatchModel } from '@/modules/crossmatch/crossmatch.model';

export interface CrossmatchDto {
  id: string;
  crossmatchId: string;
  requisitionId: string;
  unitId: string;
  patientId: string;
  method: 'IS' | 'AHG' | 'ELECTRONIC';
  result: 'COMPATIBLE' | 'INCOMPATIBLE';
  performedAt: string;
}

interface RawXm {
  _id: { toString(): string };
  crossmatchId: string;
  requisitionId: { toString(): string };
  unitId: string;
  patientId: { toString(): string };
  method: 'IS' | 'AHG' | 'ELECTRONIC';
  result: 'COMPATIBLE' | 'INCOMPATIBLE';
  performedAt: Date;
}

function toDto(raw: RawXm): CrossmatchDto {
  return {
    id: raw._id.toString(),
    crossmatchId: raw.crossmatchId,
    requisitionId: raw.requisitionId.toString(),
    unitId: raw.unitId,
    patientId: raw.patientId.toString(),
    method: raw.method,
    result: raw.result,
    performedAt: raw.performedAt.toISOString(),
  };
}

export interface RecordCrossmatchInput {
  crossmatchId: string;
  requisitionId: string;
  unitId: string;
  patientId: string;
  method: 'IS' | 'AHG' | 'ELECTRONIC';
  phases?: { immediateSpin?: string; coombsAhg?: string };
  result: 'COMPATIBLE' | 'INCOMPATIBLE';
  override?: { isOverride: boolean; reason?: string; authorizedBy?: string };
}

export interface CrossmatchRepo {
  record(input: RecordCrossmatchInput, actorId: string): Promise<CrossmatchDto>;
  findLatestForUnit(requisitionId: string, unitId: string): Promise<CrossmatchDto | null>;
}

export function createCrossmatchRepo(): CrossmatchRepo {
  return {
    async record(input, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await CrossmatchModel.create({
        crossmatchId: input.crossmatchId,
        requisitionId: new Types.ObjectId(input.requisitionId),
        unitId: input.unitId,
        patientId: new Types.ObjectId(input.patientId),
        method: input.method,
        phases: input.phases,
        result: input.result,
        override: input.override
          ? {
              isOverride: input.override.isOverride,
              reason: input.override.reason,
              authorizedBy: input.override.authorizedBy
                ? new Types.ObjectId(input.override.authorizedBy)
                : undefined,
            }
          : undefined,
        performedBy: actor,
        createdBy: actor,
        updatedBy: actor,
      });
      return toDto(doc.toObject() as RawXm);
    },

    async findLatestForUnit(requisitionId, unitId) {
      const raw = (await CrossmatchModel.findOne({
        requisitionId: new Types.ObjectId(requisitionId),
        unitId,
      })
        .sort({ performedAt: -1 })
        .lean()) as RawXm | null;
      return raw ? toDto(raw) : null;
    },
  };
}
