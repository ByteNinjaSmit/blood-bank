import { Types } from 'mongoose';
import { BulkTransferModel } from '@/modules/bulk-transfer/bulk-transfer.model';
import { NotFoundError } from '@/shared/errors';
import type { ListBulkTransferInput } from '@/modules/bulk-transfer/bulk-transfer.validator';

export interface BulkTransferItemDto {
  componentType: string;
  bloodGroup: string;
  bagNo: string;
  segmentNo?: string;
  collectedAt?: string;
  expiresAt?: string;
}

export interface BulkTransferDto {
  id: string;
  transferId: string;
  transferType: 'GIVE_LOAN' | 'TAKE_LOAN';
  bloodBankName: string;
  bloodBankAddress: string;
  transferDate: string;
  items: BulkTransferItemDto[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

function toDto(raw: any): BulkTransferDto {
  return {
    id: raw._id.toString(),
    transferId: raw.transferId,
    transferType: raw.transferType,
    bloodBankName: raw.bloodBankName,
    bloodBankAddress: raw.bloodBankAddress,
    transferDate: raw.transferDate ? new Date(raw.transferDate).toISOString() : '',
    items: (raw.items || []).map((it: any) => ({
      componentType: it.componentType,
      bloodGroup: it.bloodGroup,
      bagNo: it.bagNo,
      segmentNo: it.segmentNo || undefined,
      collectedAt: it.collectedAt ? new Date(it.collectedAt).toISOString() : undefined,
      expiresAt: it.expiresAt ? new Date(it.expiresAt).toISOString() : undefined,
    })),
    notes: raw.notes || undefined,
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : '',
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : '',
  };
}

export interface CreateBulkTransferItemInput {
  componentType: string;
  bloodGroup: string;
  bagNo: string;
  segmentNo?: string;
  collectedAt?: Date;
  expiresAt?: Date;
}

export interface CreateBulkTransferInput {
  transferId: string;
  transferType: 'GIVE_LOAN' | 'TAKE_LOAN';
  bloodBankName: string;
  bloodBankAddress: string;
  transferDate: Date;
  items: CreateBulkTransferItemInput[];
  notes?: string;
}

export interface BulkTransferRepo {
  list(f: ListBulkTransferInput): Promise<{ items: BulkTransferDto[]; total: number }>;
  findById(id: string): Promise<BulkTransferDto>;
  create(input: CreateBulkTransferInput, actorId: string): Promise<BulkTransferDto>;
}

export function createBulkTransferRepo(): BulkTransferRepo {
  return {
    async list(f) {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (f.transferType) filter.transferType = f.transferType;
      if (f.search) {
        filter.$or = [
          { transferId: { $regex: f.search, $options: 'i' } },
          { bloodBankName: { $regex: f.search, $options: 'i' } },
        ];
      }

      const skip = (f.page - 1) * f.limit;
      const [docs, total] = await Promise.all([
        BulkTransferModel.find(filter).sort({ transferDate: -1, createdAt: -1 }).skip(skip).limit(f.limit).lean(),
        BulkTransferModel.countDocuments(filter),
      ]);
      return { items: docs.map(toDto), total };
    },

    async findById(id) {
      const raw = await BulkTransferModel.findOne({ _id: id, deletedAt: null }).lean();
      if (!raw) throw new NotFoundError('BulkTransfer', id);
      return toDto(raw);
    },

    async create(input, actorId) {
      const actor = new Types.ObjectId(actorId);
      const doc = await BulkTransferModel.create({
        ...input,
        createdBy: actor,
        updatedBy: actor,
      });
      return toDto(doc.toObject());
    },
  };
}
