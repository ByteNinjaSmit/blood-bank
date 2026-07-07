import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import type { BulkTransferRepo, BulkTransferDto } from '@/modules/bulk-transfer/bulk-transfer.repository';
import type { CreateBulkTransferInput, ListBulkTransferInput } from '@/modules/bulk-transfer/bulk-transfer.validator';

export interface BulkTransferService {
  list(f: ListBulkTransferInput): Promise<{ items: BulkTransferDto[]; total: number; page: number; limit: number }>;
  get(id: string): Promise<BulkTransferDto>;
  create(input: CreateBulkTransferInput, actorId: string): Promise<BulkTransferDto>;
}

function generateTransferId(): string {
  const now = new Date();
  const yyyymmdd = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
  const rand = new Types.ObjectId().toHexString().slice(-6).toUpperCase();
  return `BT-${yyyymmdd}-${rand}`;
}

export function createBulkTransferService(deps: { bulkTransfers: BulkTransferRepo }): BulkTransferService {
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
      return created;
    },
  };
}
