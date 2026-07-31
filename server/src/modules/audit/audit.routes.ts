import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { auditController } from './audit.controller';

const router = Router();

const READ_ROLES = ['system-admin', 'bbo', 'qa-manager', 'auditor'] as const;
const EXPORT_ROLES = ['system-admin', 'qa-manager', 'auditor'] as const;
const PRINT_ROLES = [
  'system-admin',
  'bbo',
  'medical-officer',
  'store-keeper',
  'issue-counter',
  'hospital-user',
] as const;

// List-all with filters — the central Audit Trail viewer's primary feed.
router.get(
  '/',
  authenticate,
  requirePermission('audit:read'),
  auditController.search,
);

// Bulk export — narrower role grant than plain read, gated by a
// dedicated permission since export is a higher-risk data-exfiltration
// surface than paginated viewing.
router.get(
  '/export',
  authenticate,
  requirePermission('audit:export'),
  auditController.export,
);

// Fire a PRINT audit entry for a client-side print (label/report/sticker) —
// the print itself happens locally via window.print(), so this is the only
// server round-trip for that action.
router.post(
  '/print-event',
  authenticate,
  requirePermission('audit:write'),
  auditController.logPrintEvent,
);

// Read the audit trail for one entity.
router.get(
  '/:entityType/:entityId',
  authenticate,
  requirePermission('audit:read'),
  auditController.listForEntity,
);

export default router;
