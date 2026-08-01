import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/tti';

export const serologyApi = {
  // GET /:donationId — fetch TTI result for a donation
  getByDonation: (donationId) => apiClient.get(`${BASE}/${donationId}`).then(unwrap),
  // POST /:donationId/tests — record panel test results
  recordTests: (donationId, data) => apiClient.post(`${BASE}/${donationId}/tests`, data).then(unwrap),
  // POST /:donationId/finalize — evaluate panel and apply decision (release/reactive/indeterminate)
  finalize: (donationId, data) => apiClient.post(`${BASE}/${donationId}/finalize`, data).then(unwrap),
};
