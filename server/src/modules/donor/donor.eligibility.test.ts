import { describe, it, expect } from 'vitest';
import { checkEligibility, type DonorEligibilitySnapshot } from './donor.eligibility';

const NOW = new Date('2026-05-30T00:00:00Z');

function baseSnap(over: Partial<DonorEligibilitySnapshot> = {}): DonorEligibilitySnapshot {
  return {
    ageYears: 30,
    weightKg: 60,
    sex: 'M',
    hbGdl: 14,
    pulseBpm: 72,
    temperatureCelsius: 36.8,
    bloodPressure: { systolic: 120, diastolic: 80 },
    activeDeferrals: [],
    ...over,
  };
}

describe('donor eligibility — happy path', () => {
  it('healthy donor for whole blood', () => {
    const r = checkEligibility({
      donor: baseSnap(),
      proposedDonationType: 'WHOLE_BLOOD',
      now: NOW,
    });
    expect(r.eligible).toBe(true);
    expect(r.reasons).toEqual([]);
  });
});

describe('donor eligibility — failure paths', () => {
  it('underweight blocks whole blood at <45kg', () => {
    const r = checkEligibility({
      donor: baseSnap({ weightKg: 44 }),
      proposedDonationType: 'WHOLE_BLOOD',
      now: NOW,
    });
    expect(r.eligible).toBe(false);
    expect(r.reasons[0]).toMatch(/Weight 44kg/);
  });

  it('apheresis needs 50kg, not 45kg', () => {
    const r = checkEligibility({
      donor: baseSnap({ weightKg: 47 }),
      proposedDonationType: 'PLASMAPHERESIS',
      now: NOW,
    });
    expect(r.eligible).toBe(false);
    expect(r.reasons.find((x) => x.includes('50kg'))).toBeTruthy();
  });

  it('low Hb blocks female donor at <12.5', () => {
    const r = checkEligibility({
      donor: baseSnap({ sex: 'F', hbGdl: 12.2 }),
      proposedDonationType: 'WHOLE_BLOOD',
      now: NOW,
    });
    expect(r.eligible).toBe(false);
    expect(r.reasons.find((x) => x.includes('Hb'))).toBeTruthy();
  });

  it('elevated temperature blocks', () => {
    const r = checkEligibility({
      donor: baseSnap({ temperatureCelsius: 38.1 }),
      proposedDonationType: 'WHOLE_BLOOD',
      now: NOW,
    });
    expect(r.eligible).toBe(false);
  });

  it('permanent deferral always blocks', () => {
    const r = checkEligibility({
      donor: baseSnap({
        activeDeferrals: [{ type: 'PERMANENT', reason: 'Anti-HCV reactive' }],
      }),
      proposedDonationType: 'WHOLE_BLOOD',
      now: NOW,
    });
    expect(r.eligible).toBe(false);
    expect(r.reasons[0]).toMatch(/Permanent deferral/);
  });

  it('active temporary deferral blocks; expired deferral does not', () => {
    const future = new Date('2026-08-01');
    const past = new Date('2026-01-01');
    const blocked = checkEligibility({
      donor: baseSnap({
        activeDeferrals: [{ type: 'TEMPORARY', untilDate: future, reason: 'Recent vaccine' }],
      }),
      proposedDonationType: 'WHOLE_BLOOD',
      now: NOW,
    });
    expect(blocked.eligible).toBe(false);
    const cleared = checkEligibility({
      donor: baseSnap({
        activeDeferrals: [{ type: 'TEMPORARY', untilDate: past, reason: 'Recent vaccine' }],
      }),
      proposedDonationType: 'WHOLE_BLOOD',
      now: NOW,
    });
    expect(cleared.eligible).toBe(true);
  });
});

describe('inter-donation interval (India NACO)', () => {
  it('male WB needs 90 days', () => {
    const lastTooSoon = new Date(NOW);
    lastTooSoon.setDate(lastTooSoon.getDate() - 80);
    const r = checkEligibility({
      donor: baseSnap({
        sex: 'M',
        lastDonationDate: lastTooSoon,
        lastDonationType: 'WHOLE_BLOOD',
      }),
      proposedDonationType: 'WHOLE_BLOOD',
      now: NOW,
    });
    expect(r.eligible).toBe(false);
    expect(r.reasons.find((x) => x.includes('80 day'))).toBeTruthy();
  });

  it('female WB needs 120 days', () => {
    const lastTooSoon = new Date(NOW);
    lastTooSoon.setDate(lastTooSoon.getDate() - 100);
    const r = checkEligibility({
      donor: baseSnap({
        sex: 'F',
        lastDonationDate: lastTooSoon,
        lastDonationType: 'WHOLE_BLOOD',
      }),
      proposedDonationType: 'WHOLE_BLOOD',
      now: NOW,
    });
    expect(r.eligible).toBe(false);
  });

  it('plasmapheresis only needs 2 days between any donations, 14 days same type', () => {
    const fourDaysAgo = new Date(NOW);
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
    // Last was a WHOLE_BLOOD; 4 days is >= 2 for cross-type rule → eligible.
    const okCross = checkEligibility({
      donor: baseSnap({
        lastDonationDate: fourDaysAgo,
        lastDonationType: 'WHOLE_BLOOD',
      }),
      proposedDonationType: 'PLASMAPHERESIS',
      now: NOW,
    });
    expect(okCross.eligible).toBe(true);
    // Same type; need 14 days — 4 days is too soon.
    const blockedSame = checkEligibility({
      donor: baseSnap({
        lastDonationDate: fourDaysAgo,
        lastDonationType: 'PLASMAPHERESIS',
      }),
      proposedDonationType: 'PLASMAPHERESIS',
      now: NOW,
    });
    expect(blockedSame.eligible).toBe(false);
  });

  it('no prior donation = no interval block', () => {
    const r = checkEligibility({
      donor: baseSnap(),
      proposedDonationType: 'WHOLE_BLOOD',
      now: NOW,
    });
    expect(r.eligible).toBe(true);
  });
});
