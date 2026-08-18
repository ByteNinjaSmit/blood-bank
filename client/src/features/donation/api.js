import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/donation';

export const donationApi = {
  list: (params) => apiClient.get(BASE, { params }).then(unwrap),
  detail: (id) => apiClient.get(`${BASE}/${id}`).then(unwrap),
  create: (data) => apiClient.post(BASE, data).then(unwrap),
  update: (id, data) => apiClient.patch(`${BASE}/${id}`, data).then(unwrap),
  remove: (id, reason) => apiClient.delete(`${BASE}/${id}`, { data: { reason } }).then(unwrap),
  restore: (id) => apiClient.post(`${BASE}/${id}/restore`).then(unwrap),
  permanentDelete: (id, reason) => apiClient.delete(`${BASE}/${id}/permanent`, { data: { reason } }).then(unwrap),

  // Inward Donation (bag-first) workflow — see server/src/modules/donation/donation.routes.ts.
  createInward: (data) => apiClient.post(`${BASE}/inward`, data).then(unwrap),
  linkDonor: (id, data) => apiClient.patch(`${BASE}/${id}/link-donor`, data).then(unwrap),
  saveMedicalHistory: (id, data) => apiClient.patch(`${BASE}/${id}/medical-history`, data).then(unwrap),
  finalizeInward: (id, data) => apiClient.patch(`${BASE}/${id}/finalize`, data).then(unwrap),
  listIncomplete: (params) => apiClient.get(`${BASE}/incomplete`, { params }).then(unwrap),
};
