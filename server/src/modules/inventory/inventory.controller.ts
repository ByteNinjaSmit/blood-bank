import type { NextFunction, Request, Response } from 'express';
import { ValidateInventory } from '@/modules/inventory/inventory.validator';
import type { InventoryService } from '@/modules/inventory/inventory.service';

export interface InventoryControllers {
  select: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  summary: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  nearExpiry: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function createInventoryControllers(service: InventoryService): InventoryControllers {
  return {
    async select(req, res, next) {
      try {
        const q = ValidateInventory.selectQuery(req);
        const result = await service.selectFefo(q);
        res.json({
          success: true,
          data: {
            selected: result.selected.map((s) => ({
              unitId: s.unit.unitId,
              componentType: s.unit.componentType,
              aboGroup: s.unit.aboGroup,
              rhFactor: s.unit.rhFactor,
              expiresAt: s.unit.expiresAt.toISOString(),
              compatibilityType: s.compatibilityType,
            })),
            shortage: result.shortage,
          },
          requestId: req.id,
        });
      } catch (e) {
        next(e);
      }
    },

    async summary(req, res, next) {
      try {
        const includeLoan = req.query.includeLoan === 'true';
        const data = await service.stockSummary(includeLoan);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async nearExpiry(req, res, next) {
      try {
        const { days } = ValidateInventory.nearExpiryQuery(req);
        const data = await service.nearExpiry(days);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
