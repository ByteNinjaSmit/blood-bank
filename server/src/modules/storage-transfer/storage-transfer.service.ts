import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { withAudit } from '@/shared/utils/with-audit';
import type {
  StorageTransferRepo,
  StorageTransferDto,
} from '@/modules/storage-transfer/storage-transfer.repository';
import type {
  CreateStorageTransferInput,
  ListStorageTransferInput,
  UpdateStorageTransferInput,
} from '@/modules/storage-transfer/storage-transfer.validator';

export interface StorageTransferService {
  list(
    f: ListStorageTransferInput,
  ): Promise<{ items: StorageTransferDto[]; total: number; page: number; limit: number }>;
  get(id: string): Promise<StorageTransferDto>;
  create(input: CreateStorageTransferInput, actorId: string): Promise<StorageTransferDto>;
  update(
    id: string,
    input: UpdateStorageTransferInput,
    actorId: string,
    reason?: string,
  ): Promise<StorageTransferDto>;
  remove(id: string, actorId: string, reason?: string): Promise<StorageTransferDto>;
  restore(id: string, actorId: string): Promise<StorageTransferDto>;
}

function generateTransferId(): string {
  const now = new Date();
  const yyyymmdd = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
  const rand = new Types.ObjectId().toHexString().slice(-6).toUpperCase();
  return `ST-${yyyymmdd}-${rand}`;
}

export function createStorageTransferService(deps: {
  storageTransfers: StorageTransferRepo;
}): StorageTransferService {
  const log = childLogger({ module: 'storage-transfer-service' });

  return {
    async list(f) {
      const { items, total } = await deps.storageTransfers.list(f);
      return { items, total, page: f.page, limit: f.limit };
    },

    async get(id) {
      return deps.storageTransfers.findById(id);
    },

    async create(input, actorId) {
      const transferId = generateTransferId();
      const created = await deps.storageTransfers.create({ ...input, transferId }, actorId);
      log.info(
        { transferId: created.transferId, items: input.items.length, actorId },
        'storage transfer created',
      );
      void withAudit(
        { actorId },
        {
          module: 'storage-transfer',
          action: 'CREATE',
          entityType: 'StorageTransfer',
          entityId: created.id,
          entityLabel: created.transferId,
        },
        undefined,
        {
          location: created.location,
          sentDate: created.sentDate,
          itemCount: created.items.length,
          items: created.items,
        },
      );
      return created;
    },

    async update(id, input, actorId, reason) {
      const before = await deps.storageTransfers.findById(id);
      const updated = await deps.storageTransfers.update(id, input, actorId);
      log.info({ transferId: updated.transferId, actorId }, 'storage transfer updated');
      void withAudit(
        { actorId },
        {
          module: 'storage-transfer',
          action: 'UPDATE',
          entityType: 'StorageTransfer',
          entityId: id,
          entityLabel: before.transferId,
          reason,
        },
        before,
        updated,
      );
      return updated;
    },

    async remove(id, actorId, reason) {
      const removed = await deps.storageTransfers.remove(id, actorId);
      log.info({ transferId: removed.transferId, actorId }, 'storage transfer deleted');
      void withAudit(
        { actorId },
        {
          module: 'storage-transfer',
          action: 'DELETE',
          entityType: 'StorageTransfer',
          entityId: id,
          entityLabel: removed.transferId,
          severity: 'warning',
          reason,
        },
        removed,
        undefined,
      );
      return removed;
    },

    async restore(id, actorId) {
      const restored = await deps.storageTransfers.restore(id, actorId);
      log.info({ transferId: restored.transferId, actorId }, 'storage transfer restored');
      void withAudit(
        { actorId },
        {
          module: 'storage-transfer',
          action: 'UPDATE',
          entityType: 'StorageTransfer',
          entityId: id,
          entityLabel: restored.transferId,
        },
        { deletedAt: true },
        { deletedAt: null },
      );
      return restored;
    },
  };
}
