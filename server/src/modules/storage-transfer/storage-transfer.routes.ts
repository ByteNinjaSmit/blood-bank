import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createStorageTransferRepo } from '@/modules/storage-transfer/storage-transfer.repository';
import { createStorageTransferService } from '@/modules/storage-transfer/storage-transfer.service';
import { createStorageTransferControllers } from '@/modules/storage-transfer/storage-transfer.controller';

const service = createStorageTransferService({ storageTransfers: createStorageTransferRepo() });
const controllers = createStorageTransferControllers(service);

const router = Router();

// Reads: any unit-domain reader. Create / edit / delete move real
// BloodUnits in and out of stock — gate them on `unit:issue`, the write
// permission the Inventory → Issue page (which hosts the Storage Transfer
// tab) already grants via its "update" action, so a pure read-only user
// can no longer create or delete a storage transfer. `:id/restore` stays
// on `unit:read`: it's a Recycle-Bin recovery action (the Recycle Bin
// page grants only unit:read), consistent with every other recycle-bin
// restore, and it re-validates every bag is still free before reclaiming.
router.get('/', authenticate, requirePermission('unit:read'), controllers.list);
router.get('/:id', authenticate, requirePermission('unit:read'), controllers.get);
router.post('/', authenticate, requirePermission('unit:issue'), controllers.create);
router.patch('/:id', authenticate, requirePermission('unit:issue'), controllers.update);
router.delete('/:id', authenticate, requirePermission('unit:issue'), controllers.remove);
router.post('/:id/restore', authenticate, requirePermission('unit:read'), controllers.restore);

export default router;
