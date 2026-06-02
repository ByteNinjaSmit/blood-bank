// Component-aware ABO/Rh compatibility engine.
//
// Sources:
//   - Repo doc: "Blood Compatibility - Crossmatch Rules.md"
//   - AABB Technical Manual (component-specific rules)
//   - Domain research in memory/domain-quick-ref.md
//
// Core insight: ABO/Rh rules differ per component. RBC follows the
// standard donor->recipient table. Plasma is the INVERSE (O recipient
// can receive any plasma; AB only AB). Platelets prefer ABO-identical
// but can cross. Cryo is any.

import type { AboGroup, ComponentType, RhFactor } from '@/shared/enums';

export type CompatibilityType = 'EXACT' | 'COMPATIBLE';
export type Strictness = 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';

// ---------------------------------------------------------------------
// ABO rules per component
// ---------------------------------------------------------------------

const ABO_RBC: Readonly<Record<AboGroup, ReadonlyArray<AboGroup>>> = {
  O: ['O'],
  A: ['A', 'O'],
  B: ['B', 'O'],
  AB: ['A', 'B', 'AB', 'O'],
};

// Plasma is the inverse table. Anti-A and anti-B antibodies in the
// donor plasma must be acceptable to the recipient's red cells.
const ABO_PLASMA: Readonly<Record<AboGroup, ReadonlyArray<AboGroup>>> = {
  O: ['O', 'A', 'B', 'AB'],
  A: ['A', 'AB'],
  B: ['B', 'AB'],
  AB: ['AB'],
};

// Platelets: prefer ABO-identical, accept compatible. Any group can
// fall back to any other when supply is constrained — handled by the
// preference list returned, not by hard exclusion.
const ABO_PLATELET_PREF: Readonly<Record<AboGroup, ReadonlyArray<AboGroup>>> = {
  O: ['O', 'A', 'B', 'AB'],
  A: ['A', 'AB', 'O', 'B'],
  B: ['B', 'AB', 'O', 'A'],
  AB: ['AB', 'A', 'B', 'O'],
};

// Cryoprecipitate: any ABO acceptable. Preference order = recipient first.
const ABO_CRYO_PREF: Readonly<Record<AboGroup, ReadonlyArray<AboGroup>>> = {
  O: ['O', 'A', 'B', 'AB'],
  A: ['A', 'O', 'AB', 'B'],
  B: ['B', 'O', 'AB', 'A'],
  AB: ['AB', 'A', 'B', 'O'],
};

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Donor ABO groups acceptable for the given recipient and component.
 * Order matters: index 0 is the most preferred (typically exact match).
 */
export function compatibleAboGroups(
  recipient: AboGroup,
  component: ComponentType,
): ReadonlyArray<AboGroup> {
  switch (rbcFamily(component)) {
    case 'RBC':
      return ABO_RBC[recipient];
    case 'PLASMA':
      return ABO_PLASMA[recipient];
    case 'PLATELET':
      return ABO_PLATELET_PREF[recipient];
    case 'CRYO':
      return ABO_CRYO_PREF[recipient];
    case 'WHOLE_BLOOD':
      // Whole blood ABO must match recipient exactly (carries both RBC and plasma).
      return [recipient];
  }
}

/**
 * Whether a given donor Rh can be transfused to a given recipient Rh
 * for the chosen component.
 *
 *   RBC + whole blood: Rh-negative recipients must receive Rh-negative units.
 *                      Rh-positive recipients can receive either.
 *   Plasma + cryo:     Rh irrelevant (no red cells present).
 *   Platelets:         Rh preferred but not mandatory. We do not exclude
 *                      here — caller should rank exact matches first.
 */
export function isRhAcceptable(
  recipient: RhFactor,
  donor: RhFactor,
  component: ComponentType,
): boolean {
  switch (rbcFamily(component)) {
    case 'RBC':
    case 'WHOLE_BLOOD':
      if (recipient === 'NEGATIVE') return donor === 'NEGATIVE';
      return true;
    case 'PLASMA':
    case 'CRYO':
      return true;
    case 'PLATELET':
      return true;
  }
}

/**
 * Crossmatch requirement per component. Only RBC-bearing components
 * need a serological crossmatch between donor unit and recipient sample.
 */
export function requiresCrossmatch(component: ComponentType): boolean {
  return rbcFamily(component) === 'RBC' || rbcFamily(component) === 'WHOLE_BLOOD';
}

/**
 * Classify how strictly compatibility is enforced for the component.
 */
export function strictness(component: ComponentType): Strictness {
  switch (rbcFamily(component)) {
    case 'RBC':
    case 'WHOLE_BLOOD':
      return 'HIGH';
    case 'PLASMA':
      return 'MEDIUM';
    case 'PLATELET':
      return 'LOW';
    case 'CRYO':
      return 'VERY_LOW';
  }
}

/**
 * Composite check: ABO acceptable AND Rh acceptable for the component.
 */
export function isCompatible(
  recipient: { aboGroup: AboGroup; rhFactor: RhFactor },
  donor: { aboGroup: AboGroup; rhFactor: RhFactor },
  component: ComponentType,
): boolean {
  if (!compatibleAboGroups(recipient.aboGroup, component).includes(donor.aboGroup)) {
    return false;
  }
  return isRhAcceptable(recipient.rhFactor, donor.rhFactor, component);
}

/**
 * Classify a candidate unit as an exact match (same ABO + Rh) or merely
 * compatible. Used by selection ranking.
 */
export function classify(
  recipient: { aboGroup: AboGroup; rhFactor: RhFactor },
  donor: { aboGroup: AboGroup; rhFactor: RhFactor },
): CompatibilityType {
  return recipient.aboGroup === donor.aboGroup && recipient.rhFactor === donor.rhFactor
    ? 'EXACT'
    : 'COMPATIBLE';
}

// ---------------------------------------------------------------------
// Internal: group components into compatibility families.
// ---------------------------------------------------------------------

type Family = 'RBC' | 'PLASMA' | 'PLATELET' | 'CRYO' | 'WHOLE_BLOOD';

function rbcFamily(component: ComponentType): Family {
  switch (component) {
    case 'PRBC':
    case 'IRRADIATED_PRBC':
    case 'WASHED_PRBC':
    case 'LEUKOREDUCED_PRBC':
      return 'RBC';
    case 'FFP':
      return 'PLASMA';
    case 'PLATELET_CONCENTRATE':
    case 'SDP':
      return 'PLATELET';
    case 'CRYOPRECIPITATE':
      return 'CRYO';
    case 'WHOLE_BLOOD':
      return 'WHOLE_BLOOD';
  }
}
