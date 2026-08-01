import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createChemicalInventoryRepo } from '@/modules/chemical-inventory/chemical-inventory.repository';
import { createChemicalInventoryService } from '@/modules/chemical-inventory/chemical-inventory.service';
import { createChemicalInventoryControllers } from '@/modules/chemical-inventory/chemical-inventory.controller';

const service = createChemicalInventoryService({ inventory: createChemicalInventoryRepo() });
const controllers = createChemicalInventoryControllers(service);

const router = Router();

const READ_PERM = requirePermission('chemical:read');
const MANAGE_PERM = requirePermission('chemical:manage');

// Dashboard
router.get('/dashboard', authenticate, READ_PERM, controllers.getDashboardStats);

// Categories
router.get('/category', authenticate, READ_PERM, controllers.listCategories);
router.post('/category', authenticate, MANAGE_PERM, controllers.createCategory);
router.delete('/category/:id', authenticate, MANAGE_PERM, controllers.deleteCategory);

// Suppliers
router.get('/supplier', authenticate, READ_PERM, controllers.listSuppliers);
router.post('/supplier', authenticate, MANAGE_PERM, controllers.createSupplier);
router.put('/supplier/:id', authenticate, MANAGE_PERM, controllers.updateSupplier);
router.delete('/supplier/:id', authenticate, MANAGE_PERM, controllers.deleteSupplier);

// Manufacturers
router.get('/manufacturer', authenticate, READ_PERM, controllers.listManufacturers);
router.post('/manufacturer', authenticate, MANAGE_PERM, controllers.createManufacturer);
router.delete('/manufacturer/:id', authenticate, MANAGE_PERM, controllers.deleteManufacturer);

// Chemicals
router.get('/chemical', authenticate, READ_PERM, controllers.listChemicals);
router.post('/chemical', authenticate, MANAGE_PERM, controllers.createChemical);
router.put('/chemical/:id', authenticate, MANAGE_PERM, controllers.updateChemical);
router.delete('/chemical/:id', authenticate, MANAGE_PERM, controllers.deleteChemical);

// Lots / Purchase Stock Entries
router.get('/lot', authenticate, READ_PERM, controllers.listStockLots);
router.post('/lot', authenticate, MANAGE_PERM, controllers.createStockLot);

// Usage Operations (Open / Consume)
router.patch('/lot/:id/usage', authenticate, MANAGE_PERM, controllers.updateUsage);

// Damage Register
router.get('/damage', authenticate, READ_PERM, controllers.listDamages);
router.post('/damage', authenticate, MANAGE_PERM, controllers.createDamage);
router.patch('/damage/:id', authenticate, MANAGE_PERM, controllers.updateDamage);
router.delete('/damage/:id', authenticate, MANAGE_PERM, controllers.deleteDamage);

// Purchases
router.get('/purchase', authenticate, READ_PERM, controllers.listPurchases);
router.patch('/purchase/:id', authenticate, MANAGE_PERM, controllers.updatePurchase);
router.patch(
  '/purchase/:id/payments',
  authenticate,
  MANAGE_PERM,
  controllers.updatePurchasePayments,
);

// History Audit Logs
router.get('/history', authenticate, READ_PERM, controllers.listHistory);

// MIS Reports
router.get('/reports/monthly', authenticate, READ_PERM, controllers.getMonthlyStockReport);
router.get('/reports/supplier', authenticate, READ_PERM, controllers.getSupplierPurchaseReport);
router.get('/reports/expiry', authenticate, READ_PERM, controllers.getExpiryReport);
router.get('/reports/consumption', authenticate, READ_PERM, controllers.getConsumptionReport);

export default router;
