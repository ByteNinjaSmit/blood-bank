import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleApi } from './api';

export const roleKeys = {
  all: ['role'],
  list: (f) => ['role', 'list', f ?? {}],
  detail: (id) => ['role', 'detail', id],
};

export function useRoleList(filters) {
  return useQuery({
    queryKey: roleKeys.list(filters),
    queryFn: () => roleApi.list(filters),
    staleTime: 60_000,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roleApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => roleApi.update(id, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: roleKeys.all });
      qc.invalidateQueries({ queryKey: roleKeys.detail(id) });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => roleApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  });
}
