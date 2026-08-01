import { Types } from 'mongoose';
import { HospitalModel } from './hospital.model';

export interface HospitalDto {
  id: string;
  hospitalId?: string;
  name: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  licenseNo?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface RawHospital {
  _id: { toString(): string };
  hospitalId?: string;
  name: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  licenseNo?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

function toDto(r: RawHospital): HospitalDto {
  return {
    id: r._id.toString(),
    hospitalId: r.hospitalId,
    name: r.name,
    address: r.address,
    contactPerson: r.contactPerson,
    phone: r.phone,
    email: r.email,
    licenseNo: r.licenseNo,
    isActive: r.isActive,
    createdAt: r.createdAt?.toISOString(),
    updatedAt: r.updatedAt?.toISOString(),
  };
}

export interface ListHospitalsFilter {
  name?: string;
  contactPerson?: string;
  phone?: string;
  isActive?: boolean;
  from?: Date;
  to?: Date;
  deletedOnly?: boolean;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const hospitalRepo = {
  async findOnePhone(phone: string, excludeId?: string): Promise<boolean> {
    const q: Record<string, unknown> = { phone: phone.trim() };
    if (excludeId) q._id = { $ne: new Types.ObjectId(excludeId) };
    return Boolean(await HospitalModel.exists(q));
  },
  async nextHospitalId(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await HospitalModel.findOne({}).sort({ createdAt: -1 }).lean();
    let n = 1;
    if (last?.hospitalId) {
      const parts = String(last.hospitalId).split('-');
      if (parts.length === 3 && parts[1] === String(year) && parts[2]) {
        n = Number.parseInt(parts[2], 10) + 1;
      }
    }
    return `HSP-${year}-${String(n).padStart(4, '0')}`;
  },
  async create(doc: Record<string, unknown>): Promise<HospitalDto> {
    const created = await HospitalModel.create(doc);
    return toDto(created.toObject() as unknown as RawHospital);
  },
  async list(f: ListHospitalsFilter): Promise<{ items: HospitalDto[]; total: number }> {
    const filter: Record<string, unknown> = { deletedAt: f.deletedOnly ? { $ne: null } : null };
    if (f.name) filter.name = { $regex: f.name, $options: 'i' };
    if (f.contactPerson) filter.contactPerson = { $regex: f.contactPerson, $options: 'i' };
    if (f.phone) filter.phone = { $regex: f.phone, $options: 'i' };
    if (f.isActive !== undefined) filter.isActive = f.isActive;
    if (f.from || f.to) {
      const range: Record<string, Date> = {};
      if (f.from) range.$gte = f.from;
      if (f.to) range.$lte = f.to;
      filter.createdAt = range;
    }
    const sort: Record<string, 1 | -1> = { [f.sortBy]: f.sortOrder === 'desc' ? -1 : 1 };
    const skip = (f.page - 1) * f.limit;
    const [docs, total] = await Promise.all([
      HospitalModel.find(filter).sort(sort).skip(skip).limit(f.limit).lean(),
      HospitalModel.countDocuments(filter),
    ]);
    return { items: (docs as unknown as RawHospital[]).map(toDto), total };
  },
  async findById(id: string): Promise<HospitalDto | null> {
    const raw = (await HospitalModel.findById(id).lean()) as unknown as RawHospital | null;
    return raw ? toDto(raw) : null;
  },
  async update(id: string, patch: Record<string, unknown>): Promise<HospitalDto | null> {
    const raw = (await HospitalModel.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    }).lean()) as unknown as RawHospital | null;
    return raw ? toDto(raw) : null;
  },
  async remove(id: string): Promise<boolean> {
    const r = await HospitalModel.findByIdAndDelete(id);
    return Boolean(r);
  },

  // Unlike findById (used by normal reads and excludes soft-deleted
  // rows), this is used by restore/permanentDelete which expect to
  // find an already soft-deleted hospital.
  async findByIdIncludingDeleted(id: string): Promise<HospitalDto | null> {
    const raw = (await HospitalModel.findById(id).lean()) as unknown as RawHospital | null;
    return raw ? toDto(raw) : null;
  },

  async softDelete(id: string, actorId: string): Promise<boolean> {
    const res = await HospitalModel.updateOne(
      { _id: new Types.ObjectId(id), deletedAt: null },
      { $set: { deletedAt: new Date(), deletedBy: new Types.ObjectId(actorId) } },
    );
    return res.modifiedCount > 0;
  },

  async restore(id: string, actorId: string): Promise<boolean> {
    const res = await HospitalModel.updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: { deletedAt: null, updatedBy: new Types.ObjectId(actorId) } },
    );
    return res.modifiedCount > 0;
  },
};
