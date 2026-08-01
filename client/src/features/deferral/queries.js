import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deferralApi } from './api';

export const deferralKeys = {
  all: ['deferral'],
  list: (f) => ['deferral', 'list', f ?? {}],
  byDonor: (id) => ['deferral', 'donor', id],
};

export function useDeferralList(filters) {
  return useQuery({
    queryKey: deferralKeys.list(filters),
    queryFn: () => deferralApi.list(filters),
    staleTime: 30_000,
  });
}

export function useDeferralsByDonor(donorId) {
  return useQuery({
    queryKey: deferralKeys.byDonor(donorId),
    queryFn: () => deferralApi.listByDonor(donorId),
    enabled: Boolean(donorId),
    staleTime: 30_000,
  });
}

export function useCreateDeferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deferralApi.create,
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: deferralKeys.byDonor(vars.donor) });
      // Donor eligibility changes when deferred
      qc.invalidateQueries({ queryKey: ['donor', 'detail', vars.donor] });
    },
  });
}

export function useLiftDeferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => deferralApi.lift(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deferralKeys.all }),
  });
}
