import { useState } from 'react';
import { toast } from 'sonner';
import {
  donorKeys,
  useDonorList,
  useDonorDetail,
  useCreateDonor,
  useUpdateDonor,
  useDeleteDonor,
  useRestoreDonor,
  useDonorSearch,
} from '@/features/donor/queries';

export {
  donorKeys,
  useDonorList,
  useDonorDetail,
  useCreateDonor,
  useUpdateDonor,
  useDeleteDonor,
  useRestoreDonor,
  useDonorSearch,
};

// Backward-compatible hook for pages that use the imperative { donors, fetchDonors, ... } API.
export function useDonor() {
  const [filters, setFilters] = useState({});
  const listQuery = useDonorList(filters);
  const createMutation = useCreateDonor();
  const updateMutation = useUpdateDonor();
  const deleteMutation = useDeleteDonor();
  const restoreMutation = useRestoreDonor();

  const loading =
    listQuery.isLoading ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    restoreMutation.isPending;

  return {
    donors: listQuery.data?.items ?? (Array.isArray(listQuery.data) ? listQuery.data : []),
    loading,
    error: listQuery.error?.message ?? null,
    fetchDonors: (f) => setFilters(f ?? {}),
    fetchCampDonors: (campId) => setFilters({ campId, pageSize: 10000 }),
    createDonor: async (data) => {
      try {
        const result = await createMutation.mutateAsync(data);
        toast.success('Donor created successfully');
        return { success: true, data: result };
      } catch (e) {
        toast.error(e?.message ?? 'Failed to create donor');
        return { success: false };
      }
    },
    updateDonor: async (id, data) => {
      try {
        const result = await updateMutation.mutateAsync({ id, data });
        toast.success('Donor updated successfully');
        return { success: true, data: result };
      } catch (e) {
        toast.error(e?.message ?? 'Failed to update donor');
        return { success: false };
      }
    },
    deleteDonor: async (id, reason) => {
      try {
        const result = await deleteMutation.mutateAsync({ id, reason });
        const permanentlyDeleted = Boolean(result?.permanentlyDeleted);
        toast.success(
          permanentlyDeleted
            ? 'Donor permanently deleted'
            : 'Donor deleted. It remains in the register and can be permanently removed next.',
        );
        return { success: true, permanentlyDeleted };
      } catch (e) {
        // Return structured error code if backend complains (e.g. donor has donations)
        if (e && e.code) {
          return { success: false, code: e.code, message: e.message };
        }
        toast.error(e?.message ?? 'Failed to delete donor');
        return { success: false };
      }
    },
    restoreDonor: async (id) => {
      try {
        await restoreMutation.mutateAsync(id);
        toast.success('Donor restored');
        return { success: true };
      } catch (e) {
        toast.error(e?.message ?? 'Failed to restore donor');
        return { success: false };
      }
    },
  };
}
