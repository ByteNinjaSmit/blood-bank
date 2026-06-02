import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/deferral';

export const deferralApi = {
  listByDonor: (donorId) => apiClient.get(`${BASE}/donor/${donorId}`).then(unwrap),
  create: (data) => apiClient.post(BASE, data).then(unwrap),
  lift: (id, data) => apiClient.post(`${BASE}/${id}/lift`, data).then(unwrap),
};
