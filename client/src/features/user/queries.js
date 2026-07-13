import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from './api';

export const userKeys = {
  all: ['user'],
  list: (f) => ['user', 'list', f ?? {}],
  detail: (id) => ['user', 'detail', id],
};

export function useUserList(filters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => userApi.list(filters),
    staleTime: 60_000,
  });
}

export function useUserDetail(id) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userApi.detail(id),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: userApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => userApi.update(id, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      qc.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => userApi.deactivate(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}
