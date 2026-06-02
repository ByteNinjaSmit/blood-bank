import { useQuery } from '@tanstack/react-query';
import { auditApi } from './api';

export const auditKeys = {
  trail: (type, id) => ['audit', type, id],
};

export function useAuditTrail(entityType, entityId) {
  return useQuery({
    queryKey: auditKeys.trail(entityType, entityId),
    queryFn: () => auditApi.getTrail(entityType, entityId),
    enabled: Boolean(entityType && entityId),
    staleTime: 60_000,
  });
}
