import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/inventory';
const LEGACY_BASE = '/api/inventory';

export const inventoryApi = {
  stockSummary: (includeLoan = false) =>
    apiClient.get(`${BASE}/summary`, { params: includeLoan ? { includeLoan: true } : undefined }).then(unwrap),
  // FEFO selection — pass params as query string (GET)
  selectFefo: (params) => apiClient.get(`${BASE}/select`, { params }).then(unwrap),
  reserveByCriteria: (payload) => apiClient.post(`${BASE}/reserve`, payload).then(res => res.data),
  nearExpiry: (params) => apiClient.get(`${BASE}/near-expiry`, { params }).then(unwrap),

  // Legacy /api/inventory stock register — storage bag edit/return actions.
  updateStorage: (id, data) => apiClient.patch(`${LEGACY_BASE}/${id}/storage`, data).then(unwrap),
  returnFromStorage: (id, reason) => apiClient.post(`${LEGACY_BASE}/return-from-storage`, { id, reason }).then(unwrap),
};
