import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission, requireRole } from '@/shared/middlewares/rbac';
import { createDashboardRepo } from '@/modules/dashboard/dashboard.repository';
import { createDashboardService } from '@/modules/dashboard/dashboard.service';
import { createDashboardControllers } from '@/modules/dashboard/dashboard.controller';
import { createChemicalInventoryRepo } from '@/modules/chemical-inventory/chemical-inventory.repository';
import { createBagStockRepo } from '@/modules/bag-stock/bag-stock.repository';
import { createBulkTransferRepo } from '@/modules/bulk-transfer/bulk-transfer.repository';

const repo = createDashboardRepo({
  chemicalInventory: createChemicalInventoryRepo(),
  bagStock: createBagStockRepo(),
  bulkTransfer: createBulkTransferRepo(),
});
const service = createDashboardService({ dashboard: repo });
const controllers = createDashboardControllers(service);

const ROLES = [
  'system-admin',
  'bbo',
  'store-keeper',
  'lab-tech-serology',
  'qa-manager',
  'medical-officer',
  'camp-organiser',
] as const;

const router = Router();

router.get('/', authenticate, requireRole([...ROLES]), requirePermission('dashboard:read'), controllers.getDashboard);
router.get('/alerts', authenticate, requireRole([...ROLES]), requirePermission('dashboard:read'), controllers.getAlerts);

export default router;
