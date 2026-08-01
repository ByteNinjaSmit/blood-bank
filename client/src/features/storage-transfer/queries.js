import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storageTransferApi } from './api';

export const storageTransferKeys = {
  list: (f) => ['storage-transfer', 'list', f ?? {}],
  detail: (id) => ['storage-transfer', 'detail', id],
};

export function useStorageTransferList(params) {
  return useQuery({
    queryKey: storageTransferKeys.list(params),
    queryFn: () => storageTransferApi.list(params),
    staleTime: 30_000,
  });
}

export function useCreateStorageTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => storageTransferApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['storage-transfer', 'list'] }),
  });
}

export function useUpdateStorageTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, editReason }) => storageTransferApi.update(id, data, editReason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['storage-transfer', 'list'] }),
  });
}

export function useDeleteStorageTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => storageTransferApi.remove(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['storage-transfer', 'list'] }),
  });
}

export function useRestoreStorageTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => storageTransferApi.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['storage-transfer', 'list'] }),
  });
}
