import { describe, it, expect } from 'vitest';
import { selectUnits, type SelectableUnit } from './fefo';
import type { SpecialNeed } from '@/shared/enums';

const NOW = new Date('2026-05-30T00:00:00Z');

function unit(partial: Partial<SelectableUnit> & Pick<SelectableUnit, 'unitId'>): SelectableUnit {
  return {
    componentType: 'PRBC',
    aboGroup: 'A',
    rhFactor: 'POSITIVE',
    expiresAt: new Date('2026-07-01T00:00:00Z'),
    specialAttributes: new Set<SpecialNeed>(),
    status: 'RELEASED',
    ...partial,
  };
}

describe('FEFO selector', () => {
  it('picks units closest to expiry first', () => {
    const inv = [
      unit({ unitId: 'late', expiresAt: new Date('2026-08-01') }),
      unit({ unitId: 'soon', expiresAt: new Date('2026-06-05') }),
      unit({ unitId: 'mid', expiresAt: new Date('2026-07-10') }),
    ];
    const r = selectUnits(inv, {
      recipient: { aboGroup: 'A', rhFactor: 'POSITIVE' },
      component: 'PRBC',
      specialNeeds: [],
      unitsRequired: 2,
      now: NOW,
    });
    expect(r.selected.map((s) => s.unit.unitId)).toEqual(['soon', 'mid']);
    expect(r.shortage).toBe(0);
  });

  it('prefers exact match before compatible even if compatible expires sooner', () => {
    const inv = [
      // Compatible (O+ to A+) expires earliest
      unit({ unitId: 'o-soon', aboGroup: 'O', expiresAt: new Date('2026-06-05') }),
      // Exact A+ expires later
      unit({ unitId: 'a-later', aboGroup: 'A', expiresAt: new Date('2026-07-10') }),
    ];
    const r = selectUnits(inv, {
      recipient: { aboGroup: 'A', rhFactor: 'POSITIVE' },
      component: 'PRBC',
      specialNeeds: [],
      unitsRequired: 1,
      now: NOW,
    });
    expect(r.selected[0]?.unit.unitId).toBe('a-later');
    expect(r.selected[0]?.compatibilityType).toBe('EXACT');
  });

  it('respects Rh: O- patient cannot get O+ PRBC', () => {
    const inv = [unit({ unitId: 'o-pos', aboGroup: 'O', rhFactor: 'POSITIVE' })];
    const r = selectUnits(inv, {
      recipient: { aboGroup: 'O', rhFactor: 'NEGATIVE' },
      component: 'PRBC',
      specialNeeds: [],
      unitsRequired: 1,
      now: NOW,
    });
    expect(r.selected).toEqual([]);
    expect(r.shortage).toBe(1);
  });

  it('excludes expired units', () => {
    const inv = [
      unit({ unitId: 'past', expiresAt: new Date('2026-05-01') }),
      unit({ unitId: 'future', expiresAt: new Date('2026-06-15') }),
    ];
    const r = selectUnits(inv, {
      recipient: { aboGroup: 'A', rhFactor: 'POSITIVE' },
      component: 'PRBC',
      specialNeeds: [],
      unitsRequired: 2,
      now: NOW,
    });
    expect(r.selected.map((s) => s.unit.unitId)).toEqual(['future']);
    expect(r.shortage).toBe(1);
  });

  it('honours special needs as hard filter (irradiated required)', () => {
    const inv = [
      unit({ unitId: 'plain', specialAttributes: new Set() }),
      unit({
        unitId: 'irr',
        specialAttributes: new Set<SpecialNeed>(['IRRADIATED']),
      }),
    ];
    const r = selectUnits(inv, {
      recipient: { aboGroup: 'A', rhFactor: 'POSITIVE' },
      component: 'PRBC',
      specialNeeds: ['IRRADIATED'],
      unitsRequired: 1,
      now: NOW,
    });
    expect(r.selected.map((s) => s.unit.unitId)).toEqual(['irr']);
  });

  it('FFP for O- patient rejects A+ plasma (Rh ignored, but strict ABO same-group)', () => {
    const inv = [
      unit({
        unitId: 'a-pos-ffp',
        componentType: 'FFP',
        aboGroup: 'A',
        rhFactor: 'POSITIVE',
      }),
    ];
    const r = selectUnits(inv, {
      recipient: { aboGroup: 'O', rhFactor: 'NEGATIVE' },
      component: 'FFP',
      specialNeeds: [],
      unitsRequired: 1,
      now: NOW,
    });
    expect(r.selected).toHaveLength(0);
    expect(r.shortage).toBe(1);
  });

  it('reports shortage when supply insufficient', () => {
    const inv = [unit({ unitId: 'only' })];
    const r = selectUnits(inv, {
      recipient: { aboGroup: 'A', rhFactor: 'POSITIVE' },
      component: 'PRBC',
      specialNeeds: [],
      unitsRequired: 3,
      now: NOW,
    });
    expect(r.selected).toHaveLength(1);
    expect(r.shortage).toBe(2);
  });
});
