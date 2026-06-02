import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission, requireRole } from '@/shared/middlewares/rbac';
import { auditService } from './audit.service';

const router = Router();

// Read the audit trail for one entity.
router.get(
  '/:entityType/:entityId',
  authenticate,
  requireRole(['system-admin', 'bbo', 'qa-manager', 'auditor']),
  requirePermission('audit:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entityType = String(req.params.entityType);
      const entityId = String(req.params.entityId);
      const data = await auditService.listForEntity(entityType, entityId);
      res.json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
