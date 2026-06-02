import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/user';

export const userApi = {
  list: (params) => apiClient.get(`${BASE}/list`, { params }).then(unwrap),
  detail: (id) => apiClient.get(`${BASE}/${id}`).then(unwrap),
  create: (data) => apiClient.post(`${BASE}/new`, data).then(unwrap),
  update: (id, data) => apiClient.put(`${BASE}/update/${id}`, data).then(unwrap),
  deactivate: (id) => apiClient.patch(`${BASE}/${id}/deactivate`).then(unwrap),
};
