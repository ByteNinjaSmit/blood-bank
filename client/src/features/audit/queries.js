import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { auditApi } from './api';

export const auditKeys = {
  all: ['audit'],
  trail: (type, id) => ['audit', type, id],
  search: (filters, page) => ['audit', 'search', filters, page],
};

export function useAuditTrail(entityType, entityId) {
  return useQuery({
    queryKey: auditKeys.trail(entityType, entityId),
    queryFn: () => auditApi.getTrail(entityType, entityId),
    enabled: Boolean(entityType && entityId),
    staleTime: 60_000,
  });
}

export function useAuditSearch(filters, page = 1, limit = 25) {
  return useQuery({
    queryKey: auditKeys.search(filters, page),
    queryFn: () => auditApi.search(filters, page, limit),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
