import { useState } from 'react';
import ReasonForChangeModal from '@/components/shared/ReasonForChangeModal';

/**
 * Centralized "Reason for Deletion" flow. Wraps an existing delete
 * handler (`onDelete(target, reason)`) with a mandatory-reason
 * confirmation dialog, reusing ReasonForChangeModal — the one
 * component every module's delete/deactivate flow should render.
 *
 * Usage:
 *   const { requestDelete, DeleteReasonDialog } = useDeleteWithReason({
 *     onDelete: (donor, reason) => deleteDonor(donor._id, reason),
 *   });
 *   <button onClick={() => requestDelete(donor)}>Delete</button>
 *   {DeleteReasonDialog}
 */
export function useDeleteWithReason({
  onDelete,
  title = 'Confirm Deletion',
  message = 'This record will be moved to the Recycle Bin and can be restored later.',
  fieldLabel = 'Reason for Deletion',
}) {
  const [target, setTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const requestDelete = (item) => setTarget(item);
  const cancelDelete = () => setTarget(null);

  const confirmDelete = async (reason) => {
    if (!target) return;
    setSubmitting(true);
    try {
      await onDelete(target, reason);
      setTarget(null);
    } finally {
      setSubmitting(false);
    }
  };

  const DeleteReasonDialog = (
    <ReasonForChangeModal
      isOpen={Boolean(target)}
      onClose={cancelDelete}
      onConfirm={confirmDelete}
      title={title}
      actionLabel="Delete"
      message={message}
      fieldLabel={fieldLabel}
      submitting={submitting}
    />
  );

  return { requestDelete, cancelDelete, deleteTarget: target, DeleteReasonDialog };
}
