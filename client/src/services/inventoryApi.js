// Shim → features/inventory/api
import { inventoryApi } from '@/features/inventory/api';

export default {
  initialize: () => {}, // no-op shim for compatibility
  list: inventoryApi.stockSummary,
  stockSummary: inventoryApi.stockSummary,
  selectFefo: inventoryApi.selectFefo,
  reserveByCriteria: inventoryApi.selectFefo,
  nearExpiry: inventoryApi.nearExpiry,
};
