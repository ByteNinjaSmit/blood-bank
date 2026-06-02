// Inventory service. Inventory is a DERIVED VIEW over BloodUnits in
// RELEASED status — not a separate writable collection. Exposes the
// FEFO selector + stock summary.

import { childLogger } from '@/core/logger';
import { cached } from '@/core/cache';
import { selectUnits, type SelectionResult } from '@/shared/compatibility/fefo';
import { compatibleAboGroups } from '@/shared/compatibility/abo-rh';
import type { UnitRepo } from '@/modules/unit/unit.repository';
import type { AboGroup, ComponentType, RhFactor, SpecialNeed } from '@/shared/enums';

const STOCK_SUMMARY_CACHE_KEY = 'inventory:summary';
const STOCK_SUMMARY_TTL_SECONDS = 30;

export interface SelectRequest {
  component: ComponentType;
  aboGroup: AboGroup;
  rhFactor: RhFactor;
  specialNeeds: SpecialNeed[];
  unitsRequired: number;
}

export interface InventoryService {
  selectFefo(req: SelectRequest): Promise<SelectionResult>;
  stockSummary(): Promise<
    Array<{ componentType: string; aboGroup: string; rhFactor: string; count: number }>
  >;
}

export function createInventoryService(deps: { units: UnitRepo }): InventoryService {
  const log = childLogger({ module: 'inventory-service' });

  return {
    async selectFefo(req) {
      const aboGroups = [...compatibleAboGroups(req.aboGroup, req.component)];
      const candidates = await deps.units.selectable({
        componentType: req.component,
        aboGroups,
      });
      const result = selectUnits(candidates, {
        recipient: { aboGroup: req.aboGroup, rhFactor: req.rhFactor },
        component: req.component,
        specialNeeds: req.specialNeeds,
        unitsRequired: req.unitsRequired,
      });
      if (result.shortage > 0) {
        log.warn(
          { ...req, shortage: result.shortage, found: result.selected.length },
          'inventory shortage',
        );
      }
      return result;
    },

    async stockSummary() {
      // Hot read; cache for 30s. Invalidated by unit-repo on any status
      // change (see unit.repository.applyEvent).
      return cached(STOCK_SUMMARY_CACHE_KEY, STOCK_SUMMARY_TTL_SECONDS, () =>
        deps.units.inStockSummary(),
      );
    },
  };
}
