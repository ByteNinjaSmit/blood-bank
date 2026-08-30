import { Types } from 'mongoose';
import { BulkTransferModel } from '@/modules/bulk-transfer/bulk-transfer.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { ConflictError, NotFoundError, ValidationError } from '@/shared/errors';
import { invalidate } from '@/core/cache';
import {
  auditUnitStatusMovement,
  auditUnitCreated,
  auditUnitSoftDelete,
} from '@/shared/utils/audit-unit-movement';
import type {
  ListBulkTransferInput,
  UpdateBulkTransferInput,
} from '@/modules/bulk-transfer/bulk-transfer.validator';

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
  deletedAt?: string | null;
  deleteReason?: string | null;
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
    deletedAt: raw.deletedAt ? new Date(raw.deletedAt).toISOString() : null,
    deleteReason: raw.deleteReason || null,
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
  update(id: string, input: UpdateBulkTransferInput, actorId: string): Promise<BulkTransferDto>;
  remove(id: string, actorId: string, reason?: string): Promise<BulkTransferDto>;
  restore(id: string, actorId: string): Promise<BulkTransferDto>;
}

// Bags given on loan leave our stock (ISSUED); deleting that transfer puts
// them back (RELEASED). Neither transition goes through the formal
// RESERVED->ISSUE state machine — this mirrors the same direct-status-set
// pattern the legacy /inventory/issue and /inventory/send-to-storage routes
// already use for non-clinical stock movements. Both writes are atomic
// findOneAndUpdate calls guarded on the expected current status, so a bag
// that was concurrently reserved/issued/sent-to-storage elsewhere can never
// be silently clobbered or resurrected into stock.
async function markUnitsIssuedForLoan(
  unitIds: string[],
  actorId: string,
  transferId?: string,
): Promise<void> {
  if (!unitIds.length) return;
  const actor = new Types.ObjectId(actorId);
  const now = new Date();
  const suffix = transferId ? ` (transfer ${transferId})` : '';
  const reason = `Given on loan via bulk transfer${suffix}`;

  // Verify every bag is currently real available stock before mutating any
  // of them — a partial loan (some bags removed, some silently left behind)
  // is worse than rejecting the whole request.
  const releasedCount = await BloodUnitModel.countDocuments({
    _id: { $in: unitIds },
    status: 'RELEASED',
  });
  if (releasedCount !== unitIds.length) {
    throw new ConflictError(
      'One or more selected bags are no longer in stock (already reserved, issued, or on loan). Refresh and try again.',
    );
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
            reason,
          },
        },
      },
    );
    if (!unit) {
      throw new ConflictError(
        'One or more selected bags are no longer in stock (already reserved, issued, or on loan). Refresh and try again.',
      );
    }
    auditUnitStatusMovement({
      actorId,
      module: 'bulk-transfer',
      unitId: unit.unitId,
      event: 'BULK_TRANSFER_LOAN_GIVEN',
      from: 'RELEASED',
      to: 'ISSUED',
      reason,
    });
  }
  await invalidate('inventory:*');
}

async function restoreUnitsFromLoan(
  unitIds: string[],
  actorId: string,
  transferId?: string,
): Promise<void> {
  if (!unitIds.length) return;
  const actor = new Types.ObjectId(actorId);
  const now = new Date();
  const suffix = transferId ? ` (transfer ${transferId})` : '';
  const reason = `Bulk transfer (loan) reversed — bag returned to stock${suffix}`;
  for (const id of unitIds) {
    // Only restore bags that are still in the ISSUED-for-loan state this
    // module put them in — never force a bag that has since moved on
    // (discarded, expired, re-issued) back into available stock.
    const unit = await BloodUnitModel.findOneAndUpdate(
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
            reason,
          },
        },
      },
    );
    if (unit) {
      auditUnitStatusMovement({
        actorId,
        module: 'bulk-transfer',
        unitId: unit.unitId,
        event: 'BULK_TRANSFER_LOAN_DELETED',
        from: 'ISSUED',
        to: 'RELEASED',
        reason,
      });
    }
  }
  await invalidate('inventory:*');
}

function parseBloodGroup(bloodGroup: string): { aboGroup: string; rhFactor: string } {
  const bg = (bloodGroup || '').trim();
  const rhFactor = bg.endsWith('-') ? 'NEGATIVE' : 'POSITIVE';
  const aboGroup = bg.replace(/[+-]$/, '');
  return { aboGroup, rhFactor };
}

// TAKE_LOAN bags are borrowed from another blood bank but physically become
// this bank's stock the moment they're logged — so, unlike GIVE_LOAN (which
// only ever references bags this bank already owns), each item here needs a
// brand-new BloodUnit created directly in RELEASED status (no donation/TTI/
// component-separation pipeline — that already happened at the lending
// bank). Mutates each item in place, setting unitId, so the caller can
// persist the same items array with the new unit already linked.
// Exported for scripts/backfill-take-loan-units.ts, which runs this same
// logic against TAKE_LOAN transfers recorded before units were created on
// intake.
export async function createUnitsForTakeLoan(
  items: CreateBulkTransferItemInput[],
  ctx: { transferId: string; bloodBankName: string; transferDate: Date; actorId: string },
): Promise<void> {
  if (!items.length) return;
  const actor = new Types.ObjectId(ctx.actorId);
  const now = new Date();

  for (const item of items) {
    if (!item.expiresAt) {
      throw new ValidationError('Every taken-in bag needs an expiry date');
    }
    const { aboGroup, rhFactor } = parseBloodGroup(item.bloodGroup);
    const unit = await BloodUnitModel.create({
      unitId: `LOAN-${ctx.transferId}-${item.bagNo}`,
      donationId: `LOAN-${ctx.transferId}`,
      componentType: item.componentType,
      aboGroup,
      rhFactor,
      volumeMl: item.volumeMl || 350,
      collectedAt: item.collectedAt || ctx.transferDate,
      expiresAt: item.expiresAt,
      status: 'RELEASED',
      statusHistory: [
        {
          to: 'RELEASED',
          event: 'BULK_TRANSFER_LOAN_TAKEN',
          actor,
          at: now,
          reason: `Taken on loan from ${ctx.bloodBankName}`,
        },
      ],
      loanedFrom: {
        transferId: ctx.transferId,
        bloodBankName: ctx.bloodBankName,
        bagNo: item.bagNo,
        segmentNo: item.segmentNo,
      },
      createdBy: actor,
      updatedBy: actor,
    } as any);
    item.unitId = (unit._id as Types.ObjectId).toString();
    auditUnitCreated({
      actorId: ctx.actorId,
      module: 'bulk-transfer',
      unitId: unit.unitId,
      event: 'BULK_TRANSFER_LOAN_TAKEN',
      status: 'RELEASED',
      reason: `Taken on loan from ${ctx.bloodBankName} (transfer ${ctx.transferId})`,
    });
  }
  await invalidate('inventory:*');
}

// Deleting a TAKE_LOAN transfer must pull its bags back out of stock;
// restoring must put them back — but only while they're still sitting
// untouched (RELEASED, never matched/issued/sent to storage), exactly
// mirroring markUnitsIssuedForLoan/restoreUnitsFromLoan's guarantees below
// for GIVE_LOAN, just soft-deleting the unit instead of flipping status.
async function retireUnitsFromTakeLoan(
  unitIds: string[],
  actorId: string,
  transferId?: string,
): Promise<void> {
  if (!unitIds.length) return;
  const actor = new Types.ObjectId(actorId);
  const now = new Date();
  const suffix = transferId ? ` (transfer ${transferId})` : '';
  const reason = `Bulk transfer (loan taken) deleted — bag removed from stock${suffix}`;

  const releasedCount = await BloodUnitModel.countDocuments({
    _id: { $in: unitIds },
    status: 'RELEASED',
    deletedAt: null,
  });
  if (releasedCount !== unitIds.length) {
    throw new ConflictError(
      'One or more taken-in bags have already been reserved, issued, or sent to storage. Refresh and try again.',
    );
  }

  for (const id of unitIds) {
    const unit = await BloodUnitModel.findOneAndUpdate(
      { _id: id, status: 'RELEASED', deletedAt: null },
      {
        deletedAt: now,
        deletedBy: actor,
        updatedBy: actor,
        $push: {
          statusHistory: {
            from: 'RELEASED',
            to: 'RELEASED',
            event: 'BULK_TRANSFER_LOAN_TAKEN_DELETED',
            actor,
            at: now,
            reason,
          },
        },
      },
    );
    if (!unit) {
      throw new ConflictError(
        'One or more taken-in bags have already been reserved, issued, or sent to storage. Refresh and try again.',
      );
    }
    auditUnitSoftDelete({
      actorId,
      module: 'bulk-transfer',
      unitId: unit.unitId,
      event: 'BULK_TRANSFER_LOAN_TAKEN_DELETED',
      action: 'DELETE',
      deleted: true,
      reason,
    });
  }
  await invalidate('inventory:*');
}

async function reinstateUnitsFromTakeLoan(
  unitIds: string[],
  actorId: string,
  transferId?: string,
): Promise<void> {
  if (!unitIds.length) return;
  const actor = new Types.ObjectId(actorId);
  const now = new Date();
  const suffix = transferId ? ` (transfer ${transferId})` : '';
  const reason = `Bulk transfer (loan taken) restored — bag returned to stock${suffix}`;
  for (const id of unitIds) {
    // Only reinstate bags still soft-deleted from this module's own retire()
    // call — never resurrect one that moved on some other way since.
    const unit = await BloodUnitModel.findOneAndUpdate(
      { _id: id, status: 'RELEASED', deletedAt: { $ne: null } },
      {
        deletedAt: null,
        deletedBy: null,
        updatedBy: actor,
        $push: {
          statusHistory: {
            from: 'RELEASED',
            to: 'RELEASED',
            event: 'BULK_TRANSFER_LOAN_TAKEN_RESTORED',
            actor,
            at: now,
            reason,
          },
        },
      },
    );
    if (unit) {
      auditUnitSoftDelete({
        actorId,
        module: 'bulk-transfer',
        unitId: unit.unitId,
        event: 'BULK_TRANSFER_LOAN_TAKEN_RESTORED',
        action: 'UPDATE',
        deleted: false,
        reason,
      });
    }
  }
  await invalidate('inventory:*');
}

export function createBulkTransferRepo(): BulkTransferRepo {
  return {
    async list(f) {
      const filter: Record<string, any> = { deletedAt: f.deletedOnly ? { $ne: null } : null };
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
        BulkTransferModel.find(filter)
          .sort({ transferDate: -1, createdAt: -1 })
          .skip(skip)
          .limit(f.limit)
          .lean(),
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
        await markUnitsIssuedForLoan(unitIds, actorId, input.transferId);
      } else {
        await createUnitsForTakeLoan(input.items, {
          transferId: input.transferId,
          bloodBankName: input.bloodBankName,
          transferDate: input.transferDate,
          actorId,
        });
      }

      const doc = await BulkTransferModel.create({
        ...input,
        createdBy: actor,
        updatedBy: actor,
      });

      return toDto(doc.toObject());
    },

    async update(id, input, actorId) {
      const raw = await BulkTransferModel.findOne({ _id: id, deletedAt: null });
      if (!raw) throw new NotFoundError('BulkTransfer', id);

      // GIVE_LOAN items are tied to real BloodUnits taken out of stock —
      // reconcile the diff before persisting so a bag dropped from the
      // transfer goes back to stock, and a bag newly added is re-validated
      // as available before it's claimed.
      if (input.items && raw.transferType === 'GIVE_LOAN') {
        const oldUnitIds = new Set(
          (raw.items || [])
            .map((it: any) => it.unitId)
            .filter(Boolean)
            .map((u: any) => u.toString()),
        );
        const newUnitIds = new Set(input.items.map((it) => it.unitId).filter(Boolean) as string[]);
        const addedUnitIds = [...newUnitIds].filter((u) => !oldUnitIds.has(u));
        const removedUnitIds = [...oldUnitIds].filter((u) => !newUnitIds.has(u));

        // Claim newly-added bags first (fails fast, nothing committed yet)
        // before restoring removed bags, mirroring create()'s claim-before-write order.
        await markUnitsIssuedForLoan(addedUnitIds, actorId, raw.transferId);
        await restoreUnitsFromLoan(removedUnitIds, actorId, raw.transferId);
      }

      // TAKE_LOAN items each own a real BloodUnit created on intake (see
      // createUnitsForTakeLoan) — reconcile by bagNo (the client form never
      // round-trips unitId for these) so an edited row keeps its existing
      // unit, a removed row retires its unit, and a newly added row gets a
      // fresh one.
      if (input.items && raw.transferType === 'TAKE_LOAN') {
        const oldByBagNo = new Map((raw.items || []).map((it: any) => [it.bagNo, it]));
        const newBagNos = new Set(input.items.map((it) => it.bagNo));
        const removedUnitIds = (raw.items || [])
          .filter((it: any) => !newBagNos.has(it.bagNo))
          .map((it: any) => it.unitId)
          .filter(Boolean)
          .map((u: any) => u.toString());

        const toCreate: CreateBulkTransferItemInput[] = [];
        for (const item of input.items) {
          const old = oldByBagNo.get(item.bagNo);
          if (!old || !old.unitId) {
            toCreate.push(item);
            continue;
          }
          if (!item.expiresAt) {
            throw new ValidationError('Every taken-in bag needs an expiry date');
          }
          const { aboGroup, rhFactor } = parseBloodGroup(item.bloodGroup);
          const updated = await BloodUnitModel.findOneAndUpdate(
            { _id: old.unitId, status: 'RELEASED', deletedAt: null },
            {
              componentType: item.componentType,
              aboGroup,
              rhFactor,
              volumeMl: item.volumeMl || 350,
              collectedAt: item.collectedAt || raw.transferDate,
              expiresAt: item.expiresAt,
              'loanedFrom.segmentNo': item.segmentNo,
              updatedBy: new Types.ObjectId(actorId),
            },
          );
          if (!updated) {
            throw new ConflictError(
              `Bag ${item.bagNo} has already been reserved, issued, or sent to storage and can no longer be edited here.`,
            );
          }
          item.unitId = old.unitId.toString();
        }

        // Create newly-added rows first (fails fast, nothing committed yet)
        // before retiring removed rows, mirroring the GIVE_LOAN order above.
        await createUnitsForTakeLoan(toCreate, {
          transferId: raw.transferId,
          bloodBankName: input.bloodBankName ?? raw.bloodBankName,
          transferDate: input.transferDate ?? raw.transferDate,
          actorId,
        });
        await retireUnitsFromTakeLoan(removedUnitIds, actorId, raw.transferId);
      }

      if (input.bloodBankName !== undefined) raw.bloodBankName = input.bloodBankName;
      if (input.bloodBankAddress !== undefined) raw.bloodBankAddress = input.bloodBankAddress;
      if (input.transferDate !== undefined) raw.transferDate = input.transferDate;
      if (input.notes !== undefined) raw.notes = input.notes;
      if (input.items !== undefined) raw.items = input.items as any;
      raw.updatedBy = new Types.ObjectId(actorId);
      await raw.save();
      return toDto(raw.toObject());
    },

    async remove(id, actorId, reason) {
      const raw = await BulkTransferModel.findOne({ _id: id, deletedAt: null });
      if (!raw) throw new NotFoundError('BulkTransfer', id);

      const unitIds = (raw.items || [])
        .map((it: any) => it.unitId)
        .filter(Boolean)
        .map((u: any) => u.toString());
      if (raw.transferType === 'GIVE_LOAN') {
        await restoreUnitsFromLoan(unitIds, actorId, raw.transferId);
      } else {
        await retireUnitsFromTakeLoan(unitIds, actorId, raw.transferId);
      }

      raw.deletedAt = new Date();
      (raw as any).deleteReason = reason ?? null;
      raw.updatedBy = new Types.ObjectId(actorId);
      await raw.save();
      return toDto(raw.toObject());
    },

    async restore(id, actorId) {
      const raw = await BulkTransferModel.findOne({ _id: id });
      if (!raw || !raw.deletedAt) throw new NotFoundError('BulkTransfer', id);

      // Bags must still be sitting untouched (unclaimed in stock for
      // GIVE_LOAN, soft-deleted-by-us for TAKE_LOAN) — if any moved on
      // (issued, reserved, discarded...) since this transfer was deleted,
      // the reclaim rejects the whole restore rather than silently dropping
      // bags from the recovered transfer.
      const unitIds = (raw.items || [])
        .map((it: any) => it.unitId)
        .filter(Boolean)
        .map((u: any) => u.toString());
      if (raw.transferType === 'GIVE_LOAN') {
        await markUnitsIssuedForLoan(unitIds, actorId, raw.transferId);
      } else {
        await reinstateUnitsFromTakeLoan(unitIds, actorId, raw.transferId);
      }

      (raw as any).deletedAt = null;
      raw.updatedBy = new Types.ObjectId(actorId);
      await raw.save();
      return toDto(raw.toObject());
    },
  };
}
