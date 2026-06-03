import { childLogger } from '@/core/logger';
import { NotFoundError } from '@/shared/errors';
import type { BagStockRepo, BagStockDto, BagStockSummaryItem } from '@/modules/bag-stock/bag-stock.repository';
import type {
  ListBagStockInput,
  UpdateBagStockStatusInput,
} from '@/modules/bag-stock/bag-stock.validator';

export interface BagStockService {
  list(q: ListBagStockInput): Promise<{ items: BagStockDto[]; total: number; page: number; pageSize: number }>;
  get(id: string): Promise<BagStockDto>;
  summary(): Promise<BagStockSummaryItem[]>;
  updateStatus(id: string, input: UpdateBagStockStatusInput, actorId: string): Promise<BagStockDto>;
}

export function createBagStockService(deps: { bagStock: BagStockRepo }): BagStockService {
  const log = childLogger({ module: 'bag-stock-service' });

  return {
    async list(q) {
      const { items, total } = await deps.bagStock.list(q);
      return { items, total, page: q.page ?? 1, pageSize: q.pageSize ?? 20 };
    },

    async get(id) {
      const stock = await deps.bagStock.findById(id);
      if (!stock) throw new NotFoundError('BagStock', id);
      return stock;
    },

    async summary() {
      return deps.bagStock.summary();
    },

    async updateStatus(id, input, actorId) {
      const updated = await deps.bagStock.updateStatus(id, input.status, actorId);
      if (!updated) throw new NotFoundError('BagStock', id);
      log.info({ stockId: id, status: input.status, actorId }, 'bag stock status updated');
      return updated;
    },
  };
}
