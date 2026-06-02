import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/inventory';

export const inventoryApi = {
  stockSummary: () => apiClient.get(`${BASE}/summary`).then(unwrap),
  selectFefo: (data) => apiClient.post(`${BASE}/select`, data).then(unwrap),
  nearExpiry: (params) => apiClient.get(`${BASE}/near-expiry`, { params }).then(unwrap),
};
