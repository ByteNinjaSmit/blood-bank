import { Types } from 'mongoose';
import { BulkTransferModel } from '@/modules/bulk-transfer/bulk-transfer.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { invalidate } from '@/core/cache';
import type { ListBulkTransferInput } from '@/modules/bulk-transfer/bulk-transfer.validator';

export interface BulkTransferItemDto {
  componentType: string;
  bloodGroup: string;
  bagNo: string;
  segmentNo?: string;
  volumeMl?: number;
  collectedAt?: string;
  expiresAt?: string;
  unitId?: string;
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
      volumeMl: it.volumeMl || undefined,
      collectedAt: it.collectedAt ? new Date(it.collectedAt).toISOString() : undefined,
      expiresAt: it.expiresAt ? new Date(it.expiresAt).toISOString() : undefined,
      unitId: it.unitId ? it.unitId.toString() : undefined,
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
  volumeMl?: number;
  collectedAt?: Date;
  expiresAt?: Date;
  unitId?: string;
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
  remove(id: string, actorId: string): Promise<BulkTransferDto>;
}

// Bags given on loan leave our stock (ISSUED); deleting that transfer puts
// them back (RELEASED). Neither transition goes through the formal
// RESERVED->ISSUE state machine — this mirrors the same direct-status-set
// pattern the legacy /inventory/issue and /inventory/send-to-storage routes
// already use for non-clinical stock movements. Both writes are atomic
// findOneAndUpdate calls guarded on the expected current status, so a bag
// that was concurrently reserved/issued/sent-to-storage elsewhere can never
// be silently clobbered or resurrected into stock.
async function markUnitsIssuedForLoan(unitIds: string[], actorId: string): Promise<void> {
  if (!unitIds.length) return;
  const actor = new Types.ObjectId(actorId);
  const now = new Date();

  // Verify every bag is currently real available stock before mutating any
  // of them — a partial loan (some bags removed, some silently left behind)
  // is worse than rejecting the whole request.
  const releasedCount = await BloodUnitModel.countDocuments({
    _id: { $in: unitIds },
    status: 'RELEASED',
  });
  if (releasedCount !== unitIds.length) {
    throw new ConflictError('One or more selected bags are no longer in stock (already reserved, issued, or on loan). Refresh and try again.');
  }

  for (const id of unitIds) {
    const unit = await BloodUnitModel.findOneAndUpdate(
      { _id: id, status: 'RELEASED' },
      {
        status: 'ISSUED',
        issuedAt: now,
        updatedBy: actor,
        $push: {
          statusHistory: {
            from: 'RELEASED',
            to: 'ISSUED',
            event: 'BULK_TRANSFER_LOAN_GIVEN',
            actor,
            at: now,
            reason: 'Given on loan via bulk transfer',
          },
        },
      },
    );
    if (!unit) {
      throw new ConflictError('One or more selected bags are no longer in stock (already reserved, issued, or on loan). Refresh and try again.');
    }
  }
  await invalidate('inventory:*');
}

async function restoreUnitsFromLoan(unitIds: string[], actorId: string): Promise<void> {
  if (!unitIds.length) return;
  const actor = new Types.ObjectId(actorId);
  const now = new Date();
  for (const id of unitIds) {
    // Only restore bags that are still in the ISSUED-for-loan state this
    // module put them in — never force a bag that has since moved on
    // (discarded, expired, re-issued) back into available stock.
    await BloodUnitModel.findOneAndUpdate(
      { _id: id, status: 'ISSUED' },
      {
        status: 'RELEASED',
        $unset: { issuedAt: 1 },
        updatedBy: actor,
        $push: {
          statusHistory: {
            from: 'ISSUED',
            to: 'RELEASED',
            event: 'BULK_TRANSFER_LOAN_DELETED',
            actor,
            at: now,
            reason: 'Bulk transfer (loan) deleted — bag returned to stock',
          },
        },
      },
    );
  }
  await invalidate('inventory:*');
}

export function createBulkTransferRepo(): BulkTransferRepo {
  return {
    async list(f) {
      const filter: Record<string, any> = { deletedAt: null };
      if (f.transferType) filter.transferType = f.transferType;
      if (f.search) {
        filter.$or = [
          { transferId: { $regex: f.search, $options: 'i' } },
          { bloodBankName: { $regex: f.search, $options: 'i' } },
        ];
      }
      if (f.fromDate || f.toDate) {
        const dateFilter: any = {};
        if (f.fromDate) dateFilter.$gte = f.fromDate;
        if (f.toDate) dateFilter.$lte = f.toDate;
        filter.transferDate = dateFilter;
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

      // Claim the bags (and validate they're still real stock) BEFORE
      // creating the transfer record, so a rejected/partially-failed claim
      // never leaves an orphaned GIVE_LOAN transfer with bags that were
      // never actually removed from stock.
      if (input.transferType === 'GIVE_LOAN') {
        const unitIds = input.items.map((it) => it.unitId).filter(Boolean) as string[];
        await markUnitsIssuedForLoan(unitIds, actorId);
      }

      const doc = await BulkTransferModel.create({
        ...input,
        createdBy: actor,
        updatedBy: actor,
      });

      return toDto(doc.toObject());
    },

    async remove(id, actorId) {
      const raw = await BulkTransferModel.findOne({ _id: id, deletedAt: null });
      if (!raw) throw new NotFoundError('BulkTransfer', id);

      if (raw.transferType === 'GIVE_LOAN') {
        const unitIds = (raw.items || [])
          .map((it: any) => it.unitId)
          .filter(Boolean)
          .map((u: any) => u.toString());
        await restoreUnitsFromLoan(unitIds, actorId);
      }

      raw.deletedAt = new Date();
      raw.updatedBy = new Types.ObjectId(actorId);
      await raw.save();
      return toDto(raw.toObject());
    },
  };
}
