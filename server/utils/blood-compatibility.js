/**
 * blood-compatibility.js
 * ──────────────────────────────────────────────────────────────────
 * Medically-accurate blood component compatibility rules for
 * transfusion medicine.  Pure logic — no database dependencies.
 *
 * Reference SOPs:
 *   • AABB Technical Manual (20th ed.)
 *   • DGHS – Standards for Blood Banks & Blood Transfusion Services
 *
 * Component types handled: RBC, FFP, Platelet, Cryo
 * ──────────────────────────────────────────────────────────────────
 */

'use strict';

// ──────────────────────────────────────────────
// ABO COMPATIBILITY MATRICES
// Key   = recipient blood group
// Value = array of acceptable DONOR blood groups
// ──────────────────────────────────────────────

/**
 * RBC — Strict ABO rule
 * Recipient can only receive RBC from ABO-compatible donors.
 *   O  → O
 *   A  → A, O
 *   B  → B, O
 *   AB → A, B, AB, O
 */
const ABO_RBC = {
  O:  ['O'],
  A:  ['A', 'O'],
  B:  ['B', 'O'],
  AB: ['A', 'B', 'AB', 'O'],
};

/**
 * FFP / Plasma — Reverse ABO rule
 * Plasma contains anti-A / anti-B antibodies, so compatibility
 * is the REVERSE of RBC.
 *   O  → O, A, B, AB
 *   A  → A, AB
 *   B  → B, AB
 *   AB → AB
 */
const ABO_FFP = {
  O:  ['O', 'A', 'B', 'AB'],
  A:  ['A', 'AB'],
  B:  ['B', 'AB'],
  AB: ['AB'],
};

/**
 * Platelets — Preferred (ABO-identical preferred, but NOT mandatory)
 * In practice any ABO group is acceptable.  We prefer same-group
 * and sort exact matches first.
 *   O  → O  (preferred)   fallback: any
 *   A  → A  (preferred)   fallback: any
 *   B  → B  (preferred)   fallback: any
 *   AB → AB (preferred)   fallback: any
 */
const ABO_PLATELET_PREFERRED = {
  O:  ['O'],
  A:  ['A'],
  B:  ['B'],
  AB: ['AB'],
};
const ABO_PLATELET_ALL = ['A', 'B', 'AB', 'O'];

/**
 * Cryo — Optional ABO (ABO-identical preferred, any acceptable)
 * Real-world SOP allows any group for cryoprecipitate.
 *   Preferred: same group
 *   Allowed:   A, B, AB, O (all)
 */
const ABO_CRYO_PREFERRED = {
  O:  ['O'],
  A:  ['A'],
  B:  ['B'],
  AB: ['AB'],
};
const ABO_CRYO_ALL = ['A', 'B', 'AB', 'O'];

// ──────────────────────────────────────────────
// Rh COMPATIBILITY RULES (per component)
// ──────────────────────────────────────────────

/**
 * Rh rules per component type:
 *
 *   RBC:      STRICT — Rh− recipient can ONLY receive Rh−
 *                       Rh+ recipient can receive Rh+ or Rh−
 *   FFP:      IGNORE — Rh factor is irrelevant for plasma
 *   Platelet: OPTIONAL — Rh− preferred for Rh− recipient,
 *                         but Rh+ is acceptable
 *   Cryo:     IGNORE — Rh factor is irrelevant for cryo
 */
const RH_RULE = {
  RBC:      'strict',
  FFP:      'ignore',
  Platelet: 'optional',
  Cryo:     'ignore',
};

// ──────────────────────────────────────────────
// CROSSMATCH RULES
// ──────────────────────────────────────────────

const CROSSMATCH_REQUIRED = {
  RBC:      true,
  FFP:      false,
  Platelet: false,
  Cryo:     false,
};

// ──────────────────────────────────────────────
// STRICTNESS LEVELS (for UI display)
// ──────────────────────────────────────────────

const STRICTNESS = {
  RBC:      'high',
  FFP:      'medium',
  Platelet: 'low',
  Cryo:     'very-low',
};

// ──────────────────────────────────────────────
// PUBLIC API
// ──────────────────────────────────────────────

/**
 * Get array of donor ABO groups that are compatible for the given
 * recipient group and component type.
 *
 * For Platelet and Cryo, returns ALL groups (since any is allowed),
 * but the caller should sort exact-match first.
 *
 * @param {string} recipientGroup  – 'A' | 'B' | 'AB' | 'O'
 * @param {string} componentType   – 'RBC' | 'FFP' | 'Platelet' | 'Cryo'
 * @returns {string[]}  e.g. ['A', 'O']
 */
function getCompatibleDonorGroups(recipientGroup, componentType) {
  if (!recipientGroup || !componentType) return [];

  const group = recipientGroup.toUpperCase();

  switch (componentType) {
    case 'RBC':
      return ABO_RBC[group] || [];
    case 'FFP':
      return ABO_FFP[group] || [];
    case 'Platelet':
      // All groups are acceptable for platelets
      return ABO_PLATELET_ALL;
    case 'Cryo':
      // All groups are acceptable for cryo
      return ABO_CRYO_ALL;
    default:
      return [];
  }
}

/**
 * Get the preferred (exact-match) ABO groups for a component.
 * Used to sort exact matches before compatible alternates.
 *
 * @param {string} recipientGroup
 * @param {string} componentType
 * @returns {string[]}
 */
function getPreferredDonorGroups(recipientGroup, componentType) {
  if (!recipientGroup || !componentType) return [];

  const group = recipientGroup.toUpperCase();

  switch (componentType) {
    case 'RBC':
      // For RBC strict matching, "preferred" = exact group only
      return [group];
    case 'FFP':
      // For FFP, preferred = exact group only
      return [group];
    case 'Platelet':
      return ABO_PLATELET_PREFERRED[group] || [];
    case 'Cryo':
      return ABO_CRYO_PREFERRED[group] || [];
    default:
      return [];
  }
}

/**
 * Check if Rh is compatible for the given component type.
 *
 * @param {string} recipientRh  – 'Positive' | 'Negative'
 * @param {string} donorRh      – 'Positive' | 'Negative'
 * @param {string} componentType
 * @returns {boolean}
 */
function isRhCompatible(recipientRh, donorRh, componentType) {
  if (!recipientRh || !donorRh || !componentType) return false;

  const rule = RH_RULE[componentType];

  switch (rule) {
    case 'strict':
      // Rh− patient → only Rh− donor
      // Rh+ patient → Rh+ or Rh−
      if (recipientRh === 'Negative') {
        return donorRh === 'Negative';
      }
      return true; // Positive recipient accepts both

    case 'optional':
      // Prefer match, but both are acceptable → always true
      return true;

    case 'ignore':
      // Rh irrelevant for this component
      return true;

    default:
      return false;
  }
}

/**
 * Check if the Rh match is exact (same Rh) for the component.
 * Used to prioritize exact Rh matches in sorting.
 *
 * @param {string} recipientRh
 * @param {string} donorRh
 * @returns {boolean}
 */
function isRhExactMatch(recipientRh, donorRh) {
  return recipientRh === donorRh;
}

/**
 * Whether crossmatch testing is required for this component type.
 *
 * @param {string} componentType
 * @returns {boolean}
 */
function requiresCrossmatch(componentType) {
  return CROSSMATCH_REQUIRED[componentType] === true;
}

/**
 * Get the strictness level string for this component type.
 *
 * @param {string} componentType
 * @returns {string}  'high' | 'medium' | 'low' | 'very-low'
 */
function getCompatibilityStrictness(componentType) {
  return STRICTNESS[componentType] || 'unknown';
}

/**
 * Master compatibility check — combines ABO + Rh for a component.
 *
 * @param {{ bloodGroup: string, rh: string }} recipient
 * @param {{ bloodGroup: string, rh: string }} donor
 * @param {string} componentType
 * @returns {{ compatible: boolean, aboCompatible: boolean, rhCompatible: boolean, isExactMatch: boolean }}
 */
function isComponentCompatible(recipient, donor, componentType) {
  if (!recipient || !donor || !componentType) {
    return { compatible: false, aboCompatible: false, rhCompatible: false, isExactMatch: false };
  }

  const compatibleGroups = getCompatibleDonorGroups(recipient.bloodGroup, componentType);
  const aboCompatible = compatibleGroups.includes(donor.bloodGroup);
  const rhCompatible = isRhCompatible(recipient.rh, donor.rh, componentType);

  const aboExact = recipient.bloodGroup === donor.bloodGroup;
  const rhExact = isRhExactMatch(recipient.rh, donor.rh);
  const isExactMatch = aboExact && rhExact;

  return {
    compatible: aboCompatible && rhCompatible,
    aboCompatible,
    rhCompatible,
    isExactMatch,
  };
}

/**
 * Build the full compatibility info object for a given request.
 * Used by the GET /compatibility-info endpoint.
 *
 * @param {string} componentType
 * @param {string} bloodGroup
 * @param {string} rh
 * @returns {object}
 */
function getFullCompatibilityInfo(componentType, bloodGroup, rh) {
  return {
    componentType,
    recipientBloodGroup: bloodGroup,
    recipientRh: rh,
    compatibleDonorGroups: getCompatibleDonorGroups(bloodGroup, componentType),
    preferredDonorGroups: getPreferredDonorGroups(bloodGroup, componentType),
    rhRule: RH_RULE[componentType] || 'unknown',
    rhDescription: _getRhDescription(componentType),
    crossmatchRequired: requiresCrossmatch(componentType),
    strictness: getCompatibilityStrictness(componentType),
    aboRule: _getAboRuleDescription(componentType),
  };
}

// ──────────────────────────────────────────────
// INTERNAL HELPERS (for descriptions)
// ──────────────────────────────────────────────

function _getRhDescription(componentType) {
  switch (componentType) {
    case 'RBC':
      return 'Strict — Rh− patient must receive Rh− only; Rh+ can receive both';
    case 'FFP':
      return 'Ignored — Rh has no clinical significance for plasma';
    case 'Platelet':
      return 'Optional — Rh-matched preferred but not mandatory';
    case 'Cryo':
      return 'Ignored — Rh has no clinical significance for cryoprecipitate';
    default:
      return 'Unknown';
  }
}

function _getAboRuleDescription(componentType) {
  switch (componentType) {
    case 'RBC':
      return 'Strict ABO — Only ABO-compatible groups allowed';
    case 'FFP':
      return 'Reverse ABO — Plasma follows reverse compatibility rules';
    case 'Platelet':
      return 'Preferred ABO — Same group preferred, any group acceptable';
    case 'Cryo':
      return 'Optional ABO — Same group preferred, any group acceptable';
    default:
      return 'Unknown';
  }
}

// ──────────────────────────────────────────────
// EXPORT
// ──────────────────────────────────────────────

module.exports = {
  getCompatibleDonorGroups,
  getPreferredDonorGroups,
  isRhCompatible,
  isRhExactMatch,
  requiresCrossmatch,
  getCompatibilityStrictness,
  isComponentCompatible,
  getFullCompatibilityInfo,

  // Expose raw matrices for testing / reference
  _ABO_RBC: ABO_RBC,
  _ABO_FFP: ABO_FFP,
  _ABO_PLATELET_PREFERRED: ABO_PLATELET_PREFERRED,
  _ABO_PLATELET_ALL: ABO_PLATELET_ALL,
  _ABO_CRYO_PREFERRED: ABO_CRYO_PREFERRED,
  _ABO_CRYO_ALL: ABO_CRYO_ALL,
  _RH_RULE: RH_RULE,
  _CROSSMATCH_REQUIRED: CROSSMATCH_REQUIRED,
  _STRICTNESS: STRICTNESS,
};
