// Shared donor-eligibility helpers (frontend mirror of the server rule in
// donor.repository.ts): a donor must wait a minimum interval after donating
// before they can donate again — 90 days for men, 120 days for women.

export function donationWaitDays(sex) {
  // Treat anything starting with F (F / Female / female) as female.
  return typeof sex === 'string' && sex.trim().toUpperCase().startsWith('F') ? 120 : 90;
}

/**
 * True when the donor last donated inside their mandatory waiting window
 * (i.e. not yet eligible to donate again purely on the interval rule).
 *
 * Prefers the server-computed fields (which use the donor's *actual* last
 * donation date from the donations collection) and only falls back to the
 * stored profile `lastDonationDate` when those aren't present.
 */
export function isWithinDonationInterval(donor, now = new Date()) {
  if (typeof donor?.isAvailableToDonate === 'boolean') {
    return donor.isAvailableToDonate === false;
  }
  if (typeof donor?.daysUntilEligible === 'number') {
    return donor.daysUntilEligible > 0;
  }
  if (!donor?.lastDonationDate) return false;
  const last = new Date(donor.lastDonationDate);
  if (isNaN(last.getTime())) return false;
  const diffDays = Math.floor((now.getTime() - last.getTime()) / 86_400_000);
  return diffDays < donationWaitDays(donor.sex);
}

/** Whole days remaining before the donor clears their waiting window (0 if clear). */
export function daysUntilEligible(donor, now = new Date()) {
  if (typeof donor?.daysUntilEligible === 'number') return donor.daysUntilEligible;
  if (!donor?.lastDonationDate) return 0;
  const last = new Date(donor.lastDonationDate);
  if (isNaN(last.getTime())) return 0;
  const diffDays = Math.floor((now.getTime() - last.getTime()) / 86_400_000);
  return Math.max(0, donationWaitDays(donor.sex) - diffDays);
}

/**
 * The status to actually display/act on. An 'eligible' donor who is still
 * inside their post-donation waiting window is surfaced as 'recently-donated'
 * (not selectable for a fresh donation); everything else passes through.
 */
export function getEffectiveEligibility(donor, now = new Date()) {
  const status = donor?.eligibilityStatus;
  if (status === 'eligible' && isWithinDonationInterval(donor, now)) {
    return 'recently-donated';
  }
  return status;
}

/** Can this donor be selected to start a new donation right now? */
export function canDonateNow(donor, now = new Date()) {
  return getEffectiveEligibility(donor, now) === 'eligible';
}
