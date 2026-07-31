import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/role';

export const roleApi = {
  list: (params) => apiClient.get(BASE, { params }).then(unwrap),
  detail: (id) => apiClient.get(`${BASE}/${id}`).then(unwrap),
  create: (data) => apiClient.post(BASE, data).then(unwrap),
  update: (id, data) => apiClient.patch(`${BASE}/${id}`, data).then(unwrap),
  remove: (id) => apiClient.delete(`${BASE}/${id}`).then(unwrap),
};
