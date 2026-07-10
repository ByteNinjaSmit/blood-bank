import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/camp';

export const campApi = {
  list: (params) => apiClient.get(`${BASE}/list`, { params }).then(unwrap),
  listAll: () => apiClient.get(`${BASE}/details`).then(unwrap),
  detail: (id) => apiClient.get(`${BASE}/details/${id}`).then(unwrap),
  create: (data) => apiClient.post(`${BASE}/new`, data).then(unwrap),
  update: (id, data) => apiClient.put(`${BASE}/update/${id}`, data).then(unwrap),
  remove: (id) => apiClient.delete(`${BASE}/delete/${id}`).then(unwrap),
  restore: (id) => apiClient.post(`${BASE}/restore/${id}`).then(unwrap),
  staffList: () => apiClient.get(`${BASE}/staff-list`).then(unwrap),
  campDonations: (campId) => apiClient.get(`${BASE}/donations/${campId}`).then(unwrap),
  campDonors: (campId) => apiClient.get(`${BASE}/donors/${campId}`).then(unwrap),
  voluntaryDonations: (params) => apiClient.get(`${BASE}/voluntary-donations`, { params }).then(unwrap),
};
