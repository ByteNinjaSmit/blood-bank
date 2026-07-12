// Single source of truth for blood-component-type labels, shelf life, and
// product codes. Replaces the ~8 duplicated mapping tables that used to
// live in component.mapper.ts, requisition.mapper.ts, inventory.controller.ts,
// inventory.legacy-view.repository.ts, dashboard.repository.ts, mis.repository.ts,
// monthly-report.repository.ts, and donation.unit-derivation.ts.
//
// Stored `componentType` values ARE the canonical codes now (post-migration),
// so most of those tables were pure legacy-vocabulary translation and are
// simply gone rather than repointed.

import type { ComponentType, SpecialNeed } from '@/shared/enums';

export const COMPONENT_LABEL: Readonly<Record<ComponentType, string>> = {
  WB: 'Whole Blood',
  PRBC: 'Packed Red Blood Cells',
  FFP: 'Fresh Frozen Plasma',
  RDP: 'Random Donor Platelets',
  SDP: 'Single Donor Platelets',
  CRYO: 'Cryoprecipitate',
};

export const PRODUCT_CODE: Readonly<Record<ComponentType, string>> = {
  WB: 'WB',
  PRBC: 'PRBC',
  FFP: 'FFP',
  RDP: 'RDP',
  SDP: 'SDP',
  CRYO: 'CRYO',
};

// Flat shelf life (days) for component types whose expiry doesn't depend on
// special-needs processing. PRBC is handled separately by getShelfDays below.
const FLAT_SHELF_DAYS: Readonly<Record<Exclude<ComponentType, 'PRBC'>, number>> = {
  WB: 35,
  FFP: 365,
  RDP: 5,
  SDP: 5,
  CRYO: 365,
};

/**
 * Shelf life in days for a unit of the given component type.
 *
 * PRBC shelf life depends on special-needs processing (these used to be
 * separate component types — IRRADIATED_PRBC/WASHED_PRBC/LEUKOREDUCED_PRBC —
 * now they're plain PRBC + a SpecialNeed flag):
 *   - washed:      1 day
 *   - irradiated:  14 days
 *   - leukoreduced (or no special processing): standard 42 days
 *
 * Every other component type keeps its existing flat shelf life.
 */
export function getShelfDays(componentType: ComponentType, specialNeeds?: ReadonlyArray<SpecialNeed | string>): number {
  if (componentType === 'PRBC') {
    const needs = new Set(specialNeeds ?? []);
    if (needs.has('WASHED')) return 1;
    if (needs.has('IRRADIATED')) return 14;
    return 42;
  }
  return FLAT_SHELF_DAYS[componentType];
}
