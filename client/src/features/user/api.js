import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/user';

export const userApi = {
  list: (params) => apiClient.get(BASE, { params }).then(unwrap),
  detail: (id) => apiClient.get(`${BASE}/${id}`).then(unwrap),
  create: (data) => apiClient.post(BASE, data).then(unwrap),
  update: (id, data) => apiClient.put(`${BASE}/${id}`, data).then(unwrap),
  // Backend uses DELETE /:id to deactivate (soft-deletes)
  deactivate: (id) => apiClient.delete(`${BASE}/${id}`).then(unwrap),
};
