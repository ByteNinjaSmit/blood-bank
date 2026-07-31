import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { requirePermission } from '@/shared/middlewares/rbac';
import { ROLE } from '@/shared/enums';
import { exportControllers } from '@/modules/export/export.controller';

const router = Router();

// Endpoint to dynamically generate styled Excel spreadsheets from JSON payloads.
// Any authenticated staff role may export the report they're already viewing;
// `report:export` is granted globally (see role-map.ts).
router.post(
  '/excel',
  authenticate,
  requirePermission('report:export'),
  exportControllers.exportExcel,
);

export default router;
