import { useState } from 'react';
import { toast } from 'sonner';
import {
  useCampList,
  useCampDetail,
  useCreateCamp,
  useUpdateCamp,
  useDeleteCamp,
  useRestoreCamp,
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
  useRestoreCamp,
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
  const restoreMutation = useRestoreCamp();

  const loading =
    listQuery.isLoading ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    restoreMutation.isPending;

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
    updateCamp: async (id, data, editReason) => {
      try {
        await updateMutation.mutateAsync({ id, data, editReason });
        toast.success('Camp updated successfully');
        return { success: true };
      } catch (e) {
        toast.error(e?.message ?? 'Failed to update camp');
        return { success: false };
      }
    },
    deleteCamp: async (id, reason) => {
      try {
        const result = await deleteMutation.mutateAsync({ id, reason });
        const permanentlyDeleted = Boolean(result?.permanentlyDeleted);
        toast.success(
          permanentlyDeleted
            ? 'Camp permanently deleted'
            : 'Camp deleted. It remains in the list and can be permanently removed next.',
        );
        return { success: true, permanentlyDeleted };
      } catch (e) {
        if (e && e.code) {
          return { success: false, code: e.code, message: e.message };
        }
        toast.error(e?.message ?? 'Failed to delete camp');
        return { success: false };
      }
    },
    restoreCamp: async (id) => {
      try {
        await restoreMutation.mutateAsync(id);
        toast.success('Camp restored');
        return { success: true };
      } catch (e) {
        toast.error(e?.message ?? 'Failed to restore camp');
        return { success: false };
      }
    },
  };
}
