import { Types } from 'mongoose';
import { BagStockModel } from '@/modules/bag-stock/bag-stock.model';
import type { ListBagStockInput } from '@/modules/bag-stock/bag-stock.validator';

export interface BagStockDto {
  id: string;
  _id?: string;
  stockId: string;
  bagType: string;
  capacityMl: number;
  anticoagulant?: string;
  manufacturer: string;
  batchNumber: string;
  expiryDate: string;
  grnId?: string;
  openingStock: number;
  receivedQty: number;
  issuedQty: number;
  damagedQty: number;
  discardedQty: number;
  closingStock: number;
  unopenedBoxes: number;
  status: string;
  lastUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BagStockSummaryItem {
  bagType: string;
  totalClosingStock: number;
  totalReceived: number;
  totalIssued: number;
  totalDamaged: number;
  totalDiscarded: number;
}

function toDto(
  doc: Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date },
): BagStockDto {
  const opening = (doc.openingStock as number) ?? 0;
  const received = (doc.receivedQty as number) ?? 0;
  const issued = (doc.issuedQty as number) ?? 0;
  const damaged = (doc.damagedQty as number) ?? 0;
  const discarded = (doc.discardedQty as number) ?? 0;
  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    stockId: doc.stockId as string,
    bagType: doc.bagType as string,
    capacityMl: doc.capacityMl as number,
    anticoagulant: doc.anticoagulant as string | undefined,
    manufacturer: doc.manufacturer as string,
    batchNumber: doc.batchNumber as string,
    expiryDate: (doc.expiryDate as Date).toISOString(),
    grnId: doc.grnId ? (doc.grnId as Types.ObjectId).toString() : undefined,
    openingStock: opening,
    receivedQty: received,
    issuedQty: issued,
    damagedQty: damaged,
    discardedQty: discarded,
    closingStock: opening + received - issued - damaged - discarded,
    unopenedBoxes: (doc.unopenedBoxes as number) ?? 0,
    status: doc.status as string,
    lastUpdatedAt: doc.lastUpdatedAt ? (doc.lastUpdatedAt as Date).toISOString() : undefined,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : '',
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : '',
  };
}

export interface LowBoxBatchDto {
  stockId: string;
  bagType: string;
  batchNumber: string;
  unopenedBoxes: number;
  capacityMl: number;
  expiryDate: string;
}

export interface BagStockRepo {
  list(q: ListBagStockInput): Promise<{ items: BagStockDto[]; total: number }>;
  findById(id: string): Promise<BagStockDto | null>;
  findByBatchAndType(batchNumber: string, bagType: string): Promise<BagStockDto | null>;
  findByBatch(batchNumber: string): Promise<BagStockDto[]>;
  summary(): Promise<BagStockSummaryItem[]>;
  lowBoxStock(threshold?: number): Promise<LowBoxBatchDto[]>;
  upsertFromGRN(doc: {
    stockId: string;
    bagType: string;
    capacityMl: number;
    anticoagulant?: string;
    manufacturer: string;
    batchNumber: string;
    expiryDate: Date;
    grnId: string;
    receivedQty: number;
    actorId: string;
  }): Promise<BagStockDto>;
  incrementIssued(id: string, qty: number, actorId: string): Promise<BagStockDto | null>;
  decrementIssued(id: string, qty: number, actorId: string): Promise<BagStockDto | null>;
  incrementDamaged(id: string, qty: number, actorId: string): Promise<BagStockDto | null>;
  incrementDiscarded(id: string, qty: number, actorId: string): Promise<BagStockDto | null>;
  decrementDiscarded(id: string, qty: number, actorId: string): Promise<BagStockDto | null>;
  updateStatus(id: string, status: string, actorId: string): Promise<BagStockDto | null>;
  setReceivedQtyAndBoxes(
    batchNumber: string,
    bagType: string,
    receivedQty: number,
    unopenedBoxes: number,
    actorId: string,
  ): Promise<BagStockDto | null>;
  openBox(id: string, actorId: string): Promise<BagStockDto | null>;
}

export function createBagStockRepo(): BagStockRepo {
  return {
    async list(q) {
      const filter: Record<string, unknown> = {
        deletedAt: null,
        // A batch only counts as usable inventory once accepted (closing
        // stock > 0) — rows still pending QC or corrected to REJECTED sit
        // at zero and must not appear here at all (they're not "stock",
        // they never cleared or were rejected).
        $expr: {
          $gt: [
            {
              $subtract: [
                { $add: ['$openingStock', '$receivedQty'] },
                { $add: ['$issuedQty', '$damagedQty', '$discardedQty'] },
              ],
            },
            0,
          ],
        },
      };
      if (q.bagType) filter.bagType = q.bagType;
      if (q.status) filter.status = q.status;
      if (q.expiryBefore) filter.expiryDate = { $lte: q.expiryBefore };
      const page = q.page ?? 1;
      const pageSize = q.pageSize ?? 20;
      const skip = (page - 1) * pageSize;
      const [docs, total] = await Promise.all([
        BagStockModel.find(filter).sort({ expiryDate: 1 }).skip(skip).limit(pageSize).lean(),
        BagStockModel.countDocuments(filter),
      ]);
      return {
        items: docs.map((d) =>
          toDto(
            d as unknown as Record<string, unknown> & {
              _id: Types.ObjectId;
              createdAt?: Date;
              updatedAt?: Date;
            },
          ),
        ),
        total,
      };
    },

    async findById(id) {
      const doc = await BagStockModel.findOne({
        _id: new Types.ObjectId(id),
        deletedAt: null,
      }).lean();
      if (!doc) return null;
      return toDto(
        doc as unknown as Record<string, unknown> & {
          _id: Types.ObjectId;
          createdAt?: Date;
          updatedAt?: Date;
        },
      );
    },

    async findByBatchAndType(batchNumber, bagType) {
      const doc = await BagStockModel.findOne({ batchNumber, bagType, deletedAt: null }).lean();
      if (!doc) return null;
      return toDto(
        doc as unknown as Record<string, unknown> & {
          _id: Types.ObjectId;
          createdAt?: Date;
          updatedAt?: Date;
        },
      );
    },

    async findByBatch(batchNumber) {
      const docs = await BagStockModel.find({ batchNumber, deletedAt: null }).lean();
      return docs.map((d) =>
        toDto(
          d as unknown as Record<string, unknown> & {
            _id: Types.ObjectId;
            createdAt?: Date;
            updatedAt?: Date;
          },
        ),
      );
    },

    async summary() {
      const result = await BagStockModel.aggregate<{
        _id: string;
        totalReceived: number;
        totalIssued: number;
        totalDamaged: number;
        totalDiscarded: number;
        totalOpening: number;
      }>([
        { $match: { deletedAt: null } },
        {
          $group: {
            _id: '$bagType',
            totalOpening: { $sum: '$openingStock' },
            totalReceived: { $sum: '$receivedQty' },
            totalIssued: { $sum: '$issuedQty' },
            totalDamaged: { $sum: '$damagedQty' },
            totalDiscarded: { $sum: '$discardedQty' },
          },
        },
      ]);
      return result.map((r) => ({
        bagType: r._id,
        totalClosingStock:
          r.totalOpening + r.totalReceived - r.totalIssued - r.totalDamaged - r.totalDiscarded,
        totalReceived: r.totalReceived,
        totalIssued: r.totalIssued,
        totalDamaged: r.totalDamaged,
        totalDiscarded: r.totalDiscarded,
      }));
    },

    async lowBoxStock(threshold = 3) {
      const docs = await BagStockModel.find({
        deletedAt: null,
        unopenedBoxes: { $lte: threshold },
        status: { $ne: 'EXPIRED' },
      })
        .select('stockId bagType batchNumber unopenedBoxes capacityMl expiryDate')
        .sort({ unopenedBoxes: 1 })
        .lean();
      return docs.map((d) => ({
        stockId: (d._id as Types.ObjectId).toString(),
        bagType: d.bagType as string,
        batchNumber: d.batchNumber as string,
        unopenedBoxes: (d.unopenedBoxes as number) ?? 0,
        capacityMl: d.capacityMl as number,
        expiryDate: (d.expiryDate as Date).toISOString(),
      }));
    },

    async upsertFromGRN(input) {
      const actor = new Types.ObjectId(input.actorId);
      const now = new Date();
      const doc = await BagStockModel.findOneAndUpdate(
        { batchNumber: input.batchNumber, bagType: input.bagType, deletedAt: null },
        {
          $setOnInsert: {
            stockId: input.stockId,
            bagType: input.bagType,
            capacityMl: input.capacityMl,
            anticoagulant: input.anticoagulant,
            manufacturer: input.manufacturer,
            batchNumber: input.batchNumber,
            expiryDate: input.expiryDate,
            grnId: new Types.ObjectId(input.grnId),
            openingStock: 0,
            issuedQty: 0,
            damagedQty: 0,
            discardedQty: 0,
            unopenedBoxes: 0,
            status: 'AVAILABLE',
            createdBy: actor,
          },
          $inc: { receivedQty: input.receivedQty },
          $set: { lastUpdatedAt: now, updatedBy: actor },
        },
        { upsert: true, new: true },
      ).lean();
      return toDto(
        doc as unknown as Record<string, unknown> & {
          _id: Types.ObjectId;
          createdAt?: Date;
          updatedAt?: Date;
        },
      );
    },

    async incrementIssued(id, qty, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await BagStockModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { $inc: { issuedQty: qty }, $set: { lastUpdatedAt: new Date(), updatedBy: actor } },
        { new: true },
      ).lean();
      if (!doc) return null;
      return toDto(
        doc as unknown as Record<string, unknown> & {
          _id: Types.ObjectId;
          createdAt?: Date;
          updatedAt?: Date;
        },
      );
    },

    async decrementIssued(id, qty, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await BagStockModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { $inc: { issuedQty: -qty }, $set: { lastUpdatedAt: new Date(), updatedBy: actor } },
        { new: true },
      ).lean();
      if (!doc) return null;
      return toDto(
        doc as unknown as Record<string, unknown> & {
          _id: Types.ObjectId;
          createdAt?: Date;
          updatedAt?: Date;
        },
      );
    },

    async incrementDamaged(id, qty, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await BagStockModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { $inc: { damagedQty: qty }, $set: { lastUpdatedAt: new Date(), updatedBy: actor } },
        { new: true },
      ).lean();
      if (!doc) return null;
      return toDto(
        doc as unknown as Record<string, unknown> & {
          _id: Types.ObjectId;
          createdAt?: Date;
          updatedAt?: Date;
        },
      );
    },

    async incrementDiscarded(id, qty, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await BagStockModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { $inc: { discardedQty: qty }, $set: { lastUpdatedAt: new Date(), updatedBy: actor } },
        { new: true },
      ).lean();
      if (!doc) return null;
      return toDto(
        doc as unknown as Record<string, unknown> & {
          _id: Types.ObjectId;
          createdAt?: Date;
          updatedAt?: Date;
        },
      );
    },

    async decrementDiscarded(id, qty, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await BagStockModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { $inc: { discardedQty: -qty }, $set: { lastUpdatedAt: new Date(), updatedBy: actor } },
        { new: true },
      ).lean();
      if (!doc) return null;
      return toDto(
        doc as unknown as Record<string, unknown> & {
          _id: Types.ObjectId;
          createdAt?: Date;
          updatedAt?: Date;
        },
      );
    },

    async updateStatus(id, status, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await BagStockModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { $set: { status, lastUpdatedAt: new Date(), updatedBy: actor } },
        { new: true },
      ).lean();
      if (!doc) return null;
      return toDto(
        doc as unknown as Record<string, unknown> & {
          _id: Types.ObjectId;
          createdAt?: Date;
          updatedAt?: Date;
        },
      );
    },

    async setReceivedQtyAndBoxes(batchNumber, bagType, receivedQty, unopenedBoxes, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await BagStockModel.findOneAndUpdate(
        { batchNumber, bagType, deletedAt: null },
        { $set: { receivedQty, unopenedBoxes, lastUpdatedAt: new Date(), updatedBy: actor } },
        { new: true },
      ).lean();
      if (!doc) return null;
      return toDto(
        doc as unknown as Record<string, unknown> & {
          _id: Types.ObjectId;
          createdAt?: Date;
          updatedAt?: Date;
        },
      );
    },

    async openBox(id, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await BagStockModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), unopenedBoxes: { $gt: 0 }, deletedAt: null },
        { $inc: { unopenedBoxes: -1 }, $set: { lastUpdatedAt: new Date(), updatedBy: actor } },
        { new: true },
      ).lean();
      if (!doc) return null;
      return toDto(
        doc as unknown as Record<string, unknown> & {
          _id: Types.ObjectId;
          createdAt?: Date;
          updatedAt?: Date;
        },
      );
    },
  };
}
