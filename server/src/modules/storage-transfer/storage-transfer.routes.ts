import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createStorageTransferRepo } from '@/modules/storage-transfer/storage-transfer.repository';
import { createStorageTransferService } from '@/modules/storage-transfer/storage-transfer.service';
import { createStorageTransferControllers } from '@/modules/storage-transfer/storage-transfer.controller';
import type { Role } from '@/shared/enums';

const service = createStorageTransferService({ storageTransfers: createStorageTransferRepo() });
const controllers = createStorageTransferControllers(service);

// Same role set as the legacy /api/inventory storage routes this module
// replaces for STORAGE dispatches — requirePermission('unit:read') is the
// shared gate held by every one of these roles (see inventory.legacy-routes.ts).
const ROLES: Role[] = ['system-admin', 'bbo', 'medical-officer', 'lab-tech-serology', 'store-keeper', 'issue-counter'];

const router = Router();

router.get('/', authenticate, requirePermission('unit:read'), controllers.list);
router.get('/:id', authenticate, requirePermission('unit:read'), controllers.get);
router.post('/', authenticate, requirePermission('unit:read'), controllers.create);
router.patch('/:id', authenticate, requirePermission('unit:read'), controllers.update);
router.delete('/:id', authenticate, requirePermission('unit:read'), controllers.remove);
router.post('/:id/restore', authenticate, requirePermission('unit:read'), controllers.restore);

export default router;
