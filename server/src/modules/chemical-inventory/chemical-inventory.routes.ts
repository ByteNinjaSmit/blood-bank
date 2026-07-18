import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission, requireRole } from '@/shared/middlewares/rbac';
import { createChemicalInventoryRepo } from '@/modules/chemical-inventory/chemical-inventory.repository';
import { createChemicalInventoryService } from '@/modules/chemical-inventory/chemical-inventory.service';
import { createChemicalInventoryControllers } from '@/modules/chemical-inventory/chemical-inventory.controller';

const service = createChemicalInventoryService({ inventory: createChemicalInventoryRepo() });
const controllers = createChemicalInventoryControllers(service);

const router = Router();

const READ_PERM = requirePermission('chemical:read');
const MANAGE_PERM = requirePermission('chemical:manage');

// Dashboard
router.get(
  '/dashboard',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'lab-tech-serology', 'qa-manager']),
  READ_PERM,
  controllers.getDashboardStats
);

// Categories
router.get(
  '/category',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'lab-tech-serology', 'qa-manager']),
  READ_PERM,
  controllers.listCategories
);
router.post(
  '/category',
  authenticate,
  requireRole(['system-admin', 'bbo']),
  MANAGE_PERM,
  controllers.createCategory
);
router.delete(
  '/category/:id',
  authenticate,
  requireRole(['system-admin', 'bbo']),
  MANAGE_PERM,
  controllers.deleteCategory
);

// Suppliers
router.get(
  '/supplier',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'lab-tech-serology', 'qa-manager']),
  READ_PERM,
  controllers.listSuppliers
);
router.post(
  '/supplier',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  MANAGE_PERM,
  controllers.createSupplier
);
router.put(
  '/supplier/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  MANAGE_PERM,
  controllers.updateSupplier
);
router.delete(
  '/supplier/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  MANAGE_PERM,
  controllers.deleteSupplier
);

// Manufacturers
router.get(
  '/manufacturer',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'lab-tech-serology', 'qa-manager']),
  READ_PERM,
  controllers.listManufacturers
);
router.post(
  '/manufacturer',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  MANAGE_PERM,
  controllers.createManufacturer
);
router.delete(
  '/manufacturer/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  MANAGE_PERM,
  controllers.deleteManufacturer
);

// Chemicals
router.get(
  '/chemical',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'lab-tech-serology', 'qa-manager']),
  READ_PERM,
  controllers.listChemicals
);
router.post(
  '/chemical',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  MANAGE_PERM,
  controllers.createChemical
);
router.put(
  '/chemical/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  MANAGE_PERM,
  controllers.updateChemical
);
router.delete(
  '/chemical/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  MANAGE_PERM,
  controllers.deleteChemical
);

// Lots / Purchase Stock Entries
router.get(
  '/lot',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'lab-tech-serology', 'qa-manager']),
  READ_PERM,
  controllers.listStockLots
);
router.post(
  '/lot',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  MANAGE_PERM,
  controllers.createStockLot
);

// Usage Operations (Open / Consume)
router.patch(
  '/lot/:id/usage',
  authenticate,
  requireRole(['system-admin', 'bbo', 'lab-tech-serology', 'store-keeper']),
  MANAGE_PERM,
  controllers.updateUsage
);

// Damage Register
router.get(
  '/damage',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'lab-tech-serology', 'qa-manager']),
  READ_PERM,
  controllers.listDamages
);
router.post(
  '/damage',
  authenticate,
  requireRole(['system-admin', 'bbo', 'lab-tech-serology', 'store-keeper']),
  MANAGE_PERM,
  controllers.createDamage
);
router.patch(
  '/damage/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'lab-tech-serology', 'store-keeper']),
  MANAGE_PERM,
  controllers.updateDamage
);
router.delete(
  '/damage/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'lab-tech-serology', 'store-keeper']),
  MANAGE_PERM,
  controllers.deleteDamage
);

// Purchases
router.get(
  '/purchase',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'lab-tech-serology', 'qa-manager']),
  READ_PERM,
  controllers.listPurchases
);
router.patch(
  '/purchase/:id',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  MANAGE_PERM,
  controllers.updatePurchase
);
router.patch(
  '/purchase/:id/payments',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper']),
  MANAGE_PERM,
  controllers.updatePurchasePayments
);

// History Audit Logs
router.get(
  '/history',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'lab-tech-serology', 'qa-manager']),
  READ_PERM,
  controllers.listHistory
);

// MIS Reports
router.get(
  '/reports/monthly',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'qa-manager']),
  READ_PERM,
  controllers.getMonthlyStockReport
);
router.get(
  '/reports/supplier',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'qa-manager']),
  READ_PERM,
  controllers.getSupplierPurchaseReport
);
router.get(
  '/reports/expiry',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'qa-manager']),
  READ_PERM,
  controllers.getExpiryReport
);
router.get(
  '/reports/consumption',
  authenticate,
  requireRole(['system-admin', 'bbo', 'store-keeper', 'qa-manager']),
  READ_PERM,
  controllers.getConsumptionReport
);

export default router;
