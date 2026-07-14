import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkTransferApi } from './api';

export const bulkTransferKeys = {
  list: (f) => ['bulk-transfer', 'list', f ?? {}],
  detail: (id) => ['bulk-transfer', 'detail', id],
};

export function useBulkTransferList(params) {
  return useQuery({
    queryKey: bulkTransferKeys.list(params),
    queryFn: () => bulkTransferApi.list(params),
    staleTime: 30_000,
  });
}

export function useCreateBulkTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => bulkTransferApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bulk-transfer', 'list'] }),
  });
}

export function useUpdateBulkTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, editReason }) => bulkTransferApi.update(id, data, editReason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bulk-transfer', 'list'] }),
  });
}

export function useDeleteBulkTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => bulkTransferApi.remove(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bulk-transfer', 'list'] }),
  });
}
