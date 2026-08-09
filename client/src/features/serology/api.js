import { apiClient } from "@/core/api-client";

// Batch TTI/Serology result entry — records + finalizes many bags in one
// request. See use-batch-serology.js for the client-side staging that
// builds the `items` payload (defaults every parameter to Negative, only
// exceptions are entered by the user).
export const serologyApi = {
  batchRecordResults: (items, technicianId) =>
    apiClient
      .post("/api/serology/results/batch", { items, technicianId })
      .then((res) => res.data),
  // Full before/after retest history for one bag (every correction/retest,
  // most recent first) — see tti.legacy-view.controller.ts's getHistory.
  getHistory: (id) => apiClient.get(`/api/serology/results/${id}/history`).then((res) => res.data),
};
