import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/audit';

function cleanParams(filters = {}) {
  const params = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params[key] = value;
  });
  return params;
}

export const auditApi = {
  // GET /:entityType/:entityId — audit trail for one entity
  getTrail: (entityType, entityId) => apiClient.get(`${BASE}/${entityType}/${entityId}`).then(unwrap),

  // GET / — paginated, filtered list across all entities (the central viewer feed)
  search: (filters = {}, page = 1, limit = 25) =>
    apiClient
      .get(BASE, { params: { ...cleanParams(filters), page, limit } })
      .then((res) => ({ data: unwrap(res), pagination: res.data?.pagination })),

  // GET /export — same filters, unbounded (capped server-side)
  export: (filters = {}, limit = 10000) =>
    apiClient.get(`${BASE}/export`, { params: { ...cleanParams(filters), limit } }).then(unwrap),
};
