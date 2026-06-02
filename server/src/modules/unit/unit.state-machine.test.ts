import { describe, it, expect } from 'vitest';
import {
  transition,
  canTransition,
  allowedEvents,
  isTerminal,
} from './unit.state-machine';
import { InvalidUnitTransition } from '@/shared/errors';

describe('BloodUnit state machine', () => {
  it('walks the happy path COLLECTED -> TRANSFUSED', () => {
    let s = transition('COLLECTED', 'BEGIN_TESTING');
    expect(s).toBe('IN_TESTING');
    s = transition(s, 'AWAIT_TTI');
    expect(s).toBe('QUARANTINE');
    s = transition(s, 'RELEASE');
    expect(s).toBe('RELEASED');
    s = transition(s, 'RESERVE');
    expect(s).toBe('RESERVED');
    s = transition(s, 'CROSSMATCH_PASS');
    expect(s).toBe('CROSSMATCHED');
    s = transition(s, 'ISSUE');
    expect(s).toBe('ISSUED');
    s = transition(s, 'CONFIRM_TRANSFUSION');
    expect(s).toBe('TRANSFUSED');
    expect(isTerminal(s)).toBe(true);
  });

  it('allows DISCARD from non-terminal states', () => {
    for (const from of [
      'COLLECTED',
      'IN_TESTING',
      'QUARANTINE',
      'RELEASED',
      'RESERVED',
      'CROSSMATCHED',
      'ISSUED',
    ] as const) {
      expect(canTransition(from, 'DISCARD')).toBe(true);
    }
  });

  it('cannot release directly from COLLECTED (must pass TTI)', () => {
    expect(() => transition('COLLECTED', 'RELEASE')).toThrow(InvalidUnitTransition);
  });

  it('cannot issue without crossmatch', () => {
    expect(() => transition('RESERVED', 'ISSUE')).toThrow(InvalidUnitTransition);
    expect(() => transition('RELEASED', 'ISSUE')).toThrow(InvalidUnitTransition);
  });

  it('failed crossmatch returns to RELEASED', () => {
    expect(transition('RESERVED', 'CROSSMATCH_FAIL')).toBe('RELEASED');
  });

  it('issued unit can be returned unused', () => {
    expect(transition('ISSUED', 'RETURN_UNUSED')).toBe('RETURNED_UNUSED');
    expect(isTerminal('RETURNED_UNUSED')).toBe(true);
  });

  it('terminal statuses have no outgoing events', () => {
    for (const t of ['TRANSFUSED', 'RETURNED_UNUSED', 'DISCARDED', 'EXPIRED'] as const) {
      expect(allowedEvents(t)).toEqual([]);
      expect(isTerminal(t)).toBe(true);
    }
  });
});
