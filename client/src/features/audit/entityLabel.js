// Resolves human-readable label for an audit entry.
// Prefer the backend-supplied entityLabel; if missing, fall back to bagNo/donationId/donorId/entityId
// instead of a bare placeholder so staff can always identify and search deleted or legacy records.
export function entityRef(entry) {
  if (entry?.entityLabel) return entry.entityLabel;

  const bagNo = entry?.after?.bagNo || entry?.before?.bagNo;
  const donationId = entry?.after?.donationId || entry?.before?.donationId;
  if (bagNo && donationId) return `${bagNo} (${donationId})`;
  if (bagNo) return bagNo;
  if (donationId) return donationId;

  const donorId =
    entry?.after?.donorId ||
    entry?.before?.donorId ||
    entry?.after?.donor ||
    entry?.before?.donor;
  if (donorId) return donorId;

  if (entry?.entityId) return entry.entityId;

  return 'Unlabeled record';
}
