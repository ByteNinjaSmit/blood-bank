import type {
  CreateDonorInput,
  ListDonorsInput,
  UpdateDonorInput,
} from '@/modules/donor/donor.validator';
import { NotFoundError } from '@/shared/errors';
import { DonorModel } from './donor.model';
import { DonationModel } from '@/modules/donation/donation.model';
import { CampModel } from '@/modules/camp/camp.model';
import { Types } from 'mongoose';
import type { DonorDto, RawDonor } from './donor.dto';
import { toDto } from './donor.dto';
import { populateLastDonationId, donorIdsWithinDonationWindow } from './donor.enrichment';
import { getDetailedDonationHistory } from './donor.history';

// Re-exported so existing consumers keep importing from donor.repository.
export type { DonorDto } from './donor.dto';
export { toDto } from './donor.dto';
export { populateLastDonationId } from './donor.enrichment';

export interface DonorRepo {
  create(input: CreateDonorInput, actorId: string): Promise<DonorDto>;
  findById(id: string): Promise<DonorDto | null>;
  update(id: string, patch: UpdateDonorInput, actorId: string): Promise<DonorDto>;
  list(input: ListDonorsInput): Promise<{ items: DonorDto[]; total: number }>;
  softDelete(id: string, actorId: string): Promise<void>;
  restore(id: string, actorId: string): Promise<void>;
  delete(id: string): Promise<void>;
  findActiveByPhone(phone: string): Promise<DonorDto | null>;
}

export function createDonorRepo(): DonorRepo {
  return {
    async create(input, actorId) {
      const dbRh = input.rh === 'Positive' ? 'POSITIVE' : input.rh === 'Negative' ? 'NEGATIVE' : input.rh;
      const doc = await DonorModel.create({
        ...input,
        rh: dbRh,
        createdBy: actorId,
        updatedBy: actorId,
      });
      const raw = doc.toObject() as unknown as RawDonor;
      const dtos = await populateLastDonationId([toDto(raw)]);
      return dtos[0] as DonorDto;
    },

    async findById(id) {
      const raw = (await DonorModel.findById(id).lean()) as unknown as RawDonor | null;
      if (!raw) return null;
      const dtos = await populateLastDonationId([toDto(raw)]);
      const history = await getDetailedDonationHistory(id);
      return {
        ...dtos[0],
        donationHistory: history,
      } as DonorDto;
    },

    async update(id, patch, actorId) {
      const dbPatch = { ...patch } as any;
      if (patch.rh) {
        dbPatch.rh = patch.rh === 'Positive' ? 'POSITIVE' : patch.rh === 'Negative' ? 'NEGATIVE' : patch.rh;
      }
      const updated = (await DonorModel.findByIdAndUpdate(
        id,
        { ...dbPatch, updatedBy: actorId, updatedAt: new Date() },
        { new: true, runValidators: true },
      ).lean()) as unknown as RawDonor | null;
      if (!updated) throw new NotFoundError('Donor', id);
      const dtos = await populateLastDonationId([toDto(updated)]);
      const history = await getDetailedDonationHistory(id);
      return {
        ...dtos[0],
        donationHistory: history,
      } as DonorDto;
    },

    async list(input) {
      const filter: Record<string, unknown> = {};
      if (input.deletedOnly) {
        filter.deletedAt = { $ne: null };
      } else {
        filter.deletedAt = null;
      }
      if (input.bloodGroup) filter.bloodGroup = input.bloodGroup;
      if (input.rh) filter.rh = input.rh === 'Positive' ? 'POSITIVE' : input.rh === 'Negative' ? 'NEGATIVE' : input.rh;
      if (input.city) filter['address.city'] = input.city;
      // Filter by eligibility status.
      // - "deferred" matches both deferred types.
      // - "eligible" and "recently-donated" are both stored as 'eligible';
      //   the 90/120-day interval splits them (recently-donated = inside the
      //   window, eligible = clear of it). Applied via $and so it composes
      //   with any source/camp _id filters below.
      if (input.eligibilityStatus === 'deferred') {
        filter.eligibilityStatus = { $in: ['deferred', 'temp-deferred'] };
      } else if (
        input.eligibilityStatus === 'eligible' ||
        input.eligibilityStatus === 'recently-donated'
      ) {
        filter.eligibilityStatus = 'eligible';
        const withinIds = [...(await donorIdsWithinDonationWindow())].map(
          (id) => new Types.ObjectId(id),
        );
        filter.$and = ((filter.$and as unknown[]) || []).concat([
          input.eligibilityStatus === 'recently-donated'
            ? { _id: { $in: withinIds } }
            : { _id: { $nin: withinIds } },
        ]);
      } else if (input.eligibilityStatus) {
        filter.eligibilityStatus = input.eligibilityStatus;
      }

      if (input.source === 'camp') {
        const campDonations = await DonationModel.find({ campId: { $ne: null } }, { donor: 1 }).lean();
        const campDonorIds = campDonations.map(d => d.donor?.toString()).filter(Boolean);
        const camps = await CampModel.find({}, { donorData: 1 }).lean();
        const campDataDonorIds = camps.flatMap(c => c.donorData || []).map(id => id.toString());
        const allCampDonorIds = Array.from(new Set([...campDonorIds, ...campDataDonorIds]));
        filter._id = { $in: allCampDonorIds.map(id => new Types.ObjectId(id)) };
      } else if (input.source === 'inhouse') {
        const campDonations = await DonationModel.find({ campId: { $ne: null } }, { donor: 1 }).lean();
        const campDonorIds = campDonations.map(d => d.donor?.toString()).filter(Boolean);
        const camps = await CampModel.find({}, { donorData: 1 }).lean();
        const campDataDonorIds = camps.flatMap(c => c.donorData || []).map(id => id.toString());
        const allCampDonorIds = Array.from(new Set([...campDonorIds, ...campDataDonorIds]));
        filter._id = { $nin: allCampDonorIds.map(id => new Types.ObjectId(id)) };
      }

      if (input.campId) {
        const campIdObj = new Types.ObjectId(input.campId);
        const campDonations = await DonationModel.find({ campId: campIdObj }, { donor: 1 }).lean();
        const campDonorIds = campDonations.map(d => d.donor?.toString()).filter(Boolean);
        const camp = await CampModel.findById(campIdObj, { donorData: 1 }).lean();
        const campDataDonorIds = (camp?.donorData || []).map(id => id.toString());
        const specificCampDonorIds = Array.from(new Set([...campDonorIds, ...campDataDonorIds]));
        const existingIdFilter = (filter._id as any) || {};
        filter._id = { ...existingIdFilter, $in: specificCampDonorIds.map(id => new Types.ObjectId(id)) };
      }

      if (input.search) {
        const term = input.search.trim();
        filter.$or = [
          { 'name.firstName': { $regex: term, $options: 'i' } },
          { 'name.lastName': { $regex: term, $options: 'i' } },
          { donorId: { $regex: term, $options: 'i' } },
          { phone: { $regex: term, $options: 'i' } },
          { uid: { $regex: term, $options: 'i' } },
          { email: { $regex: term, $options: 'i' } },
        ];
      }

      if (input.from || input.to) {
        const range: Record<string, Date> = {};
        if (input.from) range.$gte = input.from;
        if (input.to) range.$lte = input.to;
        filter.createdAt = range;
      }

      // Donors deferred at registration (temp or permanent) who never went on
      // to actually donate are noise here — they belong only in the Donor
      // Deferral Register. A donor who *did* donate and was deferred later
      // (e.g. TTI reactive lookback) still has a donation on record, so they
      // still show up in this list.
      if (!input.deletedOnly) {
        const donatedDonorIds = await DonationModel.distinct('donor');
        filter.$and = ((filter.$and as unknown[]) || []).concat([
          {
            $or: [
              { eligibilityStatus: { $nin: ['deferred', 'temp-deferred'] } },
              { _id: { $in: donatedDonorIds } },
            ],
          },
        ]);
      }

      const sortField = input.sortBy === 'name' ? 'name.firstName' : input.sortBy;
      const sortDir = input.order === 'asc' ? 1 : -1;

      const skip = (input.page - 1) * input.pageSize;
      const [docs, total] = await Promise.all([
        DonorModel.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(input.pageSize).lean(),
        DonorModel.countDocuments(filter),
      ]);
      const dtos = (docs as unknown as RawDonor[]).map(toDto);
      const populatedDtos = await populateLastDonationId(dtos);

      // Compute camp donor IDs so each DTO can be tagged with its source.
      // Re-use the camp lookup only when we don't already know (i.e. source filter not set).
      let campDonorIdSet: Set<string>;
      if (input.source === 'camp') {
        campDonorIdSet = new Set(populatedDtos.map(d => d.id));
      } else if (input.source === 'inhouse') {
        campDonorIdSet = new Set();
      } else {
        const [campDonationsAll, campsAll] = await Promise.all([
          DonationModel.find({ campId: { $ne: null } }, { donor: 1 }).lean(),
          CampModel.find({}, { donorData: 1 }).lean(),
        ]);
        const campDonorIdsAll = campDonationsAll.map(d => d.donor?.toString()).filter(Boolean) as string[];
        const campDataDonorIdsAll = campsAll.flatMap(c => c.donorData || []).map(id => id.toString());
        campDonorIdSet = new Set([...campDonorIdsAll, ...campDataDonorIdsAll]);
      }

      const taggedDtos = populatedDtos.map(dto => ({
        ...dto,
        source: campDonorIdSet.has(dto.id) ? ('camp' as const) : ('inhouse' as const),
      }));

      return {
        items: taggedDtos,
        total,
      };
    },

    async softDelete(id, actorId) {
      const result = await DonorModel.updateOne(
        { _id: id },
        { deletedAt: new Date(), updatedBy: new Types.ObjectId(actorId) },
      );
      if (result.matchedCount === 0) throw new NotFoundError('Donor', id);
    },

    async restore(id, actorId) {
      const result = await DonorModel.updateOne(
        { _id: id },
        { deletedAt: null, updatedBy: new Types.ObjectId(actorId) },
      );
      if (result.matchedCount === 0) throw new NotFoundError('Donor', id);
    },

    // Permanent, irreversible removal — only reached once a donor has
    // already been soft-deleted (see donor.service.ts remove()).
    async delete(id) {
      const result = await DonorModel.deleteOne({ _id: id });
      if (result.deletedCount === 0) throw new NotFoundError('Donor', id);
    },

    async findActiveByPhone(phone) {
      const raw = (await DonorModel.findOne({ phone }).lean()) as unknown as RawDonor | null;
      if (!raw) return null;
      const dtos = await populateLastDonationId([toDto(raw)]);
      return dtos[0] as DonorDto;
    },
  };
}
