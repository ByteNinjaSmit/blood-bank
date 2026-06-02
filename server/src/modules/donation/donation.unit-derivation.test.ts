import { describe, it, expect } from 'vitest';
import { deriveUnits } from './donation.unit-derivation';

const COLLECTED = new Date('2026-05-30T00:00:00Z');

describe('unit derivation defaults', () => {
  it('whole blood produces PRBC + FFP + platelet concentrate', () => {
    const units = deriveUnits({
      donationId: 'D-001',
      donationType: 'WHOLE_BLOOD',
      collectedAt: COLLECTED,
    });
    expect(units.map((u) => u.componentType)).toEqual([
      'PRBC',
      'FFP',
      'PLATELET_CONCENTRATE',
    ]);
    expect(units.every((u) => u.unitId.startsWith('D-001-'))).toBe(true);
  });

  it('PRBC expires 42 days after collection', () => {
    const [prbc] = deriveUnits({
      donationId: 'D-001',
      donationType: 'WHOLE_BLOOD',
      collectedAt: COLLECTED,
    });
    const diffDays =
      (prbc!.expiresAt.getTime() - COLLECTED.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(42);
  });

  it('plateletpheresis produces 1 SDP unit', () => {
    const units = deriveUnits({
      donationId: 'A-001',
      donationType: 'PLATELETPHERESIS',
      collectedAt: COLLECTED,
    });
    expect(units).toHaveLength(1);
    expect(units[0]!.componentType).toBe('SDP');
  });

  it('double red cell produces 2 PRBCs', () => {
    const units = deriveUnits({
      donationId: 'A-002',
      donationType: 'DOUBLE_RED_CELL',
      collectedAt: COLLECTED,
    });
    expect(units).toHaveLength(2);
    expect(units.every((u) => u.componentType === 'PRBC')).toBe(true);
    expect(new Set(units.map((u) => u.unitId)).size).toBe(2);
  });

  it('override templates take precedence over defaults', () => {
    const units = deriveUnits({
      donationId: 'D-002',
      donationType: 'WHOLE_BLOOD',
      collectedAt: COLLECTED,
      overrideTemplates: [
        { componentType: 'PRBC', volumeMl: 280, shelfLifeDays: 35 },
      ],
    });
    expect(units).toHaveLength(1);
    expect(units[0]!.volumeMl).toBe(280);
  });
});
