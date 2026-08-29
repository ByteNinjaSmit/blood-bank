import { apiClient } from "@/core/api-client";

const BASE = "/api/discard";

export const discardApi = {
  list: (params) => apiClient.get(`${BASE}/get-list`, { params }).then((r) => r.data),
  create: (payload) => apiClient.post(`${BASE}/create`, payload).then((r) => r.data),
  restore: (unitId) => apiClient.post(`${BASE}/${unitId}/restore`).then((r) => r.data),
  // In-stock components for a bag number (drives the component multi-select).
  bagComponents: (bagNo) =>
    apiClient.get(`${BASE}/bag-components`, { params: { bagNo } }).then((r) => r.data?.data),
};
