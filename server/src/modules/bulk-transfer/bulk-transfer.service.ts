import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { withAudit } from '@/shared/utils/with-audit';
import type {
  BulkTransferRepo,
  BulkTransferDto,
} from '@/modules/bulk-transfer/bulk-transfer.repository';
import type {
  CreateBulkTransferInput,
  ListBulkTransferInput,
  UpdateBulkTransferInput,
} from '@/modules/bulk-transfer/bulk-transfer.validator';

export interface BulkTransferService {
  list(
    f: ListBulkTransferInput,
  ): Promise<{ items: BulkTransferDto[]; total: number; page: number; limit: number }>;
  get(id: string): Promise<BulkTransferDto>;
  create(input: CreateBulkTransferInput, actorId: string): Promise<BulkTransferDto>;
  update(
    id: string,
    input: UpdateBulkTransferInput,
    actorId: string,
    reason?: string,
  ): Promise<BulkTransferDto>;
  remove(id: string, actorId: string, reason?: string): Promise<BulkTransferDto>;
  restore(id: string, actorId: string): Promise<BulkTransferDto>;
}

function generateTransferId(): string {
  const now = new Date();
  const yyyymmdd = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
  const rand = new Types.ObjectId().toHexString().slice(-6).toUpperCase();
  return `BT-${yyyymmdd}-${rand}`;
}

export function createBulkTransferService(deps: {
  bulkTransfers: BulkTransferRepo;
}): BulkTransferService {
  const log = childLogger({ module: 'bulk-transfer-service' });

  return {
    async list(f) {
      const { items, total } = await deps.bulkTransfers.list(f);
      return { items, total, page: f.page, limit: f.limit };
    },

    async get(id) {
      return deps.bulkTransfers.findById(id);
    },

    async create(input, actorId) {
      const transferId = generateTransferId();
      const created = await deps.bulkTransfers.create({ ...input, transferId }, actorId);
      log.info(
        { transferId, transferType: input.transferType, items: input.items.length, actorId },
        'bulk transfer recorded',
      );
      void withAudit(
        { actorId },
        {
          module: 'bulk-transfer',
          action: 'CREATE',
          entityType: 'BulkTransfer',
          entityId: created.id,
          entityLabel: transferId,
        },
        undefined,
        {
          transferId,
          transferType: input.transferType,
          bloodBankName: input.bloodBankName,
          itemCount: input.items.length,
          items: input.items.map((i) => ({
            componentType: i.componentType,
            bloodGroup: i.bloodGroup,
            bagNo: i.bagNo,
            unitId: i.unitId,
          })),
        },
      );
      return created;
    },

    async update(id, input, actorId, reason) {
      const before = await deps.bulkTransfers.findById(id);
      const updated = await deps.bulkTransfers.update(id, input, actorId);
      log.info({ transferId: updated.transferId, actorId }, 'bulk transfer updated');
      void withAudit(
        { actorId },
        {
          module: 'bulk-transfer',
          action: 'UPDATE',
          entityType: 'BulkTransfer',
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
      const removed = await deps.bulkTransfers.remove(id, actorId, reason);
      log.info(
        { transferId: removed.transferId, transferType: removed.transferType, actorId },
        'bulk transfer deleted',
      );
      void withAudit(
        {
          actorId,
        },
        {
          module: 'bulk-transfer',
          action: 'DELETE',
          entityType: 'BulkTransfer',
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
      const restored = await deps.bulkTransfers.restore(id, actorId);
      log.info({ transferId: restored.transferId, actorId }, 'bulk transfer restored');
      void withAudit(
        { actorId },
        {
          module: 'bulk-transfer',
          action: 'UPDATE',
          entityType: 'BulkTransfer',
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
