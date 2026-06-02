import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/hospital';

export const hospitalApi = {
  list: (params) => apiClient.get(BASE, { params }).then(unwrap),
  detail: (id) => apiClient.get(`${BASE}/${id}`).then(unwrap),
  create: (data) => apiClient.post(BASE, data).then(unwrap),
  update: (id, data) => apiClient.put(`${BASE}/${id}`, data).then(unwrap),
  remove: (id) => apiClient.delete(`${BASE}/${id}`).then(unwrap),
};
