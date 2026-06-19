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

export interface DonorDto {
  id: string;
  donorId?: string;
  name: { firstName: string; middleName?: string; lastName: string };
  uid?: string;
  dob: string;
  sex: 'M' | 'F' | 'O';
  phone: string;
  email?: string;
  address: {
    line1?: string;
    line2?: string;
    city: string;
    district: string;
    state: string;
    pincode?: string;
  };
  occupation?: string;
  weightKg: number;
  bloodGroup: 'A' | 'B' | 'AB' | 'O';
  rh: 'Positive' | 'Negative';
  eligibilityStatus?: 'eligible' | 'deferred' | 'temp-deferred';
  lastDonationDate?: string;
  lastDonationId?: string;
  createdAt: string;
  updatedAt: string;
}

interface RawDonor {
  _id: { toString(): string };
  donorId?: string;
  name: { firstName: string; middleName?: string; lastName: string };
  uid?: string;
  dob: Date;
  sex: 'M' | 'F' | 'O';
  phone: string;
  email?: string;
  address: DonorDto['address'];
  occupation?: string;
  weightKg: number;
  bloodGroup: DonorDto['bloodGroup'];
  rh: DonorDto['rh'];
  eligibilityStatus?: DonorDto['eligibilityStatus'];
  lastDonationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function toDto(raw: any): any {
  const firstName = raw.name?.firstName || '';
  const middleName = raw.name?.middleName || '';
  const lastName = raw.name?.lastName || '';
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');

  let age = 0;
  if (raw.dob) {
    const dobDate = new Date(raw.dob);
    const today = new Date();
    age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
  }

  return {
    id: raw._id?.toString() || raw.id,
    _id: raw._id?.toString() || raw.id,
    donorId: raw.donorId,
    name: raw.name,
    fullName,
    age,
    city: raw.address?.city,
    uid: raw.uid,
    dob: raw.dob instanceof Date ? raw.dob.toISOString() : new Date(raw.dob).toISOString(),
    sex: raw.sex,
    phone: raw.phone,
    email: raw.email,
    address: raw.address,
    occupation: raw.occupation,
    weightKg: raw.weightKg,
    bloodGroup: raw.bloodGroup,
    rh: raw.rh === 'POSITIVE' ? 'Positive' : raw.rh === 'NEGATIVE' ? 'Negative' : raw.rh,
    eligibilityStatus: raw.eligibilityStatus,
    lastDonationDate: raw.lastDonationDate ? (raw.lastDonationDate instanceof Date ? raw.lastDonationDate.toISOString() : new Date(raw.lastDonationDate).toISOString()) : undefined,
    createdAt: raw.createdAt ? (raw.createdAt instanceof Date ? raw.createdAt.toISOString() : new Date(raw.createdAt).toISOString()) : new Date().toISOString(),
    updatedAt: raw.updatedAt ? (raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : new Date(raw.updatedAt).toISOString()) : new Date().toISOString(),
  };
}

export interface DonorRepo {
  create(input: CreateDonorInput, actorId: string): Promise<DonorDto>;
  findById(id: string): Promise<DonorDto | null>;
  update(id: string, patch: UpdateDonorInput, actorId: string): Promise<DonorDto>;
  list(input: ListDonorsInput): Promise<{ items: DonorDto[]; total: number }>;
  delete(id: string): Promise<void>;
  findActiveByPhone(phone: string): Promise<DonorDto | null>;
}

async function populateLastDonationId(dtos: DonorDto[]): Promise<DonorDto[]> {
  if (dtos.length === 0) return dtos;
  const donorIds = dtos.map(d => new Types.ObjectId(d.id));
  const donations = await DonationModel.aggregate([
    { $match: { donor: { $in: donorIds } } },
    { $sort: { donationDate: -1, createdAt: -1 } },
    { $group: { _id: '$donor', lastDonationId: { $first: '$_id' } } }
  ]);
  const donationMap = new Map(donations.map(d => [d._id.toString(), d.lastDonationId.toString()]));
  return dtos.map(dto => ({
    ...dto,
    lastDonationId: donationMap.get(dto.id)
  }));
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
      return dtos[0] as DonorDto;
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
      return dtos[0] as DonorDto;
    },

    async list(input) {
      const filter: Record<string, unknown> = {};
      if (input.bloodGroup) filter.bloodGroup = input.bloodGroup;
      if (input.rh) filter.rh = input.rh === 'Positive' ? 'POSITIVE' : input.rh === 'Negative' ? 'NEGATIVE' : input.rh;
      if (input.city) filter['address.city'] = input.city;
      // Filter by eligibility status: support "deferred" to match both deferred types
      if (input.eligibilityStatus === 'deferred') {
        filter.eligibilityStatus = { $in: ['deferred', 'temp-deferred'] };
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
      const skip = (input.page - 1) * input.pageSize;
      const [docs, total] = await Promise.all([
        DonorModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(input.pageSize).lean(),
        DonorModel.countDocuments(filter),
      ]);
      const dtos = (docs as unknown as RawDonor[]).map(toDto);
      const populatedDtos = await populateLastDonationId(dtos);
      return {
        items: populatedDtos,
        total,
      };
    },

    async delete(id) {
      // Soft delete is the long-term goal (see CLAUDE.md). The legacy
      // Donor model has no deletedAt field yet — for now we mirror the
      // existing controller's behaviour and hard-delete. Replace when
      // the Donor schema migrates to the new shape.
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
