// Shared readiness gate for requisition approval / issue.
//
// A requisition may only be approved (and, downstream, issued) once the
// operator has recorded, for every proposed bag: the recipient serum/cell
// grouping, that bag's own grouping worksheet, a compatible crossmatch (when
// required), and a substitute-compatibility sign-off (for non-exact groups).
//
// Both the list (`useRequisitionList`) and the Manage stepper
// (`RequisitionManagement`) consume this so the two entry points cannot
// disagree — the list once let an ungrouped/uncrossmatched request be approved
// straight from the table, bypassing the stepper's gate.
//
// Operates on the enriched client shape (lowercase enums, `matchedInventory`).

// True when a grouping worksheet has at least one recorded reaction.
export function groupingHasValue(g) {
  if (!g) return false;
  for (const section of ['cellGrouping', 'serumGrouping', 'rhTyping']) {
    const vals = g[section] ? Object.values(g[section]) : [];
    if (vals.some((v) => v)) return true;
  }
  return false;
}

// Human-readable reasons a requisition is not yet ready to approve/issue.
// Empty array = ready. Only the proposed (available) bags are considered, so a
// partial match still gates on exactly the components being carried forward.
export function requisitionApprovalBlockers(doc) {
  const reasons = [];
  const bags = Array.isArray(doc?.matchedInventory) ? doc.matchedInventory : [];
  if (bags.length === 0) return reasons; // nothing to fulfil (all unavailable/rejected)

  if (!groupingHasValue(doc?.recipientGrouping)) {
    reasons.push('Enter and save the recipient serum/cell grouping.');
  }
  for (const mi of bags) {
    const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
    const bagNo = inv?.bagNo?.bagNo || inv?._id || 'bag';
    if (mi.crossmatchRequired && mi.crossmatchStatus !== 'compatible') {
      reasons.push(`Record a compatible crossmatch for ${bagNo}.`);
    }
    if ((mi.compatibilityType || 'exact') === 'compatible' && !mi.compatibilityConfirmed) {
      reasons.push(`Confirm compatibility for substitute bag ${bagNo}.`);
    }
    if (!groupingHasValue(mi.grouping)) {
      reasons.push(`Enter and save the bag grouping for ${bagNo}.`);
    }
  }
  return reasons;
}
