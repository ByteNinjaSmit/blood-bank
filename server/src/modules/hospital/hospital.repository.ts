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
    createdAt: r.createdAt?.toISOString(),
    updatedAt: r.updatedAt?.toISOString(),
  };
}

export interface ListHospitalsFilter {
  name?: string;
  contactPerson?: string;
  phone?: string;
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
    const filter: Record<string, unknown> = {};
    if (f.name) filter.name = { $regex: f.name, $options: 'i' };
    if (f.contactPerson) filter.contactPerson = { $regex: f.contactPerson, $options: 'i' };
    if (f.phone) filter.phone = { $regex: f.phone, $options: 'i' };
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
};
