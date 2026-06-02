import { useQuery, useMutation } from '@tanstack/react-query';
import { inventoryApi } from './api';

export const inventoryKeys = {
  summary: () => ['inventory', 'summary'],
  nearExpiry: (p) => ['inventory', 'near-expiry', p ?? {}],
};

export function useStockSummary() {
  return useQuery({
    queryKey: inventoryKeys.summary(),
    queryFn: inventoryApi.stockSummary,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useNearExpiry(params) {
  return useQuery({
    queryKey: inventoryKeys.nearExpiry(params),
    queryFn: () => inventoryApi.nearExpiry(params),
    staleTime: 60_000,
  });
}

export function useSelectFefo() {
  return useMutation({ mutationFn: inventoryApi.selectFefo });
}
