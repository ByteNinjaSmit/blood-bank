import { describe, it, expect } from 'vitest';
import {
  compatibleAboGroups,
  isRhAcceptable,
  requiresCrossmatch,
  strictness,
  isCompatible,
  classify,
} from './abo-rh';

describe('ABO compatibility — RBC', () => {
  it('O recipient accepts O only', () => {
    expect(compatibleAboGroups('O', 'PRBC')).toEqual(['O']);
  });
  it('A accepts A and O', () => {
    expect([...compatibleAboGroups('A', 'PRBC')]).toEqual(['A', 'O']);
  });
  it('B accepts B and O', () => {
    expect([...compatibleAboGroups('B', 'PRBC')]).toEqual(['B', 'O']);
  });
  it('AB accepts all four', () => {
    expect(new Set(compatibleAboGroups('AB', 'PRBC'))).toEqual(new Set(['O', 'A', 'B', 'AB']));
  });
});

describe('ABO compatibility — Plasma (inverse table)', () => {
  it('O recipient accepts plasma from all four', () => {
    expect(new Set(compatibleAboGroups('O', 'FFP'))).toEqual(new Set(['O', 'A', 'B', 'AB']));
  });
  it('AB recipient accepts only AB plasma', () => {
    expect([...compatibleAboGroups('AB', 'FFP')]).toEqual(['AB']);
  });
  it('A recipient accepts A and AB plasma', () => {
    expect(new Set(compatibleAboGroups('A', 'FFP'))).toEqual(new Set(['A', 'AB']));
  });
  it('B recipient accepts B and AB plasma', () => {
    expect(new Set(compatibleAboGroups('B', 'FFP'))).toEqual(new Set(['B', 'AB']));
  });
});

describe('Rh rules', () => {
  it('RBC: Rh-neg recipient cannot receive Rh-pos', () => {
    expect(isRhAcceptable('NEGATIVE', 'POSITIVE', 'PRBC')).toBe(false);
    expect(isRhAcceptable('NEGATIVE', 'NEGATIVE', 'PRBC')).toBe(true);
  });
  it('RBC: Rh-pos recipient can receive either', () => {
    expect(isRhAcceptable('POSITIVE', 'POSITIVE', 'PRBC')).toBe(true);
    expect(isRhAcceptable('POSITIVE', 'NEGATIVE', 'PRBC')).toBe(true);
  });
  it('FFP + Cryo: Rh ignored', () => {
    expect(isRhAcceptable('NEGATIVE', 'POSITIVE', 'FFP')).toBe(true);
    expect(isRhAcceptable('NEGATIVE', 'POSITIVE', 'CRYOPRECIPITATE')).toBe(true);
  });
  it('Platelets: Rh preferred not mandatory', () => {
    expect(isRhAcceptable('NEGATIVE', 'POSITIVE', 'SDP')).toBe(true);
  });
});

describe('Crossmatch requirement', () => {
  it('required for RBC + WB only', () => {
    expect(requiresCrossmatch('PRBC')).toBe(true);
    expect(requiresCrossmatch('IRRADIATED_PRBC')).toBe(true);
    expect(requiresCrossmatch('WHOLE_BLOOD')).toBe(true);
    expect(requiresCrossmatch('FFP')).toBe(false);
    expect(requiresCrossmatch('SDP')).toBe(false);
    expect(requiresCrossmatch('CRYOPRECIPITATE')).toBe(false);
  });
});

describe('Strictness label', () => {
  it.each([
    ['PRBC', 'HIGH'],
    ['FFP', 'MEDIUM'],
    ['SDP', 'LOW'],
    ['CRYOPRECIPITATE', 'VERY_LOW'],
  ] as const)('%s -> %s', (component, expected) => {
    expect(strictness(component)).toBe(expected);
  });
});

describe('Composite + classify', () => {
  it('A+ patient with A+ unit is exact compatible', () => {
    const p = { aboGroup: 'A', rhFactor: 'POSITIVE' } as const;
    const d = { aboGroup: 'A', rhFactor: 'POSITIVE' } as const;
    expect(isCompatible(p, d, 'PRBC')).toBe(true);
    expect(classify(p, d)).toBe('EXACT');
  });
  it('A+ patient with O+ unit is compatible but not exact', () => {
    const p = { aboGroup: 'A', rhFactor: 'POSITIVE' } as const;
    const d = { aboGroup: 'O', rhFactor: 'POSITIVE' } as const;
    expect(isCompatible(p, d, 'PRBC')).toBe(true);
    expect(classify(p, d)).toBe('COMPATIBLE');
  });
  it('O- patient cannot receive A+ RBC', () => {
    const p = { aboGroup: 'O', rhFactor: 'NEGATIVE' } as const;
    const d = { aboGroup: 'A', rhFactor: 'POSITIVE' } as const;
    expect(isCompatible(p, d, 'PRBC')).toBe(false);
  });
  it('O- patient CAN receive A+ FFP (plasma is inverse, Rh ignored)', () => {
    const p = { aboGroup: 'O', rhFactor: 'NEGATIVE' } as const;
    const d = { aboGroup: 'A', rhFactor: 'POSITIVE' } as const;
    expect(isCompatible(p, d, 'FFP')).toBe(true);
  });
});
