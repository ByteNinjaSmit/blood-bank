// Pure helpers for the Master Donation Register — no React, no side effects.

// Derives a normalized status from a donation record (falls back to the TTI
// release decision when an explicit status isn't present).
export function donationStatus(d) {
  return d.status || (d.ttiReleaseDecision === 'released' ? 'passed' : d.ttiReleaseDecision === 'reactive' ? 'failed' : 'pending');
}

export function tabEmptyText(activeTab) {
  if (activeTab === 'inhouse') return 'No inhouse donations found.';
  if (activeTab === 'camp') return 'No camp donations found.';
  return 'No donations found in the master register.';
}
