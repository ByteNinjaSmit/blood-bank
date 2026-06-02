import { describe, it, expect } from 'vitest';
import { checkIssueGate, type IssueGateInput } from './issue.gate';

function base(over: Partial<IssueGateInput> = {}): IssueGateInput {
  return {
    componentType: 'PRBC',
    unitStatus: 'CROSSMATCHED',
    ttiReleaseDecision: 'released',
    crossmatchResult: 'COMPATIBLE',
    unitSpecialAttributes: [],
    patientSpecialNeeds: [],
    ...over,
  };
}

describe('issue gate — RBC', () => {
  it('allows when TTI released + crossmatch compatible + status CROSSMATCHED', () => {
    expect(checkIssueGate(base()).allowed).toBe(true);
  });

  it('blocks when TTI not released, even with valid crossmatch', () => {
    const r = checkIssueGate(base({ ttiReleaseDecision: 'pending' }));
    expect(r.allowed).toBe(false);
    expect(r.blockers.some((b) => b.includes('TTI'))).toBe(true);
  });

  it('blocks incompatible crossmatch without override', () => {
    const r = checkIssueGate(base({ crossmatchResult: 'INCOMPATIBLE' }));
    expect(r.allowed).toBe(false);
  });

  it('allows incompatible crossmatch WITH valid MO override', () => {
    const r = checkIssueGate(
      base({
        crossmatchResult: 'INCOMPATIBLE',
        override: { isOverride: true, reason: 'Life-threatening haemorrhage', authorizedBy: 'mo-1' },
      }),
    );
    expect(r.allowed).toBe(true);
    expect(r.usedOverride).toBe(true);
  });

  it('override cannot bypass TTI gate', () => {
    const r = checkIssueGate(
      base({
        ttiReleaseDecision: 'pending',
        crossmatchResult: 'INCOMPATIBLE',
        override: { isOverride: true, reason: 'emergency', authorizedBy: 'mo-1' },
      }),
    );
    expect(r.allowed).toBe(false);
    expect(r.blockers.some((b) => b.includes('TTI'))).toBe(true);
  });

  it('override without reason is rejected', () => {
    const r = checkIssueGate(
      base({
        crossmatchResult: 'INCOMPATIBLE',
        override: { isOverride: true, authorizedBy: 'mo-1' },
      }),
    );
    expect(r.allowed).toBe(false);
  });
});

describe('issue gate — special needs', () => {
  it('blocks when patient needs irradiated but unit is not', () => {
    const r = checkIssueGate(
      base({ patientSpecialNeeds: ['IRRADIATED'], unitSpecialAttributes: [] }),
    );
    expect(r.allowed).toBe(false);
    expect(r.blockers.some((b) => b.includes('IRRADIATED'))).toBe(true);
  });

  it('special needs cannot be overridden', () => {
    const r = checkIssueGate(
      base({
        patientSpecialNeeds: ['CMV_NEGATIVE'],
        unitSpecialAttributes: [],
        crossmatchResult: 'INCOMPATIBLE',
        override: { isOverride: true, reason: 'x', authorizedBy: 'mo-1' },
      }),
    );
    expect(r.allowed).toBe(false);
  });

  it('allows when unit carries the required special attribute', () => {
    const r = checkIssueGate(
      base({ patientSpecialNeeds: ['IRRADIATED'], unitSpecialAttributes: ['IRRADIATED'] }),
    );
    expect(r.allowed).toBe(true);
  });
});

describe('issue gate — non-crossmatch components', () => {
  it('FFP issues from RESERVED status with no crossmatch needed', () => {
    const r = checkIssueGate(
      base({ componentType: 'FFP', unitStatus: 'RESERVED', crossmatchResult: undefined }),
    );
    expect(r.allowed).toBe(true);
  });
});
