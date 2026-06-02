import { Types } from 'mongoose';
import { AdverseReactionModel } from './adverse-reaction.model';
import type { AdverseReactionCategory, AdverseReactionSeverity } from '@/shared/enums';

export interface AdverseReactionDto {
  id: string;
  reactionId: string;
  unitId: string;
  patientId: string;
  category: AdverseReactionCategory;
  severity: AdverseReactionSeverity;
  reportedToHvPI: boolean;
  createdAt: string;
}

interface RawAR {
  _id: { toString(): string };
  reactionId: string;
  unitId: string;
  patientId: { toString(): string };
  category: AdverseReactionCategory;
  severity: AdverseReactionSeverity;
  reportedToHvPI: boolean;
  createdAt: Date;
}

function toDto(r: RawAR): AdverseReactionDto {
  return {
    id: r._id.toString(),
    reactionId: r.reactionId,
    unitId: r.unitId,
    patientId: r.patientId.toString(),
    category: r.category,
    severity: r.severity,
    reportedToHvPI: r.reportedToHvPI,
    createdAt: r.createdAt.toISOString(),
  };
}

export interface CreateReactionInput {
  reactionId: string;
  transfusionId: string;
  unitId: string;
  patientId: string;
  category: AdverseReactionCategory;
  severity: AdverseReactionSeverity;
  onsetMinutesAfterStart?: number;
  signsSymptoms?: string[];
  investigationsDone?: string[];
  managementGiven?: string;
  outcome?: string;
}

export interface AdverseReactionRepo {
  create(input: CreateReactionInput, actorId: string): Promise<AdverseReactionDto>;
  list(page: number, pageSize: number): Promise<{ items: AdverseReactionDto[]; total: number }>;
}

export function createAdverseReactionRepo(): AdverseReactionRepo {
  return {
    async create(input, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await AdverseReactionModel.create({
        reactionId: input.reactionId,
        transfusionId: new Types.ObjectId(input.transfusionId),
        unitId: input.unitId,
        patientId: new Types.ObjectId(input.patientId),
        category: input.category,
        severity: input.severity,
        onsetMinutesAfterStart: input.onsetMinutesAfterStart,
        signsSymptoms: input.signsSymptoms ?? [],
        investigationsDone: input.investigationsDone ?? [],
        managementGiven: input.managementGiven,
        outcome: input.outcome,
        createdBy: actor,
        updatedBy: actor,
      });
      return toDto(doc.toObject() as RawAR);
    },

    async list(page, pageSize) {
      const skip = (page - 1) * pageSize;
      const [docs, total] = await Promise.all([
        AdverseReactionModel.find().sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
        AdverseReactionModel.countDocuments(),
      ]);
      return { items: (docs as RawAR[]).map(toDto), total };
    },
  };
}
