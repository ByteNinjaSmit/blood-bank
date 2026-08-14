import { apiClient, unwrap } from '@/core/api-client';

const V = '/api/v2/yearly-report';

export const yearlyReportApi = {
  get: (year) => apiClient.get(V, { params: { year } }).then(unwrap),
};
