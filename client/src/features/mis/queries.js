import { useQuery } from '@tanstack/react-query';
import { misApi } from './api';

const staleTime = 30_000;

export function useDonorMis(params) {
  return useQuery({ queryKey: ['mis', 'donors', params], queryFn: () => misApi.donors(params), staleTime });
}
export function useDonationMis(params) {
  return useQuery({ queryKey: ['mis', 'donations', params], queryFn: () => misApi.donations(params), staleTime });
}
export function useCampMis(params) {
  return useQuery({ queryKey: ['mis', 'camps', params], queryFn: () => misApi.camps(params), staleTime });
}
export function useBagMis(params) {
  return useQuery({ queryKey: ['mis', 'bags', params], queryFn: () => misApi.bags(params), staleTime });
}
export function useComponentMis(params) {
  return useQuery({ queryKey: ['mis', 'components', params], queryFn: () => misApi.components(params), staleTime });
}
export function useInventoryMis() {
  return useQuery({ queryKey: ['mis', 'inventory'], queryFn: () => misApi.inventory(), staleTime });
}
export function useIssueMis() {
  return useQuery({ queryKey: ['mis', 'issues'], queryFn: () => misApi.issues(), staleTime });
}
export function useDiscardMis() {
  return useQuery({ queryKey: ['mis', 'discards'], queryFn: () => misApi.discards(), staleTime });
}
export function useSerologyMis() {
  return useQuery({ queryKey: ['mis', 'serology'], queryFn: () => misApi.serology(), staleTime });
}
export function useAuditMis() {
  return useQuery({ queryKey: ['mis', 'audit'], queryFn: () => misApi.audit(), staleTime });
}
export function useRegulatoryMis() {
  return useQuery({ queryKey: ['mis', 'regulatory'], queryFn: () => misApi.regulatory(), staleTime });
}
export function useExecutiveMis(params) {
  return useQuery({ queryKey: ['mis', 'executive', params], queryFn: () => misApi.executive(params), staleTime });
}
export function useAnalyticsMis() {
  return useQuery({ queryKey: ['mis', 'analytics'], queryFn: () => misApi.analytics(), staleTime });
}
