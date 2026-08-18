import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/inventory';
const LEGACY_BASE = '/api/inventory';

export const inventoryApi = {
  stockSummary: (includeLoan = false) =>
    apiClient.get(`${BASE}/summary`, { params: includeLoan ? { includeLoan: true } : undefined }).then(unwrap),
  // FEFO selection — pass params as query string (GET)
  selectFefo: (params) => apiClient.get(`${BASE}/select`, { params }).then(unwrap),
  nearExpiry: (params) => apiClient.get(`${BASE}/near-expiry`, { params }).then(unwrap),

  // Legacy /api/inventory stock register — storage bag edit/return actions.
  updateStorage: (id, data) => apiClient.patch(`${LEGACY_BASE}/${id}/storage`, data).then(unwrap),
  returnFromStorage: (id, reason) => apiClient.post(`${LEGACY_BASE}/return-from-storage`, { id, reason }).then(unwrap),

  // Full (unpaginated) stock list for a single status (optionally scoped to
  // one component type), sorted by bag number — used to build the printable
  // Stock Register report (PRBC/FFP/RDP variants) and its Excel twin.
  legacyStockByStatus: (status, componentType) =>
    apiClient
      .get(LEGACY_BASE, {
        params: { page: 1, limit: 5000, status, componentType: componentType || undefined, sortBy: 'bagNo', order: 'asc' },
      })
      .then(unwrap),
};
