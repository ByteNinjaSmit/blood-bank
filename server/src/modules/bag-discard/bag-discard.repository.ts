import { Types } from 'mongoose';
import { BagDiscardModel } from '@/modules/bag-discard/bag-discard.model';
import type { ListBagDiscardInput } from '@/modules/bag-discard/bag-discard.validator';

export interface BagDiscardDto {
  id: string;
  discardId: string;
  discardDate: string;
  stockId: string;
  bagType: string;
  batchNumber: string;
  quantity: number;
  reason: string;
  reasonDetail?: string;
  approvedById?: string;
  approvedAt?: string;
  disposalMethod?: string;
  biomedicalWasteManifestNo?: string;
  disposalDate?: string;
  createdAt: string;
  updatedAt: string;
}

function toDto(
  doc: Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date },
): BagDiscardDto {
  return {
    id: doc._id.toString(),
    discardId: doc.discardId as string,
    discardDate: (doc.discardDate as Date).toISOString(),
    stockId: (doc.stockId as Types.ObjectId).toString(),
    bagType: doc.bagType as string,
    batchNumber: doc.batchNumber as string,
    quantity: doc.quantity as number,
    reason: doc.reason as string,
    reasonDetail: doc.reasonDetail as string | undefined,
    approvedById: doc.approvedById ? (doc.approvedById as Types.ObjectId).toString() : undefined,
    approvedAt: doc.approvedAt ? (doc.approvedAt as Date).toISOString() : undefined,
    disposalMethod: doc.disposalMethod as string | undefined,
    biomedicalWasteManifestNo: doc.biomedicalWasteManifestNo as string | undefined,
    disposalDate: doc.disposalDate ? (doc.disposalDate as Date).toISOString() : undefined,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : '',
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : '',
  };
}

export interface BagDiscardRepo {
  list(q: ListBagDiscardInput): Promise<{ items: BagDiscardDto[]; total: number }>;
  findById(id: string): Promise<BagDiscardDto | null>;
  create(doc: {
    discardId: string;
    discardDate: Date;
    stockId: string;
    bagType: string;
    batchNumber: string;
    quantity: number;
    reason: string;
    reasonDetail?: string;
    actorId: string;
  }): Promise<BagDiscardDto>;
  approve(
    id: string,
    patch: {
      approvedById: string;
      approvedAt: Date;
      disposalMethod?: string;
      biomedicalWasteManifestNo?: string;
      disposalDate?: Date;
    },
    actorId: string,
  ): Promise<BagDiscardDto | null>;
  /** Hard delete — a discard record is a data-entry correction target, not a clinical record; nothing downstream references it. */
  delete(id: string): Promise<void>;
}

export function createBagDiscardRepo(): BagDiscardRepo {
  return {
    async list(q) {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (q.stockId) filter.stockId = new Types.ObjectId(q.stockId);
      if (q.reason) filter.reason = q.reason;
      if (q.fromDate || q.toDate) {
        const range: Record<string, Date> = {};
        if (q.fromDate) range.$gte = q.fromDate;
        if (q.toDate) range.$lte = q.toDate;
        filter.discardDate = range;
      }
      const page = q.page ?? 1;
      const pageSize = q.pageSize ?? 20;
      const skip = (page - 1) * pageSize;
      const [docs, total] = await Promise.all([
        BagDiscardModel.find(filter).sort({ discardDate: -1 }).skip(skip).limit(pageSize).lean(),
        BagDiscardModel.countDocuments(filter),
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
      const doc = await BagDiscardModel.findOne({
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

    async create(input) {
      const actor = new Types.ObjectId(input.actorId);
      const doc = await BagDiscardModel.create({
        discardId: input.discardId,
        discardDate: input.discardDate,
        stockId: new Types.ObjectId(input.stockId),
        bagType: input.bagType,
        batchNumber: input.batchNumber,
        quantity: input.quantity,
        reason: input.reason,
        reasonDetail: input.reasonDetail,
        createdBy: actor,
        updatedBy: actor,
      });
      return toDto(
        doc.toObject() as unknown as Record<string, unknown> & {
          _id: Types.ObjectId;
          createdAt?: Date;
          updatedAt?: Date;
        },
      );
    },

    async approve(id, patch, actorId) {
      const actor = new Types.ObjectId(actorId);
      const update: Record<string, unknown> = {
        approvedById: new Types.ObjectId(patch.approvedById),
        approvedAt: patch.approvedAt,
        updatedBy: actor,
      };
      if (patch.disposalMethod) update.disposalMethod = patch.disposalMethod;
      if (patch.biomedicalWasteManifestNo)
        update.biomedicalWasteManifestNo = patch.biomedicalWasteManifestNo;
      if (patch.disposalDate) update.disposalDate = patch.disposalDate;
      const doc = await BagDiscardModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { $set: update },
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

    async delete(id) {
      await BagDiscardModel.deleteOne({ _id: new Types.ObjectId(id) });
    },
  };
}
