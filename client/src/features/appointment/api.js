import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/appointment';
const FEEDBACK_BASE = '/api/v2/feedback';

export const appointmentApi = {
  list: (params) => apiClient.get(BASE, { params }).then(unwrap),
  summary: () => apiClient.get(`${BASE}/summary`).then(unwrap),
  updateStatus: (id, status) => apiClient.patch(`${BASE}/${id}/status`, { status }).then(unwrap),
};

export const feedbackApi = {
  list: (params) => apiClient.get(FEEDBACK_BASE, { params }).then(unwrap),
};
