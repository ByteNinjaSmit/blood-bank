// FEFO selector — First Expire First Out.
//
// Not FIFO. FIFO is wrong for blood: a PRBC unit collected on day 1 in
// SAGM (42 d shelf life) outlives a unit collected on day 5 in CPDA-1
// (35 d). Always issue the unit closest to expiry first, subject to
// compatibility + special-needs filters.

import type { AboGroup, ComponentType, RhFactor, SpecialNeed } from '@/shared/enums';
import {
  compatibleAboGroups,
  isRhAcceptable,
  classify,
  type CompatibilityType,
} from './abo-rh';

export interface SelectableUnit {
  unitId: string;
  componentType: ComponentType;
  aboGroup: AboGroup;
  rhFactor: RhFactor;
  expiresAt: Date;
  specialAttributes: ReadonlySet<SpecialNeed>;
  status: string; // expected RELEASED — caller should pre-filter
}

export interface SelectionRequest {
  recipient: { aboGroup: AboGroup; rhFactor: RhFactor };
  component: ComponentType;
  specialNeeds: ReadonlyArray<SpecialNeed>;
  unitsRequired: number;
  now?: Date;
}

export interface SelectedUnit {
  unit: SelectableUnit;
  compatibilityType: CompatibilityType;
}

export interface SelectionResult {
  selected: SelectedUnit[];
  shortage: number; // units requested minus units selected
}

export function selectUnits(
  candidates: ReadonlyArray<SelectableUnit>,
  req: SelectionRequest,
): SelectionResult {
  const now = req.now ?? new Date();
  const acceptableAbo = new Set(compatibleAboGroups(req.recipient.aboGroup, req.component));

  // 1. filter: matching component, not expired, ABO compatible, Rh acceptable,
  //    and satisfies every required special-need flag.
  const filtered = candidates.filter((u) => {
    if (u.componentType !== req.component) return false;
    if (u.expiresAt.getTime() <= now.getTime()) return false;
    if (!acceptableAbo.has(u.aboGroup)) return false;
    if (!isRhAcceptable(req.recipient.rhFactor, u.rhFactor, req.component)) return false;
    for (const need of req.specialNeeds) {
      if (!u.specialAttributes.has(need)) return false;
    }
    return true;
  });

  // 2. rank: exact-match-first, then FEFO ascending.
  filtered.sort((a, b) => {
    const aCls = classify(req.recipient, a);
    const bCls = classify(req.recipient, b);
    if (aCls !== bCls) return aCls === 'EXACT' ? -1 : 1;
    return a.expiresAt.getTime() - b.expiresAt.getTime();
  });

  const selected: SelectedUnit[] = filtered.slice(0, req.unitsRequired).map((unit) => ({
    unit,
    compatibilityType: classify(req.recipient, unit),
  }));

  return {
    selected,
    shortage: Math.max(0, req.unitsRequired - selected.length),
  };
}
