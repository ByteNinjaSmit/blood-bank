import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/mis';

export const misApi = {
  donors: (params) => apiClient.get(`${BASE}/donors`, { params }).then(unwrap),
  donations: (params) => apiClient.get(`${BASE}/donations`, { params }).then(unwrap),
  camps: (params) => apiClient.get(`${BASE}/camps`, { params }).then(unwrap),
  bags: (params) => apiClient.get(`${BASE}/bags`, { params }).then(unwrap),
  components: (params) => apiClient.get(`${BASE}/components`, { params }).then(unwrap),
  inventory: () => apiClient.get(`${BASE}/inventory`).then(unwrap),
  issues: () => apiClient.get(`${BASE}/issues`).then(unwrap),
  discards: () => apiClient.get(`${BASE}/discards`).then(unwrap),
  serology: () => apiClient.get(`${BASE}/serology`).then(unwrap),
  audit: () => apiClient.get(`${BASE}/audit`).then(unwrap),
  regulatory: () => apiClient.get(`${BASE}/regulatory`).then(unwrap),
  executive: (params) => apiClient.get(`${BASE}/executive`, { params }).then(unwrap),
  analytics: () => apiClient.get(`${BASE}/analytics`).then(unwrap),
};
