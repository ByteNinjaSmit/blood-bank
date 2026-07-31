import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { createBulkTransferRepo } from '@/modules/bulk-transfer/bulk-transfer.repository';
import { createBulkTransferService } from '@/modules/bulk-transfer/bulk-transfer.service';
import { createBulkTransferControllers } from '@/modules/bulk-transfer/bulk-transfer.controller';

const service = createBulkTransferService({ bulkTransfers: createBulkTransferRepo() });
const controllers = createBulkTransferControllers(service);

const ROLES = ['system-admin', 'bbo', 'store-keeper'] as const;

const router = Router();

router.get('/', authenticate, requirePermission('bulk-transfer:read'), controllers.list);
router.get('/:id', authenticate, requirePermission('bulk-transfer:read'), controllers.get);
router.post('/', authenticate, requirePermission('bulk-transfer:create'), controllers.create);
router.patch('/:id', authenticate, requirePermission('bulk-transfer:update'), controllers.update);
router.delete('/:id', authenticate, requirePermission('bulk-transfer:delete'), controllers.remove);
router.post('/:id/restore', authenticate, requirePermission('bulk-transfer:update'), controllers.restore);

export default router;
