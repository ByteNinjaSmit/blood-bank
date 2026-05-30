import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as donorApi from './api';

export const donorKeys = {
  all: ['donor'],
  list: (filters = {}) => ['donor', 'list', filters],
  detail: (id) => ['donor', 'detail', id],
};

export function useDonorListQuery(filters = {}, options = {}) {
  return useQuery({
    queryKey: donorKeys.list(filters),
    queryFn: () => donorApi.listDonors(filters),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useDonorQuery(id, options = {}) {
  return useQuery({
    queryKey: donorKeys.detail(id),
    queryFn: () => donorApi.getDonor(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateDonorMutation(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => donorApi.createDonor(input),
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: donorKeys.all });
      toast.success('Donor created');
      options.onSuccess?.(data, vars, ctx);
    },
    onError: (err) => {
      toast.error(err?.message ?? 'Failed to create donor');
      options.onError?.(err);
    },
    ...options,
  });
}

export function useUpdateDonorMutation(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => donorApi.updateDonor(id, patch),
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: donorKeys.all });
      qc.invalidateQueries({ queryKey: donorKeys.detail(vars.id) });
      toast.success('Donor updated');
      options.onSuccess?.(data, vars, ctx);
    },
    onError: (err) => {
      toast.error(err?.message ?? 'Failed to update donor');
      options.onError?.(err);
    },
    ...options,
  });
}

export function useDeleteDonorMutation(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => donorApi.deleteDonor(id),
    onSuccess: (data, id, ctx) => {
      qc.invalidateQueries({ queryKey: donorKeys.all });
      toast.success('Donor deleted');
      options.onSuccess?.(data, id, ctx);
    },
    onError: (err) => {
      toast.error(err?.message ?? 'Failed to delete donor');
      options.onError?.(err);
    },
    ...options,
  });
}
