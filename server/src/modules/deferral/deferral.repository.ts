import { Types } from 'mongoose';
import { DeferralModel } from '@/modules/deferral/deferral.model';
import type { DeferralType } from '@/shared/enums';

export interface ActiveDeferral {
  type: DeferralType;
  untilDate?: Date;
  reason: string;
}

export interface DeferralDto extends ActiveDeferral {
  id: string;
  donor: string;
  source: string;
  createdAt: string;
}

export interface CreateDeferralInput {
  donor: string;
  type: DeferralType;
  reason: string;
  untilDate?: Date;
  source: 'QUESTIONNAIRE' | 'VITALS' | 'TTI_REACTIVE' | 'LOOKBACK' | 'MANUAL';
  relatedDonationId?: string;
}

export interface DeferralRepo {
  create(input: CreateDeferralInput, actorId: string): Promise<DeferralDto>;
  /** Active = permanent, or temporary whose untilDate is still in the future, and not lifted. */
  findActiveByDonor(donorId: string, now?: Date): Promise<ActiveDeferral[]>;
  listByDonor(donorId: string): Promise<DeferralDto[]>;
  lift(id: string, actorId: string): Promise<void>;
}

interface RawDeferral {
  _id: { toString(): string };
  donor: { toString(): string };
  type: DeferralType;
  reason: string;
  untilDate?: Date | null;
  source: string;
  createdAt: Date;
}

function toDto(raw: RawDeferral): DeferralDto {
  return {
    id: raw._id.toString(),
    donor: raw.donor.toString(),
    type: raw.type,
    reason: raw.reason,
    untilDate: raw.untilDate ?? undefined,
    source: raw.source,
    createdAt: raw.createdAt.toISOString(),
  };
}

export function createDeferralRepo(): DeferralRepo {
  return {
    async create(input, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await DeferralModel.create({
        donor: new Types.ObjectId(input.donor),
        type: input.type,
        reason: input.reason,
        untilDate: input.untilDate ?? null,
        source: input.source,
        relatedDonationId: input.relatedDonationId ?? null,
        decidedBy: actor,
        createdBy: actor,
        updatedBy: actor,
      });
      return toDto(doc.toObject() as RawDeferral);
    },

    async findActiveByDonor(donorId, now = new Date()) {
      const raws = (await DeferralModel.find({
        donor: new Types.ObjectId(donorId),
        liftedAt: null,
        $or: [{ type: 'PERMANENT' }, { type: 'TEMPORARY', untilDate: { $gt: now } }],
      }).lean()) as RawDeferral[];
      return raws.map((r) => ({
        type: r.type,
        untilDate: r.untilDate ?? undefined,
        reason: r.reason,
      }));
    },

    async listByDonor(donorId) {
      const raws = (await DeferralModel.find({ donor: new Types.ObjectId(donorId) })
        .sort({ createdAt: -1 })
        .lean()) as RawDeferral[];
      return raws.map(toDto);
    },

    async lift(id, actorId) {
      await DeferralModel.updateOne(
        { _id: id },
        { liftedAt: new Date(), liftedBy: new Types.ObjectId(actorId), updatedBy: new Types.ObjectId(actorId) },
      );
    },
  };
}
