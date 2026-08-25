import { useState } from 'react';
import { toast } from 'sonner';
import { useDonationDetail, useUpdateDonation } from '@/features/donation/queries';

// Owns the "Edit donation" modal state for the Master Donation Register —
// clerical-field + medical-exam correction (bag/segment/batch no,
// collectedAt, notes, fitness, medical exam/vitals). See DonationEditForm
// / donation.service.ts update().
export function useDonationEdit() {
  const [editDonationId, setEditDonationId] = useState(null);
  const { data: editDetail, isLoading: editDetailLoading } = useDonationDetail(editDonationId);
  const updateMutation = useUpdateDonation();

  const handleSaveEdit = async (id, data) => {
    try {
      await updateMutation.mutateAsync({ id, data });
      toast.success('Donation updated');
      setEditDonationId(null);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to update donation');
    }
  };

  return { editDonationId, setEditDonationId, editDetail, editDetailLoading, handleSaveEdit };
}
