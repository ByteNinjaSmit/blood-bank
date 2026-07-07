import { apiClient, unwrap } from '@/core/api-client';

const V = '/api/v2/monthly-report';

export const monthlyReportApi = {
  get: (month, year) => apiClient.get(V, { params: { month, year } }).then(unwrap),
};
