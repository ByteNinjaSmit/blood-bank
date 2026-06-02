import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/requisition';

export const requisitionApi = {
  list: (params) => apiClient.get(`${BASE}/list`, { params }).then(unwrap),
  detail: (id) => apiClient.get(`${BASE}/${id}`).then(unwrap),
  create: (data) => apiClient.post(`${BASE}/new`, data).then(unwrap),
  approve: (id, data) => apiClient.post(`${BASE}/${id}/approve`, data).then(unwrap),
  reject: (id, data) => apiClient.post(`${BASE}/${id}/reject`, data).then(unwrap),
  issue: (id, data) => apiClient.post(`${BASE}/${id}/issue`, data).then(unwrap),
};
