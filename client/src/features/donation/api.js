import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/donation';

// Fetches every page for the given filters and merges all items into one array.
// Uses the server's max allowed pageSize (10 000) to minimise round-trips.
async function fetchAllPages(params) {
  const PAGE = 10_000;
  const first = await apiClient.get(BASE, { params: { ...params, page: 1, pageSize: PAGE } }).then(unwrap);
  const total = first.total ?? 0;
  const items = [...(first.items ?? [])];

  if (total > PAGE) {
    const extraPages = Math.ceil((total - PAGE) / PAGE);
    const rest = await Promise.all(
      Array.from({ length: extraPages }, (_, i) =>
        apiClient.get(BASE, { params: { ...params, page: i + 2, pageSize: PAGE } }).then(unwrap),
      ),
    );
    rest.forEach((r) => items.push(...(r.items ?? [])));
  }

  return { items, total: items.length };
}

export const donationApi = {
  list: (params) => apiClient.get(BASE, { params }).then(unwrap),
  // Fetches ALL records with no artificial cap, regardless of total count.
  listAll: (params) => fetchAllPages(params),
  detail: (id) => apiClient.get(`${BASE}/${id}`).then(unwrap),
  create: (data) => apiClient.post(BASE, data).then(unwrap),
  update: (id, data) => apiClient.patch(`${BASE}/${id}`, data).then(unwrap),
  remove: (id, reason) => apiClient.delete(`${BASE}/${id}`, { data: { reason } }).then(unwrap),
  restore: (id) => apiClient.post(`${BASE}/${id}/restore`).then(unwrap),
  permanentDelete: (id, reason) => apiClient.delete(`${BASE}/${id}/permanent`, { data: { reason } }).then(unwrap),
};
