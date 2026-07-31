import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/affected-records';

export const affectedRecordsApi = {
  list: () => apiClient.get(BASE).then(unwrap),
};
