import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/tti';

export const serologyApi = {
  listByDonation: (donationId) => apiClient.get(`${BASE}/donation/${donationId}`).then(unwrap),
  detail: (id) => apiClient.get(`${BASE}/${id}`).then(unwrap),
  update: (id, data) => apiClient.put(`${BASE}/${id}`, data).then(unwrap),
  release: (id, data) => apiClient.post(`${BASE}/${id}/release`, data).then(unwrap),
};
