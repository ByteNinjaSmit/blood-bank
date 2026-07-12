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
  editReason?: string;
  lastEditedAt?: string;
}

interface RawTti {
  _id: { toString(): string };
  donationId: string;
  aboGroupConfirmed?: AboGroup;
  rhFactorConfirmed?: RhFactor;
  tests: Array<{ testName: string; method: string; result: string; performedAt: Date }>;
  releaseDecision: ReleaseDecision;
  decidedAt?: Date;
  editReason?: string;
  lastEditedAt?: Date;
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
    editReason: raw.editReason,
    lastEditedAt: raw.lastEditedAt?.toISOString(),
  };
}

export interface TtiRepo {
  findByDonation(donationId: string): Promise<TtiResultDto | null>;
  /**
   * Resolves a TtiResult by its own _id first, falling back to a
   * donationId lookup only when `id` is itself a valid ObjectId
   * string — mirrors the legacy serology-results lookup exactly so
   * behavior is unchanged for existing callers.
   */
  resolveByIdOrDonation(id: string): Promise<TtiResultDto | null>;
  /**
   * Upserts each incoming test result by testName (replacing any prior
   * entry for that test rather than appending a duplicate) — this is
   * what makes re-submitting an edited panel actually correct instead
   * of piling up stale + new entries for the same test.
   */
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
  /** Records who corrected an already-finalized result, and why. */
  setEditMeta(donationId: string, reason: string, actorId: string): Promise<TtiResultDto>;
}

export function createTtiRepo(): TtiRepo {
  return {
    async findByDonation(donationId) {
      const raw = (await TtiResultModel.findOne({ donationId }).lean()) as RawTti | null;
      return raw ? toDto(raw) : null;
    },

    async resolveByIdOrDonation(id) {
      let raw = (await TtiResultModel.findById(id).lean()) as RawTti | null;
      if (!raw && Types.ObjectId.isValid(id)) {
        raw = (await TtiResultModel.findOne({ donationId: id }).lean()) as RawTti | null;
      }
      return raw ? toDto(raw) : null;
    },

    async recordTests(donationId, tests, actorId) {
      const actor = new Types.ObjectId(actorId);
      const existing = await TtiResultModel.findOne({ donationId }).lean();
      if (!existing) throw new NotFoundError('TtiResult', donationId);

      const incomingNames = new Set(tests.map((t) => t.testName));
      const preserved = ((existing as any).tests || []).filter(
        (t: any) => !incomingNames.has(t.testName),
      );
      const merged = [...preserved, ...tests.map((t) => ({ ...t, technicianId: actor }))];

      const updated = (await TtiResultModel.findOneAndUpdate(
        { donationId },
        { tests: merged, updatedBy: actor },
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

    async setEditMeta(donationId, reason, actorId) {
      const actor = new Types.ObjectId(actorId);
      const updated = (await TtiResultModel.findOneAndUpdate(
        { donationId },
        { editReason: reason, lastEditedAt: new Date(), lastEditedBy: actor },
        { new: true },
      ).lean()) as RawTti | null;
      if (!updated) throw new NotFoundError('TtiResult', donationId);
      return toDto(updated);
    },
  };
}
