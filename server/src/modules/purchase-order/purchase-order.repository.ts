import { Types } from 'mongoose';
import { PurchaseOrderModel } from '@/modules/purchase-order/purchase-order.model';
import type { ListPOInput } from '@/modules/purchase-order/purchase-order.validator';

export interface LineItemDto {
  bagType: string;
  capacityMl: number;
  anticoagulant: string;
  productCode?: string;
  quantityOrdered: number;
  unitPriceRs?: number;
  gstPercent?: number;
}

export interface PODto {
  id: string;
  poNumber: string;
  poDate: string;
  vendorId: string;
  lineItems: LineItemDto[];
  totalAmountRs?: number;
  expectedDelivery?: string;
  manufacturer?: string;
  invoiceNo?: string;
  billDate?: string;
  purchaseOfficerId: string;
  approvalStatus: string;
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

function toDto(doc: Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date }): PODto {
  return {
    id: doc._id.toString(),
    poNumber: doc.poNumber as string,
    poDate: (doc.poDate as Date).toISOString(),
    vendorId: (doc.vendorId as Types.ObjectId).toString(),
    lineItems: (doc.lineItems as LineItemDto[]) ?? [],
    totalAmountRs: doc.totalAmountRs as number | undefined,
    expectedDelivery: doc.expectedDelivery ? (doc.expectedDelivery as Date).toISOString() : undefined,
    manufacturer: doc.manufacturer as string | undefined,
    invoiceNo: doc.invoiceNo as string | undefined,
    billDate: doc.billDate ? (doc.billDate as Date).toISOString() : undefined,
    purchaseOfficerId: (doc.purchaseOfficerId as Types.ObjectId).toString(),
    approvalStatus: doc.approvalStatus as string,
    approvedById: doc.approvedById ? (doc.approvedById as Types.ObjectId).toString() : undefined,
    approvedAt: doc.approvedAt ? (doc.approvedAt as Date).toISOString() : undefined,
    rejectionReason: doc.rejectionReason as string | undefined,
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
    totalAmountRs: number;
    expectedDelivery?: Date;
    manufacturer?: string;
    invoiceNo?: string;
    billDate?: Date;
    purchaseOfficerId: string;
    notes?: string;
    actorId: string;
  }): Promise<PODto>;
  update(id: string, patch: Partial<{
    lineItems: LineItemDto[];
    totalAmountRs: number;
    expectedDelivery: Date;
    manufacturer: string;
    invoiceNo: string;
    billDate: Date;
    notes: string;
  }>, actorId: string): Promise<PODto | null>;
  updateStatus(id: string, patch: {
    approvalStatus: string;
    approvedById?: string;
    approvedAt?: Date;
    rejectionReason?: string;
  }, actorId: string): Promise<PODto | null>;
}

export function createPORepo(): PORepo {
  return {
    async list(q) {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (q.approvalStatus) filter.approvalStatus = q.approvalStatus;
      if (q.vendorId) filter.vendorId = new Types.ObjectId(q.vendorId);
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
        totalAmountRs: input.totalAmountRs,
        expectedDelivery: input.expectedDelivery,
        manufacturer: input.manufacturer,
        invoiceNo: input.invoiceNo,
        billDate: input.billDate,
        purchaseOfficerId: new Types.ObjectId(input.purchaseOfficerId),
        approvalStatus: 'DRAFT',
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

    async updateStatus(id, patch, actorId) {
      const actor = new Types.ObjectId(actorId);
      const update: Record<string, unknown> = { approvalStatus: patch.approvalStatus, updatedBy: actor };
      if (patch.approvedById) update.approvedById = new Types.ObjectId(patch.approvedById);
      if (patch.approvedAt) update.approvedAt = patch.approvedAt;
      if (patch.rejectionReason) update.rejectionReason = patch.rejectionReason;
      const doc = await PurchaseOrderModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { $set: update },
        { new: true },
      ).lean();
      if (!doc) return null;
      return toDto(doc as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date });
    },
  };
}
