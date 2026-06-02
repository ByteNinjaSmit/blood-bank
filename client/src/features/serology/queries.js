import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serologyApi } from './api';

export const serologyKeys = {
  all: ['tti'],
  byDonation: (id) => ['tti', 'donation', id],
};

export function useTtiResult(donationId) {
  return useQuery({
    queryKey: serologyKeys.byDonation(donationId),
    queryFn: () => serologyApi.getByDonation(donationId),
    enabled: Boolean(donationId),
    staleTime: 30_000,
  });
}

export function useRecordTests() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ donationId, data }) => serologyApi.recordTests(donationId, data),
    onSuccess: (_d, { donationId }) =>
      qc.invalidateQueries({ queryKey: serologyKeys.byDonation(donationId) }),
  });
}

export function useFinalizeTti() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ donationId, data }) => serologyApi.finalize(donationId, data),
    onSuccess: (_d, { donationId }) => {
      qc.invalidateQueries({ queryKey: serologyKeys.byDonation(donationId) });
      // Unit statuses change on finalize — invalidate inventory
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
