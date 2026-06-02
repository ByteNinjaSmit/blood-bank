import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/requisition';

export const requisitionApi = {
  // Listing and detail
  list: (params) => apiClient.get(BASE, { params }).then(unwrap),
  detail: (id) => apiClient.get(`${BASE}/${id}`).then(unwrap),

  // Patient registration (prerequisite for requisition)
  createPatient: (data) => apiClient.post(`${BASE}/patient`, data).then(unwrap),

  // Requisition lifecycle
  create: (data) => apiClient.post(BASE, data).then(unwrap),
  match: (id) => apiClient.post(`${BASE}/${id}/match`, {}).then(unwrap),
  approve: (id) => apiClient.post(`${BASE}/${id}/approve`, {}).then(unwrap),
  complete: (id) => apiClient.post(`${BASE}/${id}/complete`, {}).then(unwrap),
  reject: (id, data) => apiClient.post(`${BASE}/${id}/reject`, data).then(unwrap),

  // Crossmatch (serology records compatibility result)
  crossmatch: (data) => apiClient.post(`${BASE}/crossmatch`, data).then(unwrap),

  // Issue (unit leaves bank)
  issue: (data) => apiClient.post(`${BASE}/issue`, data).then(unwrap),
};
