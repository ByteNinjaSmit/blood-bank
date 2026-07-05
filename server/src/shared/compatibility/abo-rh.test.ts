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

describe('ABO compatibility — Plasma (strict group-identical matching)', () => {
  it('O recipient accepts O only', () => {
    expect([...compatibleAboGroups('O', 'FFP')]).toEqual(['O']);
  });
  it('AB recipient accepts AB only', () => {
    expect([...compatibleAboGroups('AB', 'FFP')]).toEqual(['AB']);
  });
  it('A recipient accepts A only', () => {
    expect([...compatibleAboGroups('A', 'FFP')]).toEqual(['A']);
  });
  it('B recipient accepts B only', () => {
    expect([...compatibleAboGroups('B', 'FFP')]).toEqual(['B']);
  });
});

describe('ABO compatibility — Platelets with modes', () => {
  it('Universal mode (default) accepts all groups', () => {
    expect(new Set(compatibleAboGroups('A', 'SDP', 'UNIVERSAL'))).toEqual(new Set(['A', 'AB', 'O', 'B']));
  });
  it('Major compatibility mode follows RBC rules', () => {
    expect(new Set(compatibleAboGroups('A', 'SDP', 'MAJOR'))).toEqual(new Set(['A', 'O']));
  });
  it('Minor compatibility mode follows Plasma (inverse) rules', () => {
    expect(new Set(compatibleAboGroups('A', 'SDP', 'MINOR'))).toEqual(new Set(['A', 'AB']));
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
    ['FFP', 'MEDIUM'], // FFP clinical strictness label is still MEDIUM
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
  it('O- patient cannot receive A+ FFP (plasma is strict group-identical)', () => {
    const p = { aboGroup: 'O', rhFactor: 'NEGATIVE' } as const;
    const d = { aboGroup: 'A', rhFactor: 'POSITIVE' } as const;
    expect(isCompatible(p, d, 'FFP')).toBe(false);
  });
});
