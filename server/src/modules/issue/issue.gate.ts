// Issue gate rules. A unit cannot leave the bank unless every clinical
// precondition is met. Pure function — the service supplies the facts.
//
// Gates (all must pass, unless an MO override is recorded):
//   1. Unit status must be CROSSMATCHED (for RBC) or RELEASED→reserved
//      path for components not needing crossmatch.
//   2. The unit's donation must have a released TTI result.
//   3. For RBC-bearing components, a passing crossmatch must exist for
//      THIS patient + THIS unit.
//   4. Patient special needs must be satisfied by the unit's attributes.

import { requiresCrossmatch } from '@/shared/compatibility/abo-rh';
import type { ComponentType, SpecialNeed, UnitStatus } from '@/shared/enums';

export interface IssueGateInput {
  componentType: ComponentType;
  unitStatus: UnitStatus;
  ttiReleaseDecision: string; // 'released' | ...
  crossmatchResult?: 'COMPATIBLE' | 'INCOMPATIBLE';
  unitSpecialAttributes: ReadonlyArray<SpecialNeed>;
  patientSpecialNeeds: ReadonlyArray<SpecialNeed>;
  override?: { isOverride: boolean; reason?: string; authorizedBy?: string };
}

export interface IssueGateResult {
  allowed: boolean;
  blockers: string[];
  usedOverride: boolean;
}

export function checkIssueGate(input: IssueGateInput): IssueGateResult {
  // Absolute blockers — never overridable.
  const absolute: string[] = [];
  // Overridable blockers — bypassed only with a valid MO override.
  const overridable: string[] = [];

  const needsXm = requiresCrossmatch(input.componentType);

  // 1. TTI gate — absolute.
  if (input.ttiReleaseDecision !== 'released') {
    absolute.push(`TTI not released (decision=${input.ttiReleaseDecision})`);
  }

  // 2. Special needs — absolute.
  const attrs = new Set(input.unitSpecialAttributes);
  for (const need of input.patientSpecialNeeds) {
    if (!attrs.has(need)) absolute.push(`Unit missing required special need: ${need}`);
  }

  // 3. Crossmatch gate (RBC only) — overridable.
  if (needsXm && input.crossmatchResult !== 'COMPATIBLE') {
    overridable.push(
      input.crossmatchResult === 'INCOMPATIBLE'
        ? 'Crossmatch incompatible (requires MO override with reason)'
        : 'Crossmatch not performed (requires COMPATIBLE result or MO override)',
    );
  }

  // 4. Status gate — overridable (emergency issue may skip CROSSMATCHED).
  const expectedStatus: UnitStatus = needsXm ? 'CROSSMATCHED' : 'RESERVED';
  if (input.unitStatus !== expectedStatus) {
    overridable.push(`Unit status ${input.unitStatus}, expected ${expectedStatus}`);
  }

  const validOverride =
    input.override?.isOverride === true &&
    Boolean(input.override.reason) &&
    Boolean(input.override.authorizedBy);
  const usedOverride = validOverride && overridable.length > 0;

  const effectiveBlockers = validOverride ? absolute : [...absolute, ...overridable];

  return {
    allowed: effectiveBlockers.length === 0,
    blockers: [...absolute, ...overridable],
    usedOverride,
  };
}
