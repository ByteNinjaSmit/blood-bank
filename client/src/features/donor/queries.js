import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { donorApi } from './api';

export const donorKeys = {
  all: ['donor'],
  list: (f) => ['donor', 'list', f ?? {}],
  detail: (id) => ['donor', 'detail', id],
  search: (p) => ['donor', 'search', p ?? {}],
};

export function useDonorList(filters) {
  return useQuery({
    queryKey: donorKeys.list(filters),
    queryFn: () => donorApi.list(filters),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useDonorDetail(id) {
  return useQuery({
    queryKey: donorKeys.detail(id),
    queryFn: () => donorApi.detail(id),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useDonorSearch(params) {
  return useQuery({
    queryKey: donorKeys.search(params),
    queryFn: () => donorApi.search(params),
    enabled: Boolean(params?.q),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

export function useCreateDonor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: donorApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: donorKeys.all }),
  });
}

export function useUpdateDonor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => donorApi.update(id, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: donorKeys.all });
      qc.invalidateQueries({ queryKey: donorKeys.detail(id) });
    },
  });
}

export function useDeleteDonor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: donorApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: donorKeys.all }),
  });
}

export function useRestoreDonor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: donorApi.restore,
    onSuccess: () => qc.invalidateQueries({ queryKey: donorKeys.all }),
  });
}

export function useVectorSearch() {
  return useMutation({ mutationFn: donorApi.vectorSearch });
}
