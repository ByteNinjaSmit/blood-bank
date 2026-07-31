import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hospitalApi } from './api';

export const hospitalKeys = {
  all: ['hospital'],
  list: (f) => ['hospital', 'list', f ?? {}],
  detail: (id) => ['hospital', 'detail', id],
};

export function useHospitalList(filters) {
  return useQuery({
    queryKey: hospitalKeys.list(filters),
    queryFn: () => hospitalApi.list(filters),
    staleTime: 5 * 60_000,
  });
}

export function useHospitalDetail(id) {
  return useQuery({
    queryKey: hospitalKeys.detail(id),
    queryFn: () => hospitalApi.detail(id),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  });
}

export function useCreateHospital() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: hospitalApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: hospitalKeys.all }),
  });
}

export function useUpdateHospital() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => hospitalApi.update(id, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: hospitalKeys.all });
      qc.invalidateQueries({ queryKey: hospitalKeys.detail(id) });
    },
  });
}

export function useDeleteHospital() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => hospitalApi.remove(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: hospitalKeys.all }),
  });
}

export function useRestoreHospital() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => hospitalApi.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: hospitalKeys.all }),
  });
}

export function usePermanentDeleteHospital() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => hospitalApi.permanentDelete(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: hospitalKeys.all }),
  });
}
