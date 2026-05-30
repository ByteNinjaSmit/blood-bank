// Donor eligibility rules. Pure functions, no DB. Encode the
// minimum-interval and deferral checks required before accepting a new
// donation event. Sources:
//   - India NACO / DGHS guidelines (default)
//   - AABB Standards (alternate config — see locale.ts when added)
//
// Numbers here are India defaults. When the locale-config layer
// lands (decision #7 from rebuild-decisions), these become per-site
// overridable.

import type { DonationType } from '@/shared/enums';

export type Sex = 'M' | 'F' | 'O';

export interface IntervalRule {
  /** Minimum days since last donation of any type. */
  minDaysSinceAnyDonation: number;
  /** Minimum days since the last donation of this specific type. */
  minDaysSinceSameType: number;
}

// India defaults (NACO).
const INTERVAL_RULES_INDIA: Readonly<Record<DonationType, (sex: Sex) => IntervalRule>> = {
  WHOLE_BLOOD: (sex) => ({
    minDaysSinceAnyDonation: sex === 'F' ? 120 : 90,
    minDaysSinceSameType: sex === 'F' ? 120 : 90,
  }),
  PLATELETPHERESIS: () => ({
    minDaysSinceAnyDonation: 2,
    minDaysSinceSameType: 7,
  }),
  PLASMAPHERESIS: () => ({
    minDaysSinceAnyDonation: 2,
    minDaysSinceSameType: 14,
  }),
  DOUBLE_RED_CELL: () => ({
    minDaysSinceAnyDonation: 112, // 16 weeks
    minDaysSinceSameType: 112,
  }),
  AUTOLOGOUS: () => ({ minDaysSinceAnyDonation: 3, minDaysSinceSameType: 3 }),
  DIRECTED: (sex) => ({
    minDaysSinceAnyDonation: sex === 'F' ? 120 : 90,
    minDaysSinceSameType: sex === 'F' ? 120 : 90,
  }),
  REPLACEMENT: (sex) => ({
    minDaysSinceAnyDonation: sex === 'F' ? 120 : 90,
    minDaysSinceSameType: sex === 'F' ? 120 : 90,
  }),
};

export interface DonorEligibilitySnapshot {
  ageYears: number;
  weightKg: number;
  sex: Sex;
  hbGdl?: number;
  pulseBpm?: number;
  temperatureCelsius?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  lastDonationDate?: Date;
  lastDonationType?: DonationType;
  activeDeferrals: ReadonlyArray<{
    type: 'TEMPORARY' | 'PERMANENT';
    untilDate?: Date;
    reason: string;
  }>;
}

export interface EligibilityCheckInput {
  donor: DonorEligibilitySnapshot;
  proposedDonationType: DonationType;
  now?: Date;
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

const MIN_AGE_YEARS = 18;
const MAX_AGE_YEARS = 65;
const MIN_WEIGHT_KG_WB = 45;
const MIN_WEIGHT_KG_APHERESIS = 50;
const MIN_HB_MALE = 13.0;
const MIN_HB_FEMALE = 12.5;
const MIN_PULSE = 60;
const MAX_PULSE = 100;
const MAX_TEMP_C = 37.5;
const SYSTOLIC_RANGE = { min: 100, max: 180 };
const DIASTOLIC_RANGE = { min: 60, max: 100 };

export function checkEligibility(input: EligibilityCheckInput): EligibilityResult {
  const reasons: string[] = [];
  const now = input.now ?? new Date();
  const d = input.donor;

  if (d.ageYears < MIN_AGE_YEARS || d.ageYears > MAX_AGE_YEARS) {
    reasons.push(`Age ${d.ageYears.toFixed(1)} outside ${MIN_AGE_YEARS}-${MAX_AGE_YEARS}`);
  }

  const isApheresis =
    input.proposedDonationType === 'PLATELETPHERESIS' ||
    input.proposedDonationType === 'PLASMAPHERESIS' ||
    input.proposedDonationType === 'DOUBLE_RED_CELL';
  const minWeight = isApheresis ? MIN_WEIGHT_KG_APHERESIS : MIN_WEIGHT_KG_WB;
  if (d.weightKg < minWeight) {
    reasons.push(`Weight ${d.weightKg}kg below ${minWeight}kg minimum for ${input.proposedDonationType}`);
  }

  if (d.hbGdl !== undefined) {
    const minHb = d.sex === 'F' ? MIN_HB_FEMALE : MIN_HB_MALE;
    if (d.hbGdl < minHb) reasons.push(`Hb ${d.hbGdl} g/dL below ${minHb} threshold`);
  }

  if (d.pulseBpm !== undefined && (d.pulseBpm < MIN_PULSE || d.pulseBpm > MAX_PULSE)) {
    reasons.push(`Pulse ${d.pulseBpm} outside ${MIN_PULSE}-${MAX_PULSE} bpm`);
  }

  if (d.temperatureCelsius !== undefined && d.temperatureCelsius > MAX_TEMP_C) {
    reasons.push(`Temperature ${d.temperatureCelsius}°C exceeds ${MAX_TEMP_C}°C`);
  }

  if (d.bloodPressure) {
    if (
      d.bloodPressure.systolic < SYSTOLIC_RANGE.min ||
      d.bloodPressure.systolic > SYSTOLIC_RANGE.max
    ) {
      reasons.push(
        `Systolic BP ${d.bloodPressure.systolic} outside ${SYSTOLIC_RANGE.min}-${SYSTOLIC_RANGE.max}`,
      );
    }
    if (
      d.bloodPressure.diastolic < DIASTOLIC_RANGE.min ||
      d.bloodPressure.diastolic > DIASTOLIC_RANGE.max
    ) {
      reasons.push(
        `Diastolic BP ${d.bloodPressure.diastolic} outside ${DIASTOLIC_RANGE.min}-${DIASTOLIC_RANGE.max}`,
      );
    }
  }

  for (const def of d.activeDeferrals) {
    if (def.type === 'PERMANENT') {
      reasons.push(`Permanent deferral: ${def.reason}`);
    } else if (def.untilDate && def.untilDate.getTime() > now.getTime()) {
      reasons.push(
        `Temporary deferral until ${def.untilDate.toISOString().slice(0, 10)}: ${def.reason}`,
      );
    }
  }

  if (d.lastDonationDate) {
    const rule = INTERVAL_RULES_INDIA[input.proposedDonationType](d.sex);
    const daysSince = Math.floor(
      (now.getTime() - d.lastDonationDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const need =
      d.lastDonationType === input.proposedDonationType
        ? rule.minDaysSinceSameType
        : rule.minDaysSinceAnyDonation;
    if (daysSince < need) {
      reasons.push(`Only ${daysSince} day(s) since last donation; need ${need} for ${input.proposedDonationType}`);
    }
  }

  return { eligible: reasons.length === 0, reasons };
}

export function yearsBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}
