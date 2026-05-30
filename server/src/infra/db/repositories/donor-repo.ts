// Donor repository. Only data access. Returns plain DTOs.
//
// During side-by-side migration this wraps the legacy Mongoose model
// at server/models/donor-model.js so writes go to the same collection
// the old controllers see.

import type { CreateDonorInput, ListDonorsInput, UpdateDonorInput } from '@/http/validators/donor';
import { NotFoundError } from '@/shared/errors';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const DonorModel = require('../../../../models/donor-model.js');

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

function toDto(raw: RawDonor): DonorDto {
  return {
    id: raw._id.toString(),
    donorId: raw.donorId,
    name: raw.name,
    uid: raw.uid,
    dob: raw.dob.toISOString(),
    sex: raw.sex,
    phone: raw.phone,
    email: raw.email,
    address: raw.address,
    occupation: raw.occupation,
    weightKg: raw.weightKg,
    bloodGroup: raw.bloodGroup,
    rh: raw.rh,
    eligibilityStatus: raw.eligibilityStatus,
    lastDonationDate: raw.lastDonationDate?.toISOString(),
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
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

export function createDonorRepo(): DonorRepo {
  return {
    async create(input, actorId) {
      const doc = await DonorModel.create({
        ...input,
        createdBy: actorId,
        updatedBy: actorId,
      });
      const raw = doc.toObject() as RawDonor;
      return toDto(raw);
    },

    async findById(id) {
      const raw = (await DonorModel.findById(id).lean()) as RawDonor | null;
      return raw ? toDto(raw) : null;
    },

    async update(id, patch, actorId) {
      const updated = (await DonorModel.findByIdAndUpdate(
        id,
        { ...patch, updatedBy: actorId, updatedAt: new Date() },
        { new: true, runValidators: true },
      ).lean()) as RawDonor | null;
      if (!updated) throw new NotFoundError('Donor', id);
      return toDto(updated);
    },

    async list(input) {
      const filter: Record<string, unknown> = {};
      if (input.bloodGroup) filter.bloodGroup = input.bloodGroup;
      if (input.rh) filter.rh = input.rh;
      if (input.city) filter['address.city'] = input.city;
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
        DonorModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(input.pageSize)
          .lean(),
        DonorModel.countDocuments(filter),
      ]);
      return {
        items: (docs as RawDonor[]).map(toDto),
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
      const raw = (await DonorModel.findOne({ phone }).lean()) as RawDonor | null;
      return raw ? toDto(raw) : null;
    },
  };
}
