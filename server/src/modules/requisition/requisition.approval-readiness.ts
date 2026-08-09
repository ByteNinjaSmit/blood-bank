// Pure domain rule: is a matched requisition ready to be approved?
//
// A requisition may only be approved once, for every proposed bag, the
// operator has recorded a compatible crossmatch (when required) and a
// substitute-compatibility sign-off (for non-exact groups). Blood-grouping
// worksheets are no longer captured in the UI, so they are not part of this
// gate. The client gates the Approve button on the same checks; this is the
// server-side guarantee so the invariant holds regardless of which entry
// point calls approve.
import type { MatchedUnitDto } from '@/modules/requisition/requisition.repository';

/**
 * Human-readable reasons the requisition cannot yet be approved. Empty array =
 * ready. Only the proposed bags are considered, so a partial match still gates
 * on exactly the components being carried forward.
 */
export function approvalBlockers(matchedUnits: MatchedUnitDto[]): string[] {
  const reasons: string[] = [];
  const bags = Array.isArray(matchedUnits) ? matchedUnits : [];
  if (bags.length === 0) return reasons; // nothing to fulfil

  for (const m of bags) {
    if (m.crossmatchRequired && m.crossmatchStatus !== 'COMPATIBLE') {
      reasons.push(`Bag ${m.unitId} does not have a compatible crossmatch recorded.`);
    }
    if (m.compatibilityType === 'COMPATIBLE' && !m.compatibilityConfirmed) {
      reasons.push(`Substitute compatibility for bag ${m.unitId} has not been confirmed.`);
    }
  }
  return reasons;
}
