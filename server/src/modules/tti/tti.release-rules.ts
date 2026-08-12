// TTI release decision logic. Pure function. Given the recorded test
// panel, decide whether the donation's units can be released, must be
// discarded (reactive), or need re-test (indeterminate / incomplete).

import type { TtiTest, TtiResult } from '@/shared/enums';
import type { ReleaseDecision } from '@/modules/tti/tti.repository';

// India NACO mandatory panel. All five must be NEGATIVE to release.
export const MANDATORY_PANEL: ReadonlyArray<TtiTest> = [
  'HIV',
  'HBSAG',
  'HCV',
  'SYPHILIS',
  'MALARIA',
];

export interface PanelEntry {
  testName: TtiTest;
  result: TtiResult;
}

export interface ReleaseEvaluation {
  decision: ReleaseDecision;
  reasons: string[];
}

export function evaluateRelease(panel: ReadonlyArray<PanelEntry>): ReleaseEvaluation {
  const reasons: string[] = [];

  // Latest result per test (a re-test overrides an earlier one).
  const latest = new Map<TtiTest, TtiResult>();
  for (const e of panel) latest.set(e.testName, e.result);

  // Any reactive = donation rejected, donor flagged for lookback.
  const reactive = [...latest.entries()].filter(([, r]) => r === 'REACTIVE');
  if (reactive.length > 0) {
    return {
      decision: 'reactive',
      reasons: reactive.map(([t]) => `${t} reactive`),
    };
  }

  // Missing mandatory tests = cannot release yet.
  const missing = MANDATORY_PANEL.filter((t) => !latest.has(t));
  if (missing.length > 0) {
    reasons.push(`Missing tests: ${missing.join(', ')}`);
    return { decision: 'pending', reasons };
  }

  // Indeterminate ("shadeness") or Pending (held for retest, same
  // clinical treatment as shadeness) on any mandatory test = on hold.
  const held = MANDATORY_PANEL.filter(
    (t) => latest.get(t) === 'INDETERMINATE' || latest.get(t) === 'PENDING',
  );
  if (held.length > 0) {
    return {
      decision: 'indeterminate',
      reasons: held.map((t) => `${t} ${latest.get(t) === 'PENDING' ? 'pending' : 'shadeness'}`),
    };
  }

  // All mandatory negative.
  return { decision: 'released', reasons: [] };
}

// Whether the panel's latest per-test results include a 'PENDING' hold —
// distinguishes a Pending-tab bag from a plain Shadeness (indeterminate)
// bag even though both map to the same 'indeterminate' release decision.
export function hasPendingResult(panel: ReadonlyArray<PanelEntry>): boolean {
  const latest = new Map<TtiTest, TtiResult>();
  for (const e of panel) latest.set(e.testName, e.result);
  return MANDATORY_PANEL.some((t) => latest.get(t) === 'PENDING');
}
