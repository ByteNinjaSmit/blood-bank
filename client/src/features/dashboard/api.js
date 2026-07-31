import { apiClient, unwrap } from '@/core/api-client';

const V = '/api/v2/dashboard';

export const dashboardApi = {
  get: (params) => apiClient.get(V, { params }).then(unwrap),
  getAlerts: () => apiClient.get(`${V}/alerts`).then(unwrap),
};
