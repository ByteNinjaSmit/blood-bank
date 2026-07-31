import { Types } from 'mongoose';
import { DeferralModel } from '@/modules/deferral/deferral.model';
import { DonorModel } from '@/modules/donor/donor.model';
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

export interface DeferralRegisterEntry {
  id: string;
  type: DeferralType;
  reason: string;
  source: string;
  untilDate?: string;
  liftedAt?: string;
  createdAt: string;
  donor: {
    id: string;
    donorId?: string;
    name?: string;
    bloodGroup?: string;
    rh?: string;
    phone?: string;
  };
}

export interface ListDeferralsFilter {
  search?: string;
  type?: DeferralType;
  status: 'active' | 'lifted' | 'all';
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'untilDate';
  sortOrder: 'asc' | 'desc';
}

export interface CreateDeferralInput {
  donor: string;
  type: DeferralType;
  reason: string;
  untilDate?: Date;
  source: 'QUESTIONNAIRE' | 'VITALS' | 'TTI_REACTIVE' | 'TTI_INDETERMINATE' | 'LOOKBACK' | 'MANUAL';
  relatedDonationId?: string;
}

export interface DeferralRepo {
  create(input: CreateDeferralInput, actorId: string): Promise<DeferralDto>;
  /** Active = permanent, or temporary whose untilDate is still in the future, and not lifted. */
  findActiveByDonor(donorId: string, now?: Date): Promise<ActiveDeferral[]>;
  /** The single most recently created active deferral for a donor, if any. */
  findLatestActiveByDonor(donorId: string, now?: Date): Promise<ActiveDeferral | null>;
  listByDonor(donorId: string): Promise<DeferralDto[]>;
  list(filter: ListDeferralsFilter): Promise<{ items: DeferralRegisterEntry[]; total: number }>;
  lift(id: string, actorId: string, reason?: string): Promise<void>;
  /** The still-active deferral raised by a reactive (or shadeness/indeterminate) TTI result for this donation, if any. */
  findByRelatedDonation(
    donationId: string,
    source?: 'TTI_REACTIVE' | 'TTI_INDETERMINATE',
  ): Promise<DeferralDto | null>;
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

// Keeps the donor's own eligibilityStatus in sync with their active
// deferrals: any active PERMANENT → 'deferred', any active TEMPORARY →
// 'temp-deferred', otherwise 'eligible'. Called on create/lift so a
// TTI-reactive permanent deferral immediately marks the donor deferred in
// the register and blocks future donations.
async function syncDonorEligibility(donorId: string, now = new Date()): Promise<void> {
  const active = (await DeferralModel.find({
    donor: new Types.ObjectId(donorId),
    liftedAt: null,
    $or: [{ type: 'PERMANENT' }, { type: 'TEMPORARY', untilDate: { $gt: now } }],
  }).lean()) as RawDeferral[];

  let status: 'eligible' | 'deferred' | 'temp-deferred' = 'eligible';
  if (active.some((d) => d.type === 'PERMANENT')) status = 'deferred';
  else if (active.length > 0) status = 'temp-deferred';

  await DonorModel.updateOne({ _id: new Types.ObjectId(donorId) }, { eligibilityStatus: status });
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
      await syncDonorEligibility(input.donor);
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

    async findLatestActiveByDonor(donorId, now = new Date()) {
      const raw = (await DeferralModel.findOne({
        donor: new Types.ObjectId(donorId),
        liftedAt: null,
        $or: [{ type: 'PERMANENT' }, { type: 'TEMPORARY', untilDate: { $gt: now } }],
      })
        .sort({ createdAt: -1 })
        .lean()) as RawDeferral | null;
      if (!raw) return null;
      return { type: raw.type, untilDate: raw.untilDate ?? undefined, reason: raw.reason };
    },

    async listByDonor(donorId) {
      const raws = (await DeferralModel.find({ donor: new Types.ObjectId(donorId) })
        .sort({ createdAt: -1 })
        .lean()) as RawDeferral[];
      return raws.map(toDto);
    },

    async list(f) {
      const filter: Record<string, unknown> = {};
      const now = new Date();

      if (f.type) filter.type = f.type;
      if (f.status === 'active') {
        filter.liftedAt = null;
        filter.$or = [{ type: 'PERMANENT' }, { type: 'TEMPORARY', untilDate: { $gt: now } }];
      } else if (f.status === 'lifted') {
        filter.liftedAt = { $ne: null };
      }

      if (f.search) {
        const donorIds = await DonorModel.find({
          $or: [
            { donorId: { $regex: f.search, $options: 'i' } },
            { phone: { $regex: f.search, $options: 'i' } },
            { 'name.firstName': { $regex: f.search, $options: 'i' } },
            { 'name.lastName': { $regex: f.search, $options: 'i' } },
          ],
        }).distinct('_id');
        filter.donor = { $in: donorIds };
      }

      const sort: Record<string, 1 | -1> = { [f.sortBy]: f.sortOrder === 'asc' ? 1 : -1 };
      const skip = (f.page - 1) * f.limit;

      const [docs, total] = await Promise.all([
        DeferralModel.find(filter)
          .populate('donor', 'donorId name bloodGroup rh phone')
          .sort(sort)
          .skip(skip)
          .limit(f.limit)
          .lean(),
        DeferralModel.countDocuments(filter),
      ]);

      const items: DeferralRegisterEntry[] = (docs as any[]).map((d) => {
        const donor = d.donor || {};
        const fullName = donor.name
          ? [donor.name.firstName, donor.name.middleName, donor.name.lastName].filter(Boolean).join(' ')
          : undefined;
        return {
          id: d._id.toString(),
          type: d.type,
          reason: d.reason,
          source: d.source,
          untilDate: d.untilDate ? new Date(d.untilDate).toISOString() : undefined,
          liftedAt: d.liftedAt ? new Date(d.liftedAt).toISOString() : undefined,
          createdAt: new Date(d.createdAt).toISOString(),
          donor: {
            id: donor._id ? donor._id.toString() : d.donor?.toString?.() ?? '',
            donorId: donor.donorId,
            name: fullName,
            bloodGroup: donor.bloodGroup,
            rh: donor.rh,
            phone: donor.phone,
          },
        };
      });

      return { items, total };
    },

    async findByRelatedDonation(donationId, source = 'TTI_REACTIVE') {
      const raw = (await DeferralModel.findOne({
        relatedDonationId: donationId,
        source,
        liftedAt: null,
      }).lean()) as RawDeferral | null;
      return raw ? toDto(raw) : null;
    },

    async lift(id, actorId, reason) {
      await DeferralModel.updateOne(
        { _id: id },
        {
          liftedAt: new Date(),
          liftedBy: new Types.ObjectId(actorId),
          liftReason: reason ?? null,
          updatedBy: new Types.ObjectId(actorId),
        },
      );
      // Recompute the donor's eligibility now that this deferral is inactive.
      const lifted = (await DeferralModel.findById(id).select('donor').lean()) as { donor?: { toString(): string } } | null;
      if (lifted?.donor) await syncDonorEligibility(lifted.donor.toString());
    },
  };
}
