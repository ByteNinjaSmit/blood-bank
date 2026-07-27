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

    async unreserve(inventoryIds, actorId) {
      await deps.repo.unreserve(inventoryIds, actorId);
      void withAudit(
        { actorId },
        {
          module: 'inventory-storage',
          action: 'STATE_TRANSITION',
          entityType: 'BloodUnit',
          entityId: `batch:unreserve:${inventoryIds.length}`,
        },
        undefined,
        { event: 'UNRESERVE', unitIds: inventoryIds },
      );
    },

    async sendToStorage(input) {
      const result = await deps.repo.sendToStorage(input);
      const bagIds = input.bags.flatMap((b) => b.bagIds);
      void withAudit(
        { actorId: input.actorId },
        {
          module: 'inventory-storage',
          action: 'UPDATE',
          entityType: 'BloodUnit',
          entityId: `batch:send-to-storage:${bagIds.length}`,
        },
        undefined,
        { location: input.location, bagIds, skipped: result.skipped },
      );
      return result;
    },

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
        {
          bagNo: returned.bagNo,
          storageLocation: returned.storageLocation,
          componentType: returned.componentType,
          bloodGroup: returned.aboGroup,
          rhFactor: returned.rhFactor,
          segmentNo: returned.segmentNo,
        },
        undefined,
      );
      return returned;
    },
  };
}
