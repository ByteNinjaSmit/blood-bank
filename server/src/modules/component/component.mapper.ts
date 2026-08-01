// Pure mapping helpers shared across the component module's
// list/near-expiry/detail views. No I/O — kept separate from the
// repository so the legacy-shape translation is unit-testable and
// isn't duplicated per-endpoint like it was in the original monolith.
import type { UnitStatus } from '@/shared/enums';

export type LegacyUnitStatus =
  | 'in-stock'
  | 'reserved'
  | 'issued'
  | 'discarded'
  | 'quarantined'
  | 'testing'
  | 'collected';

/**
 * Maps a BloodUnit's canonical status (+ its donation's TTI decision,
 * needed to distinguish "awaiting results" from "flagged indeterminate")
 * to the legacy status vocabulary the client's component views render.
 */
export function toLegacyUnitStatus(
  status: UnitStatus,
  ttiReleaseDecision?: string,
): LegacyUnitStatus {
  switch (status) {
    case 'RELEASED':
      return 'in-stock';
    case 'RESERVED':
    case 'CROSSMATCHED':
      return 'reserved';
    case 'ISSUED':
    case 'TRANSFUSED':
      return 'issued';
    case 'DISCARDED':
    case 'EXPIRED':
      return 'discarded';
    case 'QUARANTINE':
      return ttiReleaseDecision === 'indeterminate' ? 'quarantined' : 'testing';
    case 'IN_TESTING':
      return 'testing';
    case 'COLLECTED':
      return 'collected';
    default:
      return 'in-stock';
  }
}

// Fixed mandatory TTI panel, in report order, with the legacy test-name
// labels already used elsewhere (discard register, serology views).
const SEROLOGY_TEST_ORDER: ReadonlyArray<{ internal: string; label: string }> = [
  { internal: 'HIV', label: 'HIV' },
  { internal: 'HBSAG', label: 'HBsAg' },
  { internal: 'HCV', label: 'HCV' },
  { internal: 'SYPHILIS', label: 'VDRL' },
  { internal: 'MALARIA', label: 'MP' },
];

export interface SerologyTestResult {
  test: string;
  result: 'Reactive' | 'Negative' | 'Shadeness' | 'Not Tested';
}

function toLegacyResult(result?: string): SerologyTestResult['result'] {
  if (result === 'REACTIVE') return 'Reactive';
  if (result === 'NEGATIVE') return 'Negative';
  if (result === 'INDETERMINATE') return 'Shadeness';
  return 'Not Tested';
}

/**
 * Maps a TtiResult document's `tests` array onto the fixed 5-test panel
 * (one row per test, always present so the Excel export has stable
 * columns even for bags not yet tested), for display against a single
 * bag's Serological Test Report.
 */
export function mapSerologyTests(
  tti: { tests?: Array<{ testName: string; result: string }> } | null | undefined,
): SerologyTestResult[] {
  const byName = new Map((tti?.tests ?? []).map((t) => [t.testName, t.result]));
  return SEROLOGY_TEST_ORDER.map(({ internal, label }) => ({
    test: label,
    result: toLegacyResult(byName.get(internal)),
  }));
}

const ISSUED_STATUSES = new Set(['ISSUED', 'TRANSFUSED', 'RETURNED_UNUSED']);

/**
 * True once any of a donation's units has ever left the bank (currently
 * ISSUED/TRANSFUSED/RETURNED_UNUSED, or its history shows an ISSUE
 * event even if since discarded). Used to lock TTI results and
 * component/separation edits — once a component is out the door, its
 * source data becomes permanently read-only.
 */
export function hasLeftBank(
  units: Array<{ status?: string; statusHistory?: Array<{ to?: string }> }>,
): boolean {
  return units.some(
    (u) =>
      (u.status && ISSUED_STATUSES.has(u.status)) ||
      (u.statusHistory || []).some((h) => h.to === 'ISSUED'),
  );
}
