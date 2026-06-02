import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/donation';

export const donationApi = {
  list: (params) => apiClient.get(BASE, { params }).then(unwrap),
  detail: (id) => apiClient.get(`${BASE}/${id}`).then(unwrap),
  create: (data) => apiClient.post(BASE, data).then(unwrap),
};
