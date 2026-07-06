import { Types } from 'mongoose';
import { PurchaseOrderModel } from '@/modules/purchase-order/purchase-order.model';
import type { ListPOInput } from '@/modules/purchase-order/purchase-order.validator';

export interface LineItemDto {
  bagType: string;
  capacityMl: number;
  anticoagulant: string;
  productCode?: string;
  quantityOrdered: number;
}

export interface PODto {
  id: string;
  _id: string;
  poNumber: string;
  poDate: string;
  vendorId: string;
  lineItems: LineItemDto[];
  expectedDelivery?: string;
  manufacturer?: string;
  billDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

function toDto(doc: Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date }): PODto {
  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    poNumber: doc.poNumber as string,
    poDate: (doc.poDate as Date).toISOString(),
    vendorId: (doc.vendorId as Types.ObjectId).toString(),
    lineItems: (doc.lineItems as LineItemDto[]) ?? [],
    expectedDelivery: doc.expectedDelivery ? (doc.expectedDelivery as Date).toISOString() : undefined,
    manufacturer: doc.manufacturer as string | undefined,
    billDate: doc.billDate ? (doc.billDate as Date).toISOString() : undefined,
    notes: doc.notes as string | undefined,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : '',
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : '',
  };
}

export interface PORepo {
  list(q: ListPOInput): Promise<{ items: PODto[]; total: number }>;
  findById(id: string): Promise<PODto | null>;
  create(doc: {
    poNumber: string;
    poDate: Date;
    vendorId: string;
    lineItems: LineItemDto[];
    expectedDelivery?: Date;
    manufacturer?: string;
    billDate?: Date;
    notes?: string;
    actorId: string;
  }): Promise<PODto>;
  update(id: string, patch: Partial<{
    lineItems: LineItemDto[];
    expectedDelivery: Date;
    manufacturer: string;
    billDate: Date;
    notes: string;
  }>, actorId: string): Promise<PODto | null>;
  delete(id: string, actorId: string): Promise<boolean>;
}

export function createPORepo(): PORepo {
  return {
    async list(q) {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (q.vendorId) filter.vendorId = new Types.ObjectId(q.vendorId);
      if (q.search) filter.poNumber = { $regex: q.search, $options: 'i' };
      if (q.from || q.to) {
        const range: Record<string, Date> = {};
        if (q.from) range.$gte = q.from;
        if (q.to) range.$lte = q.to;
        filter.poDate = range;
      }
      const page = q.page ?? 1;
      const pageSize = q.pageSize ?? 20;
      const skip = (page - 1) * pageSize;
      const [docs, total] = await Promise.all([
        PurchaseOrderModel.find(filter).sort({ poDate: -1 }).skip(skip).limit(pageSize).lean(),
        PurchaseOrderModel.countDocuments(filter),
      ]);
      return { items: docs.map((d) => toDto(d as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date })), total };
    },

    async findById(id) {
      const doc = await PurchaseOrderModel.findOne({ _id: new Types.ObjectId(id), deletedAt: null }).lean();
      if (!doc) return null;
      return toDto(doc as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date });
    },

    async create(input) {
      const actor = new Types.ObjectId(input.actorId);
      const doc = await PurchaseOrderModel.create({
        poNumber: input.poNumber,
        poDate: input.poDate,
        vendorId: new Types.ObjectId(input.vendorId),
        lineItems: input.lineItems,
        expectedDelivery: input.expectedDelivery,
        manufacturer: input.manufacturer,
        billDate: input.billDate,
        notes: input.notes,
        createdBy: actor,
        updatedBy: actor,
      });
      return toDto(doc.toObject() as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date });
    },

    async update(id, patch, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await PurchaseOrderModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { $set: { ...patch, updatedBy: actor } },
        { new: true },
      ).lean();
      if (!doc) return null;
      return toDto(doc as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date });
    },

    async delete(id, actorId) {
      const actor = new Types.ObjectId(actorId);
      const res = await PurchaseOrderModel.updateOne(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { $set: { deletedAt: new Date(), updatedBy: actor } }
      );
      return res.modifiedCount > 0;
    },
  };
}
