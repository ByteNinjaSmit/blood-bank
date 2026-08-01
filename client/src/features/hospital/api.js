import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/hospital';

export const hospitalApi = {
  list: (params) => apiClient.get(BASE, { params }).then(unwrap),
  detail: (id) => apiClient.get(`${BASE}/${id}`).then(unwrap),
  create: (data) => apiClient.post(BASE, data).then(unwrap),
  update: (id, data, editReason) => apiClient.put(`${BASE}/${id}`, { ...data, _editReason: editReason }).then(unwrap),
  remove: (id, reason) => apiClient.delete(`${BASE}/${id}`, { data: { reason } }).then(unwrap),
  restore: (id) => apiClient.post(`${BASE}/${id}/restore`).then(unwrap),
  permanentDelete: (id, reason) => apiClient.delete(`${BASE}/${id}/permanent`, { data: { reason } }).then(unwrap),
};
