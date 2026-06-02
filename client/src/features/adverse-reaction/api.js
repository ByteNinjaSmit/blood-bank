import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/adverse-reaction';

export const adverseReactionApi = {
  list: (params) => apiClient.get(BASE, { params }).then(unwrap),
  report: (data) => apiClient.post(BASE, data).then(unwrap),
};
