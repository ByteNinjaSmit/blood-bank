// BloodUnit state machine.
//
// Every status change on a BloodUnit MUST flow through `transition` so
// no caller (controller, service, queue) can put a unit into an
// impossible state. The machine encodes the clinical workflow:
//
//   COLLECTED -> IN_TESTING -> QUARANTINE -> RELEASED -> RESERVED
//             -> CROSSMATCHED -> ISSUED -> TRANSFUSED
//                                       -> RETURNED_UNUSED
//                                       -> RESERVED (UNISSUE, operator correction)
//   Any state can fork to DISCARDED (with a reason) or EXPIRED.
//
// Tests in state-machine.test.ts enumerate the matrix.

import { InvalidUnitTransition } from '@/shared/errors';
import type { UnitStatus } from '@/shared/enums';

export const UNIT_EVENT = [
  'BEGIN_TESTING',
  'AWAIT_TTI', // testing finished, results recorded but not yet released
  'RELEASE', // TTI cleared + grouping confirmed
  'SEPARATION_COMPLETE', // component separation signed off; TTI still pending
  'RESERVE',
  'UNRESERVE',
  'CROSSMATCH_PASS',
  'CROSSMATCH_FAIL',
  'ISSUE',
  // Operator correction: an issue recorded by mistake is reverted one step
  // back to RESERVED (still held against the same requisition, ready to be
  // issued again) — not all the way to stock. Distinct from RETURN_UNUSED,
  // which is the clinical "bag went out, came back unused" path — UNISSUE
  // means "it never should have left in the first place."
  'UNISSUE',
  'CONFIRM_TRANSFUSION',
  'RETURN_UNUSED',
  'DISCARD',
  'EXPIRE',
  // Narrow, guarded reversal: a unit auto-discarded for a reactive TTI
  // result gets one way back to QUARANTINE if that result is later
  // corrected. Nothing else may leave DISCARDED.
  'REINSTATE',
  // A released (in-stock) unit whose TTI result is corrected to
  // shadeness (indeterminate) gets pulled back off the shelf pending
  // retest — not discarded, just held. RELEASE from QUARANTINE is the
  // existing, already-legal way back out once retested clean.
  'QUARANTINE_HOLD',
] as const;
export type UnitEvent = (typeof UNIT_EVENT)[number];

type Transition = { from: UnitStatus; event: UnitEvent; to: UnitStatus };

const TRANSITIONS: ReadonlyArray<Transition> = [
  { from: 'COLLECTED', event: 'BEGIN_TESTING', to: 'IN_TESTING' },
  // Component-separation sign-off, TTI still pending -> QUARANTINE.
  // (If TTI is already released by the time separation completes, that
  // case chains BEGIN_TESTING -> AWAIT_TTI -> RELEASE instead — there is
  // deliberately no COLLECTED -> RELEASED shortcut; the TTI gate must
  // always be walked, never bypassed.)
  { from: 'COLLECTED', event: 'SEPARATION_COMPLETE', to: 'QUARANTINE' },
  { from: 'COLLECTED', event: 'DISCARD', to: 'DISCARDED' },
  { from: 'COLLECTED', event: 'EXPIRE', to: 'EXPIRED' },

  { from: 'IN_TESTING', event: 'AWAIT_TTI', to: 'QUARANTINE' },
  { from: 'IN_TESTING', event: 'DISCARD', to: 'DISCARDED' },
  { from: 'IN_TESTING', event: 'EXPIRE', to: 'EXPIRED' },

  { from: 'QUARANTINE', event: 'RELEASE', to: 'RELEASED' },
  { from: 'QUARANTINE', event: 'DISCARD', to: 'DISCARDED' },
  { from: 'QUARANTINE', event: 'EXPIRE', to: 'EXPIRED' },

  { from: 'RELEASED', event: 'RESERVE', to: 'RESERVED' },
  { from: 'RELEASED', event: 'DISCARD', to: 'DISCARDED' },
  { from: 'RELEASED', event: 'EXPIRE', to: 'EXPIRED' },
  { from: 'RELEASED', event: 'QUARANTINE_HOLD', to: 'QUARANTINE' },

  { from: 'RESERVED', event: 'UNRESERVE', to: 'RELEASED' },
  { from: 'RESERVED', event: 'ISSUE', to: 'ISSUED' },
  { from: 'RESERVED', event: 'CROSSMATCH_PASS', to: 'CROSSMATCHED' },
  { from: 'RESERVED', event: 'CROSSMATCH_FAIL', to: 'RELEASED' },
  { from: 'RESERVED', event: 'DISCARD', to: 'DISCARDED' },
  { from: 'RESERVED', event: 'EXPIRE', to: 'EXPIRED' },

  { from: 'CROSSMATCHED', event: 'ISSUE', to: 'ISSUED' },
  { from: 'CROSSMATCHED', event: 'UNRESERVE', to: 'RELEASED' },
  { from: 'CROSSMATCHED', event: 'DISCARD', to: 'DISCARDED' },
  { from: 'CROSSMATCHED', event: 'EXPIRE', to: 'EXPIRED' },

  { from: 'ISSUED', event: 'CONFIRM_TRANSFUSION', to: 'TRANSFUSED' },
  { from: 'ISSUED', event: 'RETURN_UNUSED', to: 'RETURNED_UNUSED' },
  { from: 'ISSUED', event: 'UNISSUE', to: 'RESERVED' },
  { from: 'ISSUED', event: 'DISCARD', to: 'DISCARDED' },

  { from: 'DISCARDED', event: 'REINSTATE', to: 'QUARANTINE' },
];

// Build a fast lookup table once.
const INDEX: ReadonlyMap<string, UnitStatus> = (() => {
  const m = new Map<string, UnitStatus>();
  for (const t of TRANSITIONS) m.set(`${t.from}|${t.event}`, t.to);
  return m;
})();

export function transition(from: UnitStatus, event: UnitEvent, unitId?: string): UnitStatus {
  const to = INDEX.get(`${from}|${event}`);
  if (!to) throw new InvalidUnitTransition(from, event, unitId);
  return to;
}

export function canTransition(from: UnitStatus, event: UnitEvent): boolean {
  return INDEX.has(`${from}|${event}`);
}

export function allowedEvents(from: UnitStatus): UnitEvent[] {
  return TRANSITIONS.filter((t) => t.from === from).map((t) => t.event);
}

export const TERMINAL_STATUSES = new Set<UnitStatus>([
  'TRANSFUSED',
  'RETURNED_UNUSED',
  'DISCARDED',
  'EXPIRED',
]);

export function isTerminal(status: UnitStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}
