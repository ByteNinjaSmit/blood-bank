import { childLogger } from '@/core/logger';
import { cached } from '@/core/cache';
import { selectUnits, type SelectionResult } from '@/shared/compatibility/fefo';
import { compatibleAboGroups } from '@/shared/compatibility/abo-rh';
import type { UnitRepo } from '@/modules/unit/unit.repository';
import type { AboGroup, ComponentType, RhFactor, SpecialNeed } from '@/shared/enums';

const STOCK_SUMMARY_CACHE_KEY = 'inventory:summary';
const STOCK_SUMMARY_TTL_SECONDS = 30;
const NEAR_EXPIRY_TTL_SECONDS = 60;

export interface SelectRequest {
  component: ComponentType;
  aboGroup: AboGroup;
  rhFactor: RhFactor;
  specialNeeds: SpecialNeed[];
  unitsRequired: number;
}

export interface NearExpiryUnit {
  unitId: string;
  componentType: string;
  aboGroup: string;
  rhFactor: string;
  expiresAt: string;
  daysLeft: number;
}

export interface InventoryService {
  selectFefo(req: SelectRequest): Promise<SelectionResult>;
  stockSummary(): Promise<
    Array<{ componentType: string; aboGroup: string; rhFactor: string; count: number }>
  >;
  nearExpiry(days: number): Promise<NearExpiryUnit[]>;
}

export function createInventoryService(deps: { units: UnitRepo }): InventoryService {
  const log = childLogger({ module: 'inventory-service' });

  return {
    async selectFefo(req) {
      const aboGroups = [...compatibleAboGroups(req.aboGroup, req.component)];
      const candidates = await deps.units.selectable({ componentType: req.component, aboGroups });
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
      return cached(STOCK_SUMMARY_CACHE_KEY, STOCK_SUMMARY_TTL_SECONDS, () =>
        deps.units.inStockSummary(),
      );
    },

    async nearExpiry(days) {
      const key = `inventory:near-expiry:days=${days}`;
      return cached(key, NEAR_EXPIRY_TTL_SECONDS, async () => {
        const raw = await deps.units.findNearExpiry(days);
        const now = Date.now();
        return raw.map((u) => ({
          unitId: u.unitId,
          componentType: u.componentType,
          aboGroup: u.aboGroup,
          rhFactor: u.rhFactor,
          expiresAt: u.expiresAt,
          daysLeft: Math.max(0, Math.ceil((new Date(u.expiresAt).getTime() - now) / 86_400_000)),
        }));
      });
    },
  };
}
