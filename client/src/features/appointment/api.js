import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/appointment';

export const appointmentApi = {
  list: (params) => apiClient.get(BASE, { params }).then(unwrap),
  summary: () => apiClient.get(`${BASE}/summary`).then(unwrap),
  updateStatus: (id, status) => apiClient.patch(`${BASE}/${id}/status`, { status }).then(unwrap),
};
