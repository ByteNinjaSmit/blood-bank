import { describe, it, expect } from 'vitest';
import { evaluateRelease, MANDATORY_PANEL, type PanelEntry } from './tti.release-rules';

const allNegative: PanelEntry[] = MANDATORY_PANEL.map((testName) => ({
  testName,
  result: 'NEGATIVE',
}));

describe('TTI release evaluation', () => {
  it('releases when full mandatory panel negative', () => {
    expect(evaluateRelease(allNegative).decision).toBe('released');
  });

  it('rejects (reactive) if any test reactive', () => {
    const panel = [...allNegative];
    panel[0] = { testName: MANDATORY_PANEL[0]!, result: 'REACTIVE' };
    const r = evaluateRelease(panel);
    expect(r.decision).toBe('reactive');
    expect(r.reasons[0]).toMatch(/reactive/);
  });

  it('stays pending when a mandatory test missing', () => {
    const panel = allNegative.slice(0, 3); // drop two
    const r = evaluateRelease(panel);
    expect(r.decision).toBe('pending');
    expect(r.reasons[0]).toMatch(/Missing tests/);
  });

  it('on-hold (indeterminate) when a mandatory test indeterminate', () => {
    const panel = [...allNegative];
    panel[1] = { testName: MANDATORY_PANEL[1]!, result: 'INDETERMINATE' };
    expect(evaluateRelease(panel).decision).toBe('indeterminate');
  });

  it('latest result overrides earlier (re-test negative clears indeterminate)', () => {
    const panel = [
      ...allNegative,
      { testName: MANDATORY_PANEL[2]!, result: 'INDETERMINATE' as const },
      { testName: MANDATORY_PANEL[2]!, result: 'NEGATIVE' as const }, // re-test
    ];
    expect(evaluateRelease(panel).decision).toBe('released');
  });

  it('reactive wins even if also has negatives', () => {
    const panel = [...allNegative, { testName: MANDATORY_PANEL[4]!, result: 'REACTIVE' as const }];
    expect(evaluateRelease(panel).decision).toBe('reactive');
  });
});
