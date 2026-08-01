import { Types } from 'mongoose';
import { StorageTransferModel } from '@/modules/storage-transfer/storage-transfer.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { NotFoundError } from '@/shared/errors';
import {
  assertUnitsAvailable,
  claimUnitsForStorage,
  releaseUnitsFromStorage,
} from '@/modules/storage-transfer/storage-transfer.units';
import type {
  ListStorageTransferInput,
  UpdateStorageTransferInput,
} from '@/modules/storage-transfer/storage-transfer.validator';

export interface StorageTransferItemDto {
  unitId: string;
  bagNo: string;
  componentType: string;
  bloodGroup: string;
  rhFactor?: string;
  segmentNo?: string;
  volumeMl?: number;
  expiresAt?: string;
}

export interface StorageTransferDto {
  id: string;
  transferId: string;
  location: string;
  otherLocationName?: string;
  sentDate: string;
  items: StorageTransferItemDto[];
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

function toDto(raw: any): StorageTransferDto {
  return {
    id: raw._id.toString(),
    transferId: raw.transferId,
    location: raw.location,
    otherLocationName: raw.otherLocationName || undefined,
    sentDate: raw.sentDate ? new Date(raw.sentDate).toISOString() : '',
    items: (raw.items || []).map((it: any) => ({
      unitId: it.unitId.toString(),
      bagNo: it.bagNo,
      componentType: it.componentType,
      bloodGroup: it.bloodGroup,
      rhFactor: it.rhFactor || undefined,
      segmentNo: it.segmentNo || undefined,
      volumeMl: it.volumeMl || undefined,
      expiresAt: it.expiresAt ? new Date(it.expiresAt).toISOString() : undefined,
    })),
    deletedAt: raw.deletedAt ? new Date(raw.deletedAt).toISOString() : undefined,
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : '',
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : '',
  };
}

export interface CreateStorageTransferItemInput {
  unitId: string;
  bagNo: string;
  componentType: string;
  bloodGroup: string;
  rhFactor?: string;
  segmentNo?: string;
  volumeMl?: number;
  expiresAt?: Date;
}

export interface CreateStorageTransferInput {
  transferId: string;
  location: string;
  otherLocationName?: string;
  sentDate: Date;
  items: CreateStorageTransferItemInput[];
}

export interface StorageTransferRepo {
  list(f: ListStorageTransferInput): Promise<{ items: StorageTransferDto[]; total: number }>;
  findById(id: string): Promise<StorageTransferDto>;
  create(input: CreateStorageTransferInput, actorId: string): Promise<StorageTransferDto>;
  update(
    id: string,
    input: UpdateStorageTransferInput,
    actorId: string,
  ): Promise<StorageTransferDto>;
  remove(id: string, actorId: string): Promise<StorageTransferDto>;
  restore(id: string, actorId: string): Promise<StorageTransferDto>;
}

function finalLocation(location: string, otherLocationName?: string | null): string {
  return location === 'Others' ? otherLocationName || location : location;
}

export function createStorageTransferRepo(): StorageTransferRepo {
  return {
    async list(f) {
      const filter: Record<string, any> = { deletedAt: f.deletedOnly ? { $ne: null } : null };
      if (f.location) filter.location = f.location;
      if (f.search) {
        filter.$or = [
          { transferId: { $regex: f.search, $options: 'i' } },
          { location: { $regex: f.search, $options: 'i' } },
        ];
      }
      const skip = (f.page - 1) * f.limit;
      const [docs, total] = await Promise.all([
        StorageTransferModel.find(filter)
          .sort({ sentDate: -1, createdAt: -1 })
          .skip(skip)
          .limit(f.limit)
          .lean(),
        StorageTransferModel.countDocuments(filter),
      ]);
      return { items: docs.map(toDto), total };
    },

    async findById(id) {
      const raw = await StorageTransferModel.findOne({ _id: id }).lean();
      if (!raw) throw new NotFoundError('StorageTransfer', id);
      return toDto(raw);
    },

    async create(input, actorId) {
      const actor = new Types.ObjectId(actorId);
      const unitIds = input.items.map((it) => it.unitId);
      const location = finalLocation(input.location, input.otherLocationName);

      // Claim the bags before creating the record — a rejected claim must
      // never leave an orphaned transfer whose bags were never actually
      // moved into storage.
      await claimUnitsForStorage(unitIds, location, input.sentDate, actorId, 'SEND_TO_STORAGE');

      const doc = await StorageTransferModel.create({
        ...input,
        createdBy: actor,
        updatedBy: actor,
      });
      return toDto(doc.toObject());
    },

    async update(id, input, actorId) {
      const raw = await StorageTransferModel.findOne({ _id: id, deletedAt: null });
      if (!raw) throw new NotFoundError('StorageTransfer', id);

      const newLocation =
        input.location !== undefined
          ? finalLocation(input.location, input.otherLocationName)
          : finalLocation(raw.location, raw.otherLocationName);

      if (input.items) {
        const oldUnitIds = new Set((raw.items || []).map((it: any) => it.unitId.toString()));
        const newUnitIds = new Set(input.items.map((it) => it.unitId));
        const addedUnitIds = [...newUnitIds].filter((u) => !oldUnitIds.has(u));
        const removedUnitIds = [...oldUnitIds].filter((u) => !newUnitIds.has(u));
        const keptUnitIds = [...newUnitIds].filter((u) => oldUnitIds.has(u));

        // Claim newly-added bags first (fails fast, nothing committed) —
        // same claim-before-write order as bulk-transfer's update().
        await claimUnitsForStorage(
          addedUnitIds,
          newLocation,
          input.sentDate ?? raw.sentDate,
          actorId,
          'SEND_TO_STORAGE',
        );
        await releaseUnitsFromStorage(removedUnitIds, actorId, 'STORAGE_TRANSFER_UPDATED');

        // Bags that stayed in the batch: re-point their storageLocation if
        // the location changed.
        if (
          newLocation !== finalLocation(raw.location, raw.otherLocationName) &&
          keptUnitIds.length > 0
        ) {
          await BloodUnitModel.updateMany(
            { _id: { $in: keptUnitIds }, status: 'ISSUED' },
            { storageLocation: newLocation, updatedBy: new Types.ObjectId(actorId) },
          );
        }

        raw.items = input.items as any;
      } else if (newLocation !== finalLocation(raw.location, raw.otherLocationName)) {
        const unitIds = (raw.items || []).map((it: any) => it.unitId.toString());
        await BloodUnitModel.updateMany(
          { _id: { $in: unitIds }, status: 'ISSUED' },
          { storageLocation: newLocation, updatedBy: new Types.ObjectId(actorId) },
        );
      }

      if (input.location !== undefined) raw.location = input.location;
      if (input.otherLocationName !== undefined) raw.otherLocationName = input.otherLocationName;
      if (input.sentDate !== undefined) raw.sentDate = input.sentDate;
      raw.updatedBy = new Types.ObjectId(actorId);
      await raw.save();
      return toDto(raw.toObject());
    },

    async remove(id, actorId) {
      const raw = await StorageTransferModel.findOne({ _id: id, deletedAt: null });
      if (!raw) throw new NotFoundError('StorageTransfer', id);

      const unitIds = (raw.items || []).map((it: any) => it.unitId.toString());
      await releaseUnitsFromStorage(unitIds, actorId, 'STORAGE_TRANSFER_DELETED');

      raw.deletedAt = new Date();
      raw.updatedBy = new Types.ObjectId(actorId);
      await raw.save();
      return toDto(raw.toObject());
    },

    async restore(id, actorId) {
      const raw = await StorageTransferModel.findOne({ _id: id });
      if (!raw || !raw.deletedAt) throw new NotFoundError('StorageTransfer', id);

      const unitIds = (raw.items || []).map((it: any) => it.unitId.toString());
      // Every bag must still be sitting unclaimed in stock — if any of
      // them moved on (issued, reserved, discarded...) since this batch
      // was deleted, the whole restore is refused rather than silently
      // dropping bags from the recovered batch.
      await assertUnitsAvailable(unitIds);
      await claimUnitsForStorage(
        unitIds,
        finalLocation(raw.location, raw.otherLocationName),
        raw.sentDate,
        actorId,
        'STORAGE_TRANSFER_RESTORED',
      );

      (raw as any).deletedAt = null;
      raw.updatedBy = new Types.ObjectId(actorId);
      await raw.save();
      return toDto(raw.toObject());
    },
  };
}
