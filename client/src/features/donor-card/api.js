import { apiClient, unwrap } from '@/core/api-client';

const V = '/api/v2/donor-card';

export const donorCardApi = {
  create: (data) => apiClient.post(V, data).then(unwrap),
  list: () => apiClient.get(V).then(unwrap),
};
