import { Types } from 'mongoose';
import { GoodsReceiptModel } from '@/modules/goods-receipt/goods-receipt.model';
import type { ListGRNInput } from '@/modules/goods-receipt/goods-receipt.validator';

export interface BatchLineDto {
  bagType: string;
  capacityMl: number;
  anticoagulant?: string;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate: string;
  quantityReceived: number;
}

export interface FinancialsDto {
  basicAmountRs?: number;
  cgstRs?: number;
  sgstRs?: number;
  igstRs?: number;
  discountRs?: number;
  netAmountRs?: number;
}

export interface GRNDto {
  id: string;
  _id: string;
  grnNumber: string;
  poId: string;
  vendorName?: string;
  invoiceNo: string;
  billDate?: string;
  transportDetails?: string;
  receivedDate?: string;
  receivedById?: string;
  batchLines: BatchLineDto[];
  financials?: FinancialsDto;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

function toDto(doc: Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date }): GRNDto {
  const batchLines = ((doc.batchLines as Array<Record<string, unknown>>) ?? []).map((b) => ({
    bagType: b.bagType as string,
    capacityMl: b.capacityMl as number,
    anticoagulant: b.anticoagulant as string | undefined,
    batchNumber: b.batchNumber as string,
    manufacturingDate: b.manufacturingDate ? (b.manufacturingDate as Date).toISOString() : undefined,
    expiryDate: (b.expiryDate as Date).toISOString(),
    quantityReceived: b.quantityReceived as number,
  }));
  const fin = doc.financials as Record<string, unknown> | undefined;
  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    grnNumber: doc.grnNumber as string,
    poId: (doc.poId as Types.ObjectId).toString(),
    vendorName: doc.vendorName as string | undefined,
    invoiceNo: doc.invoiceNo as string,
    billDate: doc.billDate ? (doc.billDate as Date).toISOString() : undefined,
    transportDetails: doc.transportDetails as string | undefined,
    receivedDate: doc.receivedDate ? (doc.receivedDate as Date).toISOString() : undefined,
    receivedById: doc.receivedById ? (doc.receivedById as Types.ObjectId).toString() : undefined,
    batchLines,
    financials: fin ? {
      basicAmountRs: fin.basicAmountRs as number | undefined,
      cgstRs: fin.cgstRs as number | undefined,
      sgstRs: fin.sgstRs as number | undefined,
      igstRs: fin.igstRs as number | undefined,
      discountRs: fin.discountRs as number | undefined,
      netAmountRs: fin.netAmountRs as number | undefined,
    } : undefined,
    status: doc.status as string,
    notes: doc.notes as string | undefined,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : '',
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : '',
  };
}

export interface GRNRepo {
  list(q: ListGRNInput): Promise<{ items: GRNDto[]; total: number }>;
  findById(id: string): Promise<GRNDto | null>;
  create(doc: {
    grnNumber: string;
    poId: string;
    vendorName?: string;
    invoiceNo: string;
    billDate?: Date;
    transportDetails?: string;
    receivedDate?: Date;
    receivedById?: string;
    batchLines: BatchLineDto[];
    financials?: FinancialsDto;
    notes?: string;
    actorId: string;
  }): Promise<GRNDto>;
  update(id: string, patch: Partial<{
    invoiceNo: string;
    billDate: Date;
    transportDetails: string;
    receivedDate: Date;
    batchLines: BatchLineDto[];
    financials: FinancialsDto;
    notes: string;
  }>, actorId: string): Promise<GRNDto | null>;
}

export function createGRNRepo(): GRNRepo {
  return {
    async list(q) {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (q.poId) filter.poId = new Types.ObjectId(q.poId);
      if (q.vendorName) filter.vendorName = new RegExp(q.vendorName, 'i');
      if (q.status) filter.status = q.status;
      if (q.fromDate || q.toDate) {
        const range: Record<string, Date> = {};
        if (q.fromDate) range.$gte = q.fromDate;
        if (q.toDate) range.$lte = q.toDate;
        filter.receivedDate = range;
      }
      const page = q.page ?? 1;
      const pageSize = q.pageSize ?? 20;
      const skip = (page - 1) * pageSize;
      const [docs, total] = await Promise.all([
        GoodsReceiptModel.find(filter).sort({ receivedDate: -1 }).skip(skip).limit(pageSize).lean(),
        GoodsReceiptModel.countDocuments(filter),
      ]);
      return { items: docs.map((d) => toDto(d as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date })), total };
    },

    async findById(id) {
      const doc = await GoodsReceiptModel.findOne({ _id: new Types.ObjectId(id), deletedAt: null }).lean();
      if (!doc) return null;
      return toDto(doc as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date });
    },

    async create(input) {
      const actor = new Types.ObjectId(input.actorId);
      const doc = await GoodsReceiptModel.create({
        grnNumber: input.grnNumber,
        poId: new Types.ObjectId(input.poId),
        vendorName: input.vendorName,
        invoiceNo: input.invoiceNo,
        billDate: input.billDate,
        transportDetails: input.transportDetails,
        receivedDate: input.receivedDate,
        receivedById: input.receivedById ? new Types.ObjectId(input.receivedById) : actor,
        batchLines: input.batchLines.map((b) => ({
          ...b,
          manufacturingDate: b.manufacturingDate ? new Date(b.manufacturingDate) : undefined,
          expiryDate: new Date(b.expiryDate),
        })),
        financials: input.financials,
        notes: input.notes,
        status: 'ACCEPTED',
        createdBy: actor,
        updatedBy: actor,
      });
      return toDto(doc.toObject() as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date });
    },

    async update(id, patch, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await GoodsReceiptModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { $set: { ...patch, updatedBy: actor } },
        { new: true },
      ).lean();
      if (!doc) return null;
      return toDto(doc as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date });
    },
  };
}
