import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { donationApi } from './api';

export const donationKeys = {
  all: ['donation'],
  list: (f) => ['donation', 'list', f ?? {}],
  detail: (id) => ['donation', 'detail', id],
};

export function useDonationList(filters) {
  return useQuery({
    queryKey: donationKeys.list(filters),
    queryFn: () => donationApi.list(filters),
    staleTime: 30_000,
  });
}

export function useDonationDetail(id) {
  return useQuery({
    queryKey: donationKeys.detail(id),
    queryFn: () => donationApi.detail(id),
    enabled: Boolean(id),
  });
}

export function useCreateDonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: donationApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: donationKeys.all }),
  });
}
