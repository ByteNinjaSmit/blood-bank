import { apiClient } from "@/core/api-client";

// Component-separation endpoints. The server responses here are NOT the
// standard `{ success, data }` envelope — each returns its own top-level
// key (`components`, `bags`, `unit`, `component`, `message`) — so these
// resolve to `res.data` (the whole payload) and callers read the key they
// need, exactly as the pages did when they called apiClient directly.
const BASE = "/api/v2/component";

export const componentApi = {
  // { components: [...], pagination: { total, totalPages } }
  list: (params) => apiClient.get(`${BASE}/list`, { params }).then((r) => r.data),

  // { bags: [...] }
  bagsToSeparate: () => apiClient.get(`${BASE}/bags-to-separate`).then((r) => r.data),

  // { component: {...} } — `id` is a BloodUnit _id or human unitId.
  detail: (id) => apiClient.get(`${BASE}/${id}`).then((r) => r.data),

  // { unit: {...} }
  separate: (payload) => apiClient.post(`${BASE}/separate`, payload).then((r) => r.data),

  // { message }
  separationCompleted: (donationId, signature) =>
    apiClient
      .post(`${BASE}/separation-completed`, { donationId, signature })
      .then((r) => r.data),

  // { message } — bag-level correction; `id` is the donation id (bag).
  patchBag: (id, payload) => apiClient.patch(`${BASE}/bag/${id}`, payload).then((r) => r.data),

  // { unit } — single prepared-component field edit; `id` is a unit id.
  patch: (id, payload) => apiClient.patch(`${BASE}/${id}`, payload).then((r) => r.data),

  // Best-effort "Under Separation" hint flags — never block the flow.
  markBatchDraft: (donationIds) =>
    donationIds?.length
      ? apiClient.post(`${BASE}/batch-draft`, { donationIds }).catch(() => {})
      : Promise.resolve(),
  clearBatchDraft: (donationIds) =>
    donationIds?.length
      ? apiClient.post(`${BASE}/batch-draft/clear`, { donationIds }).catch(() => {})
      : Promise.resolve(),
};
