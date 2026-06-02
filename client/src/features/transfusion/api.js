import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/transfusion';

export const transfusionApi = {
  // POST / — record a transfusion (bedside confirmation)
  record: (data) => apiClient.post(BASE, data).then(unwrap),
};
