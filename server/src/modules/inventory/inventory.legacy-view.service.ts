import type {
  InventoryLegacyViewRepo,
  SendToStorageInput,
  StockListFilters,
} from '@/modules/inventory/inventory.legacy-view.repository';

export interface InventoryLegacyViewService {
  listStock(filters: StockListFilters): ReturnType<InventoryLegacyViewRepo['listStock']>;
  unreserve(inventoryIds: string[], actorId: string): Promise<void>;
  sendToStorage(input: SendToStorageInput): ReturnType<InventoryLegacyViewRepo['sendToStorage']>;
}

export function createInventoryLegacyViewService(deps: {
  repo: InventoryLegacyViewRepo;
}): InventoryLegacyViewService {
  return {
    listStock: (filters) => deps.repo.listStock(filters),
    unreserve: (inventoryIds, actorId) => deps.repo.unreserve(inventoryIds, actorId),
    sendToStorage: (input) => deps.repo.sendToStorage(input),
  };
}
