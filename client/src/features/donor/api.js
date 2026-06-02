import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/donor';

export const donorApi = {
  list: (params) => apiClient.get(BASE, { params }).then(unwrap),
  detail: (id) => apiClient.get(`${BASE}/${id}`).then(unwrap),
  create: (data) => apiClient.post(BASE, data).then(unwrap),
  update: (id, data) => apiClient.put(`${BASE}/${id}`, data).then(unwrap),
  remove: (id) => apiClient.delete(`${BASE}/${id}`).then(unwrap),
  // Full-text search (Atlas $search → $text → regex fallback)
  search: (params) => apiClient.get(`${BASE}/search`, { params }).then(unwrap),
  // Vector similarity search (requires 768-dim embedding)
  vectorSearch: (data) => apiClient.post(`${BASE}/search/vector`, data).then(unwrap),
};
