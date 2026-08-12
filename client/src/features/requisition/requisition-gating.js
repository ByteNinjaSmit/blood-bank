// Shared readiness gate for requisition approval / issue.
//
// A requisition may only be approved (and, downstream, issued) once the
// operator has recorded, for every proposed bag: a compatible crossmatch
// (when required), and a substitute-compatibility sign-off (for non-exact
// groups). Blood-grouping worksheets are no longer captured in the UI —
// only the compatibility result is.
//
// Both the list (`useRequisitionList`) and the Manage stepper
// (`RequisitionManagement`) consume this so the two entry points cannot
// disagree — the list once let an uncrossmatched request be approved
// straight from the table, bypassing the stepper's gate.
//
// Operates on the enriched client shape (lowercase enums, `matchedInventory`).

// Human-readable reasons a requisition is not yet ready to approve/issue.
// Empty array = ready. Only the proposed (available) bags are considered, so a
// partial match still gates on exactly the components being carried forward.
export function requisitionApprovalBlockers(doc) {
  const reasons = [];
  const bags = Array.isArray(doc?.matchedInventory) ? doc.matchedInventory : [];
  if (bags.length === 0) return reasons; // nothing to fulfil (all unavailable/rejected)

  for (const mi of bags) {
    const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
    const bagNo = inv?.bagNo?.bagNo || inv?._id || 'bag';
    if (mi.crossmatchRequired && mi.crossmatchStatus !== 'compatible') {
      reasons.push(`Record a compatible crossmatch for ${bagNo}.`);
    }
    if ((mi.compatibilityType || 'exact') === 'compatible' && !mi.compatibilityConfirmed) {
      reasons.push(`Confirm compatibility for substitute bag ${bagNo}.`);
    }
  }
  return reasons;
}
