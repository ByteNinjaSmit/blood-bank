import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requireRole, requirePermission } from '@/shared/middlewares/rbac';
import { createBulkTransferRepo } from '@/modules/bulk-transfer/bulk-transfer.repository';
import { createBulkTransferService } from '@/modules/bulk-transfer/bulk-transfer.service';
import { createBulkTransferControllers } from '@/modules/bulk-transfer/bulk-transfer.controller';

const service = createBulkTransferService({ bulkTransfers: createBulkTransferRepo() });
const controllers = createBulkTransferControllers(service);

const ROLES = ['system-admin', 'bbo', 'store-keeper'] as const;

const router = Router();

router.get('/', authenticate, requireRole([...ROLES]), requirePermission('bulk-transfer:read'), controllers.list);
router.get('/:id', authenticate, requireRole([...ROLES]), requirePermission('bulk-transfer:read'), controllers.get);
router.post('/', authenticate, requireRole([...ROLES]), requirePermission('bulk-transfer:create'), controllers.create);
router.patch('/:id', authenticate, requireRole([...ROLES]), requirePermission('bulk-transfer:update'), controllers.update);
router.delete('/:id', authenticate, requireRole([...ROLES]), requirePermission('bulk-transfer:delete'), controllers.remove);

export default router;
