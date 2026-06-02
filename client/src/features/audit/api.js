import { apiClient, unwrap } from '@/core/api-client';

const BASE = '/api/v2/audit';

export const auditApi = {
  // GET /:entityType/:entityId — audit trail for one entity
  getTrail: (entityType, entityId) => apiClient.get(`${BASE}/${entityType}/${entityId}`).then(unwrap),
};
