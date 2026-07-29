import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/camp';

export const campApi = {
  list: (params) => apiClient.get(`${BASE}/list`, { params }).then(unwrap),
  listAll: () => apiClient.get(`${BASE}/details`).then(unwrap),
  detail: (id) => apiClient.get(`${BASE}/details/${id}`).then(unwrap),
  create: (data) => apiClient.post(`${BASE}/new`, data).then(unwrap),
  update: (id, data, editReason) => apiClient.put(`${BASE}/update/${id}`, { ...data, _editReason: editReason }).then(unwrap),
  remove: (id, reason) => apiClient.delete(`${BASE}/delete/${id}`, { data: { reason } }).then(unwrap),
  restore: (id) => apiClient.post(`${BASE}/restore/${id}`).then(unwrap),
  staffList: () => apiClient.get(`${BASE}/staff-list`).then(unwrap),
  campDonations: (campId) => apiClient.get(`${BASE}/donations/${campId}`).then(unwrap),
  campDonors: (campId) => apiClient.get(`${BASE}/donors/${campId}`).then(unwrap),
  voluntaryDonations: (params) => apiClient.get(`${BASE}/voluntary-donations`, { params }).then(unwrap),
  updateVoluntaryStatus: (id, status) =>
    apiClient.patch(`${BASE}/voluntary-donations/${id}/status`, { status }).then(unwrap),
};
