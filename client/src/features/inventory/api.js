import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/inventory';

export const inventoryApi = {
  stockSummary: () => apiClient.get(`${BASE}/summary`).then(unwrap),
  // FEFO selection — pass params as query string (GET)
  selectFefo: (params) => apiClient.get(`${BASE}/select`, { params }).then(unwrap),
  nearExpiry: (params) => apiClient.get(`${BASE}/near-expiry`, { params }).then(unwrap),
};
