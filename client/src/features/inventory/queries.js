import { useQuery, useMutation } from '@tanstack/react-query';
import { inventoryApi } from './api';

export const inventoryKeys = {
  summary: (includeLoan) => ['inventory', 'summary', includeLoan ? 'with-loan' : 'own'],
  nearExpiry: (p) => ['inventory', 'near-expiry', p ?? {}],
  select: (p) => ['inventory', 'select', p ?? {}],
};

export function useStockSummary(includeLoan = false) {
  return useQuery({
    queryKey: inventoryKeys.summary(includeLoan),
    queryFn: () => inventoryApi.stockSummary(includeLoan),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useNearExpiry(params) {
  return useQuery({
    queryKey: inventoryKeys.nearExpiry(params),
    queryFn: () => inventoryApi.nearExpiry(params),
    staleTime: 60_000,
    enabled: true,
  });
}

// Preview FEFO selection without reserving units
export function useFefoPrevew(params) {
  return useQuery({
    queryKey: inventoryKeys.select(params),
    queryFn: () => inventoryApi.selectFefo(params),
    enabled: Boolean(params?.component && params?.aboGroup && params?.rhFactor),
    staleTime: 15_000,
  });
}

// Use mutation when reserving (side-effectful) — reuses same API
export function useSelectFefo() {
  return useMutation({ mutationFn: inventoryApi.selectFefo });
}

export function useUpdateStorageBag() {
  return useMutation({ mutationFn: ({ id, data }) => inventoryApi.updateStorage(id, data) });
}

export function useReturnFromStorage() {
  return useMutation({ mutationFn: ({ id, reason }) => inventoryApi.returnFromStorage(id, reason) });
}
