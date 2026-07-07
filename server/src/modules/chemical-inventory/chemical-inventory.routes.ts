import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requireRole } from '@/shared/middlewares/rbac';
import { createChemicalInventoryRepo } from '@/modules/chemical-inventory/chemical-inventory.repository';
import { createChemicalInventoryService } from '@/modules/chemical-inventory/chemical-inventory.service';
import { createChemicalInventoryControllers } from '@/modules/chemical-inventory/chemical-inventory.controller';

const service = createChemicalInventoryService({ inventory: createChemicalInventoryRepo() });
const controllers = createChemicalInventoryControllers(service);

const router = Router();

// Dashboard
router.get(
  '/dashboard',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'lab-tech-serology', 'qa-manager']),
  controllers.getDashboardStats
);

// Categories
router.get(
  '/category',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'lab-tech-serology', 'qa-manager']),
  controllers.listCategories
);
router.post(
  '/category',
  authenticate,
  requireRole(['system-admin', 'bbo']),
  controllers.createCategory
);
router.delete(
  '/category/:id',
  authenticate,
  requireRole(['system-admin', 'bbo']),
  controllers.deleteCategory
);

// Suppliers
router.get(
  '/supplier',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'lab-tech-serology', 'qa-manager']),
  controllers.listSuppliers
);
router.post(
  '/supplier',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  controllers.createSupplier
);
router.put(
  '/supplier/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  controllers.updateSupplier
);
router.delete(
  '/supplier/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  controllers.deleteSupplier
);

// Manufacturers
router.get(
  '/manufacturer',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'lab-tech-serology', 'qa-manager']),
  controllers.listManufacturers
);
router.post(
  '/manufacturer',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  controllers.createManufacturer
);
router.delete(
  '/manufacturer/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  controllers.deleteManufacturer
);

// Chemicals
router.get(
  '/chemical',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'lab-tech-serology', 'qa-manager']),
  controllers.listChemicals
);
router.post(
  '/chemical',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  controllers.createChemical
);
router.put(
  '/chemical/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  controllers.updateChemical
);
router.delete(
  '/chemical/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  controllers.deleteChemical
);

// Lots / Purchase Stock Entries
router.get(
  '/lot',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'lab-tech-serology', 'qa-manager']),
  controllers.listStockLots
);
router.post(
  '/lot',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  controllers.createStockLot
);

// Usage Operations (Open / Consume)
router.patch(
  '/lot/:id/usage',
  authenticate,
  requireRole(['system-admin', 'bbo', 'lab-tech-serology', 'store-keeper']),
  controllers.updateUsage
);

// Damage Register
router.get(
  '/damage',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'lab-tech-serology', 'qa-manager']),
  controllers.listDamages
);
router.post(
  '/damage',
  authenticate,
  requireRole(['system-admin', 'bbo', 'lab-tech-serology', 'store-keeper']),
  controllers.createDamage
);
router.patch(
  '/damage/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'lab-tech-serology', 'store-keeper']),
  controllers.updateDamage
);
router.delete(
  '/damage/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'lab-tech-serology', 'store-keeper']),
  controllers.deleteDamage
);

// Purchases
router.get(
  '/purchase',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'lab-tech-serology', 'qa-manager']),
  controllers.listPurchases
);
router.patch(
  '/purchase/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  controllers.updatePurchase
);
router.patch(
  '/purchase/:id/payments',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  controllers.updatePurchasePayments
);

// History Audit Logs
router.get(
  '/history',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'lab-tech-serology', 'qa-manager']),
  controllers.listHistory
);

// MIS Reports
router.get(
  '/reports/monthly',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'qa-manager']),
  controllers.getMonthlyStockReport
);
router.get(
  '/reports/supplier',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'qa-manager']),
  controllers.getSupplierPurchaseReport
);
router.get(
  '/reports/expiry',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'qa-manager']),
  controllers.getExpiryReport
);
router.get(
  '/reports/consumption',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'qa-manager']),
  controllers.getConsumptionReport
);

export default router;
