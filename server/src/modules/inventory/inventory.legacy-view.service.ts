import { withAudit } from '@/shared/utils/with-audit';
import type {
  InventoryLegacyViewRepo,
  SendToStorageInput,
  StockListFilters,
  UpdateStorageInput,
} from '@/modules/inventory/inventory.legacy-view.repository';

export interface InventoryLegacyViewService {
  listStock(filters: StockListFilters): ReturnType<InventoryLegacyViewRepo['listStock']>;
  unreserve(inventoryIds: string[], actorId: string): Promise<void>;
  sendToStorage(input: SendToStorageInput): ReturnType<InventoryLegacyViewRepo['sendToStorage']>;
  updateStorage(input: UpdateStorageInput, reason: string): ReturnType<InventoryLegacyViewRepo['updateStorage']>;
  returnFromStorage(id: string, actorId: string, reason: string): ReturnType<InventoryLegacyViewRepo['returnFromStorage']>;
}

export function createInventoryLegacyViewService(deps: {
  repo: InventoryLegacyViewRepo;
}): InventoryLegacyViewService {
  return {
    listStock: (filters) => deps.repo.listStock(filters),
    unreserve: (inventoryIds, actorId) => deps.repo.unreserve(inventoryIds, actorId),
    sendToStorage: (input) => deps.repo.sendToStorage(input),

    async updateStorage(input, reason) {
      const updated = await deps.repo.updateStorage(input);
      void withAudit(
        { actorId: input.actorId },
        {
          module: 'inventory-storage',
          action: 'UPDATE',
          entityType: 'BloodUnit',
          entityId: updated.id,
          entityLabel: updated.bagNo,
          reason,
        },
        undefined,
        { storageLocation: updated.storageLocation },
      );
      return updated;
    },

    async returnFromStorage(id, actorId, reason) {
      const returned = await deps.repo.returnFromStorage(id, actorId);
      void withAudit(
        { actorId },
        {
          module: 'inventory-storage',
          action: 'DELETE',
          entityType: 'BloodUnit',
          entityId: returned.id,
          entityLabel: returned.bagNo,
          severity: 'warning',
          reason,
        },
        { storageLocation: returned.storageLocation },
        undefined,
      );
      return returned;
    },
  };
}
