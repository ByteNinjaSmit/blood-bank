import { Types } from 'mongoose';
import { VendorModel } from '@/modules/vendor/vendor.model';
import type { ListVendorsInput } from '@/modules/vendor/vendor.validator';

export interface VendorDto {
  id: string;
  vendorId: string;
  name: string;
  manufacturer: string;
  drugLicenseNo: string;
  gstNo: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  email?: string;
  approvalStatus: string;
  contractStart?: string;
  contractEnd?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

function toDto(doc: Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date }): VendorDto {
  return {
    id: doc._id.toString(),
    vendorId: doc.vendorId as string,
    name: doc.name as string,
    manufacturer: doc.manufacturer as string,
    drugLicenseNo: doc.drugLicenseNo as string,
    gstNo: doc.gstNo as string,
    address: doc.address as string,
    contactPerson: doc.contactPerson as string,
    contactPhone: doc.contactPhone as string,
    email: doc.email as string | undefined,
    approvalStatus: doc.approvalStatus as string,
    contractStart: doc.contractStart ? (doc.contractStart as Date).toISOString() : undefined,
    contractEnd: doc.contractEnd ? (doc.contractEnd as Date).toISOString() : undefined,
    notes: doc.notes as string | undefined,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : '',
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : '',
  };
}

export interface VendorRepo {
  list(q: ListVendorsInput): Promise<{ items: VendorDto[]; total: number }>;
  findById(id: string): Promise<VendorDto | null>;
  findByDrugLicense(license: string): Promise<VendorDto | null>;
  create(doc: {
    vendorId: string;
    name: string;
    manufacturer: string;
    drugLicenseNo: string;
    gstNo: string;
    address: string;
    contactPerson: string;
    contactPhone: string;
    email?: string;
    contractStart?: Date;
    contractEnd?: Date;
    notes?: string;
    actorId: string;
  }): Promise<VendorDto>;
  update(id: string, patch: Partial<{
    name: string;
    manufacturer: string;
    contactPerson: string;
    contactPhone: string;
    email: string;
    address: string;
    gstNo: string;
    notes: string;
    contractStart: Date;
    contractEnd: Date;
  }>, actorId: string): Promise<VendorDto | null>;
  updateStatus(id: string, approvalStatus: string, actorId: string): Promise<VendorDto | null>;
  softDelete(id: string, actorId: string): Promise<boolean>;
}

export function createVendorRepo(): VendorRepo {
  return {
    async list(q) {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (q.approvalStatus) filter.approvalStatus = q.approvalStatus;
      if (q.search) {
        const rx = new RegExp(q.search, 'i');
        filter.$or = [{ name: rx }, { manufacturer: rx }, { drugLicenseNo: rx }];
      }
      const page = q.page ?? 1;
      const pageSize = q.pageSize ?? 20;
      const skip = (page - 1) * pageSize;
      const [docs, total] = await Promise.all([
        VendorModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
        VendorModel.countDocuments(filter),
      ]);
      return { items: docs.map((d) => toDto(d as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date })), total };
    },

    async findById(id) {
      const doc = await VendorModel.findOne({ _id: new Types.ObjectId(id), deletedAt: null }).lean();
      if (!doc) return null;
      return toDto(doc as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date });
    },

    async findByDrugLicense(license) {
      const doc = await VendorModel.findOne({ drugLicenseNo: license, deletedAt: null }).lean();
      if (!doc) return null;
      return toDto(doc as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date });
    },

    async create(input) {
      const actor = new Types.ObjectId(input.actorId);
      const doc = await VendorModel.create({
        vendorId: input.vendorId,
        name: input.name,
        manufacturer: input.manufacturer,
        drugLicenseNo: input.drugLicenseNo,
        gstNo: input.gstNo,
        address: input.address,
        contactPerson: input.contactPerson,
        contactPhone: input.contactPhone,
        email: input.email,
        contractStart: input.contractStart,
        contractEnd: input.contractEnd,
        notes: input.notes,
        createdBy: actor,
        updatedBy: actor,
      });
      return toDto(doc.toObject() as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date });
    },

    async update(id, patch, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await VendorModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { $set: { ...patch, updatedBy: actor } },
        { new: true },
      ).lean();
      if (!doc) return null;
      return toDto(doc as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date });
    },

    async updateStatus(id, approvalStatus, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await VendorModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { $set: { approvalStatus, updatedBy: actor } },
        { new: true },
      ).lean();
      if (!doc) return null;
      return toDto(doc as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date });
    },

    async softDelete(id, actorId) {
      const actor = new Types.ObjectId(actorId);
      const res = await VendorModel.updateOne(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { $set: { deletedAt: new Date(), deletedBy: actor, updatedBy: actor } },
      );
      return res.modifiedCount > 0;
    },
  };
}
