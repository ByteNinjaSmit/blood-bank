// Legacy-path-compatible stock register routes. Mounted at
// /api/inventory so existing client calls (Stock/Reserve/Issue/
// NearExpiry pages) to /api/inventory, /api/inventory/unreserve, and
// /api/inventory/send-to-storage keep working unchanged.
import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createUnitRepo } from '@/modules/unit/unit.repository';
import { createInventoryLegacyViewRepo } from '@/modules/inventory/inventory.legacy-view.repository';
import { createInventoryLegacyViewService } from '@/modules/inventory/inventory.legacy-view.service';
import { createInventoryLegacyViewControllers } from '@/modules/inventory/inventory.legacy-view.controller';

const repo = createInventoryLegacyViewRepo({ units: createUnitRepo() });
const service = createInventoryLegacyViewService({ repo });
const controllers = createInventoryLegacyViewControllers(service);

const router = Router();

router.get('/', authenticate, requirePermission('unit:read'), controllers.listStock);
// Cancelling a reservation and returning the bag to stock — reachable
// only from the read-only Reservations List page, which grants just
// `unit:read`. Left on `unit:read` deliberately: tightening it to
// `unit:reserve` would lock every current Reservations-List operator out
// of the unreserve action until an admin re-grants it. Revisit alongside
// a permissions-grid migration.
router.post('/unreserve', authenticate, requirePermission('unit:read'), controllers.unreserve);
// Bag storage-dispatch writes: superseded by the /api/v2/storage-transfer
// module and no longer called by the client, but still mounted. Gate on
// `unit:issue` (the storage-dispatch write permission) so a read-only
// token can't drive them.
router.post(
  '/send-to-storage',
  authenticate,
  requirePermission('unit:issue'),
  controllers.sendToStorage,
);
router.patch(
  '/:id/storage',
  authenticate,
  requirePermission('unit:issue'),
  controllers.updateStorage,
);
router.post(
  '/return-from-storage',
  authenticate,
  requirePermission('unit:issue'),
  controllers.returnFromStorage,
);

export default router;
