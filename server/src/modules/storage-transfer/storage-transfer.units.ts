// BloodUnit status transitions backing a storage transfer. Split out of
// the repository so storage-transfer.repository.ts stays focused on
// StorageTransfer CRUD orchestration, not unit-mutation mechanics.
import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { ConflictError } from '@/shared/errors';
import { invalidate } from '@/core/cache';

const log = childLogger({ module: 'storage-transfer-units' });

const UNAVAILABLE_MESSAGE =
  'One or more bags in this batch are no longer available (already reserved, issued, or moved elsewhere). Refresh and try again.';

const RETURN_FAILED_MESSAGE =
  'One or more bags in this batch could not be returned to stock (their status changed since they were sent to storage). Contact an admin before retrying.';

// Cache invalidation is best-effort — a Redis blip must never unwind a
// unit/transfer mutation that has already been committed to Mongo.
async function invalidateInventoryCache(): Promise<void> {
  try {
    await invalidate('inventory:*');
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'inventory cache invalidation failed');
  }
}

/** Every id must currently be RELEASED, or the whole claim is rejected. */
export async function assertUnitsAvailable(unitIds: string[]): Promise<void> {
  if (!unitIds.length) return;
  const releasedCount = await BloodUnitModel.countDocuments({ _id: { $in: unitIds }, status: 'RELEASED' });
  if (releasedCount !== unitIds.length) {
    throw new ConflictError(UNAVAILABLE_MESSAGE);
  }
}

/** Claim RELEASED units into storage (ISSUED + storageLocation). */
export async function claimUnitsForStorage(
  unitIds: string[],
  location: string,
  sentDate: Date,
  actorId: string,
  event: 'SEND_TO_STORAGE' | 'STORAGE_TRANSFER_RESTORED',
): Promise<void> {
  if (!unitIds.length) return;
  await assertUnitsAvailable(unitIds);

  const actor = new Types.ObjectId(actorId);
  for (const id of unitIds) {
    const unit = await BloodUnitModel.findOneAndUpdate(
      { _id: id, status: 'RELEASED' },
      {
        status: 'ISSUED',
        issuedAt: sentDate,
        storageLocation: location,
        clinicalIndicationPatient: null,
        updatedBy: actor,
        $push: {
          statusHistory: {
            from: 'RELEASED',
            to: 'ISSUED',
            event,
            actor,
            at: new Date(),
            reason: `Sent to storage at ${location}`,
          },
        },
      },
    );
    if (!unit) throw new ConflictError(UNAVAILABLE_MESSAGE);
  }
  await invalidateInventoryCache();
}

/**
 * Return ISSUED-for-storage units back to available stock (RELEASED).
 * Every id must currently be ISSUED, or the whole release is rejected —
 * mirrors claimUnitsForStorage's all-or-nothing guard. Silently skipping
 * a bag that failed to match would let a batch get marked deleted while
 * one of its bags stays stuck out of stock with no error surfaced.
 */
export async function releaseUnitsFromStorage(
  unitIds: string[],
  actorId: string,
  event: 'STORAGE_TRANSFER_DELETED' | 'STORAGE_TRANSFER_UPDATED',
): Promise<void> {
  if (!unitIds.length) return;
  const actor = new Types.ObjectId(actorId);
  const now = new Date();
  for (const id of unitIds) {
    const unit = await BloodUnitModel.findOneAndUpdate(
      { _id: id, status: 'ISSUED' },
      {
        status: 'RELEASED',
        storageLocation: null,
        $unset: { issuedAt: 1 },
        updatedBy: actor,
        $push: {
          statusHistory: {
            from: 'ISSUED',
            to: 'RELEASED',
            event,
            actor,
            at: now,
            reason: 'Storage transfer batch deleted — bag returned to stock',
          },
        },
      },
    );
    if (!unit) throw new ConflictError(RETURN_FAILED_MESSAGE);
  }
  await invalidateInventoryCache();
}
