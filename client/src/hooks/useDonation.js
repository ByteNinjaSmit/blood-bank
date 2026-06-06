import { useState } from 'react';
import { toast } from 'sonner';
import {
  donationKeys,
  useDonationList,
  useDonationDetail,
  useCreateDonation,
} from '@/features/donation/queries';

export {
  donationKeys,
  useDonationList,
  useDonationDetail,
  useCreateDonation,
};

// Backward-compatible hook for pages that use the imperative { donations, fetchDonations, ... } API.
export function useDonation() {
  const [filters, setFilters] = useState({});
  const listQuery = useDonationList(filters);
  const createMutation = useCreateDonation();

  const loading = listQuery.isLoading || createMutation.isPending;

  return {
    donations: listQuery.data?.data ?? (Array.isArray(listQuery.data) ? listQuery.data : []),
    pagination: listQuery.data?.pagination ?? { currentPage: 1, totalPages: 1, totalBags: 0 },
    loading,
    error: listQuery.error?.message ?? null,
    fetchDonations: (f) => setFilters(f ?? {}),
    fetchCampDonations: (campId) => setFilters({ campId }),
    createDonation: async (data) => {
      try {
        const result = await createMutation.mutateAsync(data);
        toast.success('Donation created successfully');
        return { success: true, data: result };
      } catch (e) {
        toast.error(e?.message ?? 'Failed to create donation');
        return { success: false };
      }
    },
  };
}
