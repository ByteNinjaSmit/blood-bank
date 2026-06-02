// Shim → features/inventory/api
import { inventoryApi } from '@/features/inventory/api';

export default {
  list: inventoryApi.stockSummary,
  stockSummary: inventoryApi.stockSummary,
  selectFefo: inventoryApi.selectFefo,
  reserveByCriteria: inventoryApi.selectFefo,
  nearExpiry: inventoryApi.nearExpiry,
};
