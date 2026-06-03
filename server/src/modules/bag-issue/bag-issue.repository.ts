import { Types } from 'mongoose';
import { BagIssueModel } from '@/modules/bag-issue/bag-issue.model';
import type { ListBagIssueInput } from '@/modules/bag-issue/bag-issue.validator';

export interface BagIssueDto {
  id: string;
  issueNumber: string;
  issueDate: string;
  stockId: string;
  bagSerialNumber: string;
  bagType: string;
  batchNumber: string;
  issuedById: string;
  collectionRoom?: string;
  donorId?: string;
  donationId?: string;
  status: string;
  returnedAt?: string;
  usedAt?: string;
  damagedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

function toDto(doc: Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date }): BagIssueDto {
  return {
    id: doc._id.toString(),
    issueNumber: doc.issueNumber as string,
    issueDate: (doc.issueDate as Date).toISOString(),
    stockId: (doc.stockId as Types.ObjectId).toString(),
    bagSerialNumber: doc.bagSerialNumber as string,
    bagType: doc.bagType as string,
    batchNumber: doc.batchNumber as string,
    issuedById: (doc.issuedById as Types.ObjectId).toString(),
    collectionRoom: doc.collectionRoom as string | undefined,
    donorId: doc.donorId ? (doc.donorId as Types.ObjectId).toString() : undefined,
    donationId: doc.donationId ? (doc.donationId as Types.ObjectId).toString() : undefined,
    status: doc.status as string,
    returnedAt: doc.returnedAt ? (doc.returnedAt as Date).toISOString() : undefined,
    usedAt: doc.usedAt ? (doc.usedAt as Date).toISOString() : undefined,
    damagedAt: doc.damagedAt ? (doc.damagedAt as Date).toISOString() : undefined,
    notes: doc.notes as string | undefined,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : '',
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : '',
  };
}

export interface BagIssueRepo {
  list(q: ListBagIssueInput): Promise<{ items: BagIssueDto[]; total: number }>;
  findById(id: string): Promise<BagIssueDto | null>;
  create(doc: {
    issueNumber: string;
    issueDate: Date;
    stockId: string;
    bagSerialNumber: string;
    bagType: string;
    batchNumber: string;
    issuedById: string;
    collectionRoom?: string;
    notes?: string;
    actorId: string;
  }): Promise<BagIssueDto>;
  updateStatus(id: string, patch: {
    status: string;
    donorId?: string;
    donationId?: string;
    returnedAt?: Date;
    usedAt?: Date;
    damagedAt?: Date;
  }, actorId: string): Promise<BagIssueDto | null>;
}

export function createBagIssueRepo(): BagIssueRepo {
  return {
    async list(q) {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (q.status) filter.status = q.status;
      if (q.stockId) filter.stockId = new Types.ObjectId(q.stockId);
      if (q.donorId) filter.donorId = new Types.ObjectId(q.donorId);
      if (q.fromDate) filter.issueDate = { $gte: q.fromDate };
      const page = q.page ?? 1;
      const pageSize = q.pageSize ?? 20;
      const skip = (page - 1) * pageSize;
      const [docs, total] = await Promise.all([
        BagIssueModel.find(filter).sort({ issueDate: -1 }).skip(skip).limit(pageSize).lean(),
        BagIssueModel.countDocuments(filter),
      ]);
      return { items: docs.map((d) => toDto(d as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date })), total };
    },

    async findById(id) {
      const doc = await BagIssueModel.findOne({ _id: new Types.ObjectId(id), deletedAt: null }).lean();
      if (!doc) return null;
      return toDto(doc as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date });
    },

    async create(input) {
      const actor = new Types.ObjectId(input.actorId);
      const doc = await BagIssueModel.create({
        issueNumber: input.issueNumber,
        issueDate: input.issueDate,
        stockId: new Types.ObjectId(input.stockId),
        bagSerialNumber: input.bagSerialNumber,
        bagType: input.bagType,
        batchNumber: input.batchNumber,
        issuedById: new Types.ObjectId(input.issuedById),
        collectionRoom: input.collectionRoom,
        notes: input.notes,
        status: 'ISSUED',
        createdBy: actor,
        updatedBy: actor,
      });
      return toDto(doc.toObject() as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date });
    },

    async updateStatus(id, patch, actorId) {
      const actor = new Types.ObjectId(actorId);
      const update: Record<string, unknown> = { status: patch.status, updatedBy: actor };
      if (patch.donorId) update.donorId = new Types.ObjectId(patch.donorId);
      if (patch.donationId) update.donationId = new Types.ObjectId(patch.donationId);
      if (patch.returnedAt) update.returnedAt = patch.returnedAt;
      if (patch.usedAt) update.usedAt = patch.usedAt;
      if (patch.damagedAt) update.damagedAt = patch.damagedAt;
      const doc = await BagIssueModel.findOneAndUpdate(
        { _id: new Types.ObjectId(id), deletedAt: null },
        { $set: update },
        { new: true },
      ).lean();
      if (!doc) return null;
      return toDto(doc as unknown as Record<string, unknown> & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date });
    },
  };
}
