// Pure domain rule: is a matched requisition ready to be approved?
//
// A requisition may only be approved once, for every proposed bag, the
// operator has recorded the recipient serum/cell grouping, that bag's own
// grouping worksheet, a compatible crossmatch (when required), and a
// substitute-compatibility sign-off (for non-exact groups). The client gates
// the Approve button on the same checks; this is the server-side guarantee so
// the invariant holds regardless of which entry point calls approve.
import type { GroupingWorksheetDto, MatchedUnitDto } from '@/modules/requisition/requisition.repository';

// True when a grouping worksheet has at least one recorded reaction.
function groupingHasValue(g?: GroupingWorksheetDto | null): boolean {
  if (!g) return false;
  const sections: Array<keyof GroupingWorksheetDto> = ['cellGrouping', 'serumGrouping', 'rhTyping'];
  for (const section of sections) {
    const obj = g[section];
    if (obj && Object.values(obj).some((v) => v)) return true;
  }
  return false;
}

/**
 * Human-readable reasons the requisition cannot yet be approved. Empty array =
 * ready. Only the proposed bags are considered, so a partial match still gates
 * on exactly the components being carried forward.
 */
export function approvalBlockers(
  matchedUnits: MatchedUnitDto[],
  recipientGrouping?: GroupingWorksheetDto | null,
): string[] {
  const reasons: string[] = [];
  const bags = Array.isArray(matchedUnits) ? matchedUnits : [];
  if (bags.length === 0) return reasons; // nothing to fulfil

  if (!groupingHasValue(recipientGrouping)) {
    reasons.push('Recipient serum/cell grouping has not been recorded.');
  }
  for (const m of bags) {
    if (m.crossmatchRequired && m.crossmatchStatus !== 'COMPATIBLE') {
      reasons.push(`Bag ${m.unitId} does not have a compatible crossmatch recorded.`);
    }
    if (m.compatibilityType === 'COMPATIBLE' && !m.compatibilityConfirmed) {
      reasons.push(`Substitute compatibility for bag ${m.unitId} has not been confirmed.`);
    }
    if (!groupingHasValue(m.grouping)) {
      reasons.push(`Bag ${m.unitId} grouping worksheet has not been recorded.`);
    }
  }
  return reasons;
}
