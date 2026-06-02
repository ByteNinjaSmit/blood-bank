import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/lookback';

export const lookbackApi = {
  // POST /run — trace and recall for a donationId or donorId
  run: (data) => apiClient.post(`${BASE}/run`, data).then(unwrap),
};
