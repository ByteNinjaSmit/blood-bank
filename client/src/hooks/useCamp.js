import { useState } from 'react';
import { toast } from 'sonner';
import {
  useCampList,
  useCampDetail,
  useCreateCamp,
  useUpdateCamp,
  useDeleteCamp,
  useStaffList,
  useCampDonations,
  useCampDonors,
  useVoluntaryDonations,
} from '@/features/camp/queries';

export {
  useCampList,
  useCampDetail,
  useCreateCamp,
  useUpdateCamp,
  useDeleteCamp,
  useStaffList,
  useCampDonations,
  useCampDonors,
  useVoluntaryDonations,
};

// Backward-compatible hook for pages that use the imperative { camps, fetchCamps, ... } API.
export function useCamp() {
  const [filters, setFilters] = useState({});
  const listQuery = useCampList(filters);
  const createMutation = useCreateCamp();
  const updateMutation = useUpdateCamp();
  const deleteMutation = useDeleteCamp();

  const loading =
    listQuery.isLoading ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return {
    camps: listQuery.data ?? [],
    loading,
    error: listQuery.error?.message ?? null,
    fetchCamps: (f) => setFilters(f ?? {}),
    createCamp: async (data) => {
      try {
        const result = await createMutation.mutateAsync(data);
        toast.success('Camp created successfully');
        return { success: true, data: result };
      } catch (e) {
        toast.error(e?.message ?? 'Failed to create camp');
        return { success: false };
      }
    },
    updateCamp: async (id, data) => {
      try {
        await updateMutation.mutateAsync({ id, data });
        toast.success('Camp updated successfully');
        return { success: true };
      } catch (e) {
        toast.error(e?.message ?? 'Failed to update camp');
        return { success: false };
      }
    },
    deleteCamp: async (id) => {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('Camp deleted successfully');
        return { success: true };
      } catch (e) {
        toast.error(e?.message ?? 'Failed to delete camp');
        return { success: false };
      }
    },
  };
}
