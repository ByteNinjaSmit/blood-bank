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

  // Indeterminate ("shadeness") on any mandatory test = on hold for re-test.
  const indeterminate = MANDATORY_PANEL.filter((t) => latest.get(t) === 'INDETERMINATE');
  if (indeterminate.length > 0) {
    return {
      decision: 'indeterminate',
      reasons: indeterminate.map((t) => `${t} shadeness`),
    };
  }

  // All mandatory negative.
  return { decision: 'released', reasons: [] };
}
