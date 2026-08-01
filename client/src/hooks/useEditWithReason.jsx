import { useState } from 'react';
import ReasonForChangeModal from '@/components/shared/ReasonForChangeModal';

/**
 * Centralized "Reason for Change" flow for Edit operations. Wraps an
 * existing save handler so the mandatory-reason dialog is one shared
 * component, not copy-pasted per page.
 *
 * The reason is NEVER persisted into the business document — `onSave`
 * receives it as a second argument so the caller can thread it only
 * into the API call's audit-adjacent field (see donor/vendor api.js
 * for the `_editReason` convention), never into the patch body itself.
 *
 * Pass `skip: true` for the two exempted flows (Donor Registration
 * Update, Blood Requisition Update) — wrappedSave then calls onSave
 * directly with no dialog.
 *
 * Usage:
 *   const { wrappedSave, EditReasonDialog } = useEditWithReason({
 *     onSave: (data, reason) => vendorApi.update(id, data, reason),
 *   });
 *   <form onSubmit={(e) => { e.preventDefault(); wrappedSave(formData); }}>
 *   {EditReasonDialog}
 */
export function useEditWithReason({
  onSave,
  skip = false,
  title = 'Confirm Changes',
  message = 'Please provide a reason for this change. It will be recorded in the audit trail.',
  fieldLabel = 'Reason for Change',
}) {
  const [pendingData, setPendingData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const wrappedSave = async (data) => {
    if (skip) return onSave(data);
    setPendingData(data);
    return undefined;
  };

  const cancelSave = () => setPendingData(null);

  const confirmSave = async (reason) => {
    if (pendingData === null) return;
    setSubmitting(true);
    try {
      await onSave(pendingData, reason);
      setPendingData(null);
    } finally {
      setSubmitting(false);
    }
  };

  const EditReasonDialog = (
    <ReasonForChangeModal
      isOpen={pendingData !== null}
      onClose={cancelSave}
      onConfirm={confirmSave}
      title={title}
      actionLabel="Save Changes"
      message={message}
      fieldLabel={fieldLabel}
      submitting={submitting}
    />
  );

  return { wrappedSave, cancelSave, EditReasonDialog };
}
