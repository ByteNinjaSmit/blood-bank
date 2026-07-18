import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission, requireRole } from '@/shared/middlewares/rbac';
import { affectedRecordsController } from './affected-records.controller';

const router = Router();

// Same role gate as the Audit Trail / Recycle Bin — read-only,
// compliance-facing view of every record the cascade system preserved
// instead of deleting.
router.get(
  '/',
  authenticate,
  requireRole(['system-admin', 'bbo', 'qa-manager', 'auditor']),
  requirePermission('audit:read'),
  affectedRecordsController.list,
);

export default router;
