import { Types } from 'mongoose';
import { TtiResultModel } from '@/modules/tti/tti.model';
import type { AboGroup, RhFactor, TtiResult, TtiTest } from '@/shared/enums';
import { NotFoundError } from '@/shared/errors';

export type ReleaseDecision = 'pending' | 'released' | 'reactive' | 'indeterminate' | 'on-hold';

export interface TtiTestEntryInput {
  testName: TtiTest;
  method: 'ELISA' | 'NAT' | 'RAPID' | 'CLIA';
  result: TtiResult;
  performedAt: Date;
  machineId?: string;
  kitLot?: string;
}

export interface TtiResultDto {
  id: string;
  donationId: string;
  aboGroupConfirmed?: AboGroup;
  rhFactorConfirmed?: RhFactor;
  tests: Array<{ testName: string; method: string; result: string; performedAt: string }>;
  releaseDecision: ReleaseDecision;
  decidedAt?: string;
}

interface RawTti {
  _id: { toString(): string };
  donationId: string;
  aboGroupConfirmed?: AboGroup;
  rhFactorConfirmed?: RhFactor;
  tests: Array<{ testName: string; method: string; result: string; performedAt: Date }>;
  releaseDecision: ReleaseDecision;
  decidedAt?: Date;
}

function toDto(raw: RawTti): TtiResultDto {
  return {
    id: raw._id.toString(),
    donationId: raw.donationId,
    aboGroupConfirmed: raw.aboGroupConfirmed,
    rhFactorConfirmed: raw.rhFactorConfirmed,
    tests: raw.tests.map((t) => ({
      testName: t.testName,
      method: t.method,
      result: t.result,
      performedAt: t.performedAt.toISOString(),
    })),
    releaseDecision: raw.releaseDecision,
    decidedAt: raw.decidedAt?.toISOString(),
  };
}

export interface TtiRepo {
  findByDonation(donationId: string): Promise<TtiResultDto | null>;
  recordTests(
    donationId: string,
    tests: TtiTestEntryInput[],
    actorId: string,
  ): Promise<TtiResultDto>;
  setDecision(
    donationId: string,
    decision: ReleaseDecision,
    actorId: string,
    notes?: string,
  ): Promise<TtiResultDto>;
}

export function createTtiRepo(): TtiRepo {
  return {
    async findByDonation(donationId) {
      const raw = (await TtiResultModel.findOne({ donationId }).lean()) as RawTti | null;
      return raw ? toDto(raw) : null;
    },

    async recordTests(donationId, tests, actorId) {
      const actor = new Types.ObjectId(actorId);
      const updated = (await TtiResultModel.findOneAndUpdate(
        { donationId },
        {
          $push: { tests: { $each: tests.map((t) => ({ ...t, technicianId: actor })) } },
          updatedBy: actor,
        },
        { new: true },
      ).lean()) as RawTti | null;
      if (!updated) throw new NotFoundError('TtiResult', donationId);
      return toDto(updated);
    },

    async setDecision(donationId, decision, actorId, notes) {
      const actor = new Types.ObjectId(actorId);
      const updated = (await TtiResultModel.findOneAndUpdate(
        { donationId },
        {
          releaseDecision: decision,
          decidedBy: actor,
          decidedAt: new Date(),
          decisionNotes: notes,
          updatedBy: actor,
        },
        { new: true },
      ).lean()) as RawTti | null;
      if (!updated) throw new NotFoundError('TtiResult', donationId);
      return toDto(updated);
    },
  };
}
