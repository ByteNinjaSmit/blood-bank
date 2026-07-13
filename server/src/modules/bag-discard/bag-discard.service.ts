import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { withAudit } from '@/shared/utils/with-audit';
import { ConflictError, NotFoundError } from '@/shared/errors';
import type { BagDiscardRepo, BagDiscardDto } from '@/modules/bag-discard/bag-discard.repository';
import type { BagStockRepo } from '@/modules/bag-stock/bag-stock.repository';
import type {
  CreateBagDiscardInput,
  ApproveBagDiscardInput,
  ListBagDiscardInput,
} from '@/modules/bag-discard/bag-discard.validator';

export interface BagDiscardService {
  list(q: ListBagDiscardInput): Promise<{ items: BagDiscardDto[]; total: number; page: number; pageSize: number }>;
  get(id: string): Promise<BagDiscardDto>;
  create(input: CreateBagDiscardInput, actorId: string): Promise<BagDiscardDto>;
  approve(id: string, input: ApproveBagDiscardInput, actorId: string): Promise<BagDiscardDto>;
}

function generateDiscardId(): string {
  const now = new Date();
  const yyyymmdd = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
  const rand = new Types.ObjectId().toHexString().slice(-4).toUpperCase();
  return `DIS-${yyyymmdd}-${rand}`;
}

export function createBagDiscardService(deps: {
  discards: BagDiscardRepo;
  bagStock: BagStockRepo;
}): BagDiscardService {
  const log = childLogger({ module: 'bag-discard-service' });

  return {
    async list(q) {
      const { items, total } = await deps.discards.list(q);
      return { items, total, page: q.page ?? 1, pageSize: q.pageSize ?? 20 };
    },

    async get(id) {
      const discard = await deps.discards.findById(id);
      if (!discard) throw new NotFoundError('BagDiscard', id);
      return discard;
    },

    async create(input, actorId) {
      const stock = await deps.bagStock.findById(input.stockId);
      if (!stock) throw new NotFoundError('BagStock', input.stockId);

      const available = stock.closingStock;
      if (input.quantity > available) {
        throw new ConflictError(
          `Discard quantity (${input.quantity}) exceeds available stock (${available}) for BagStock ${input.stockId}`,
        );
      }

      const discardId = generateDiscardId();
      const created = await deps.discards.create({
        discardId,
        discardDate: input.discardDate,
        stockId: input.stockId,
        bagType: stock.bagType,
        batchNumber: stock.batchNumber,
        quantity: input.quantity,
        reason: input.reason,
        reasonDetail: input.reasonDetail,
        actorId,
      });

      await deps.bagStock.incrementDiscarded(input.stockId, input.quantity, actorId);
      log.warn({ discardId, stockId: input.stockId, quantity: input.quantity, reason: input.reason, actorId }, 'bag discard recorded');
      void withAudit(
        { actorId },
        {
          module: 'bag-discard',
          action: 'DISCARD',
          entityType: 'BagDiscard',
          entityId: created.id,
          entityLabel: discardId,
          severity: 'warning',
          reason: `${input.reason}${input.reasonDetail ? `: ${input.reasonDetail}` : ''}`,
        },
        undefined,
        { discardId, stockId: input.stockId, quantity: input.quantity },
      );
      return created;
    },

    async approve(id, input, actorId) {
      const discard = await deps.discards.findById(id);
      if (!discard) throw new NotFoundError('BagDiscard', id);
      if (discard.approvedById) {
        throw new ConflictError(`BagDiscard ${id} has already been approved`);
      }
      const updated = await deps.discards.approve(id, {
        approvedById: actorId,
        approvedAt: new Date(),
        disposalMethod: input.disposalMethod,
        biomedicalWasteManifestNo: input.biomedicalWasteManifestNo,
        disposalDate: input.disposalDate,
      }, actorId);
      if (!updated) throw new NotFoundError('BagDiscard', id);
      log.info({ discardId: id, actorId }, 'bag discard approved');
      void withAudit(
        { actorId },
        { module: 'bag-discard', action: 'UPDATE', entityType: 'BagDiscard', entityId: id, entityLabel: discard.discardId },
        { approvedById: null },
        { approvedById: actorId, disposalMethod: input.disposalMethod },
      );
      return updated;
    },
  };
}
