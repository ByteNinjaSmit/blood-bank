import { Router } from 'express';
import { authenticate } from '@/shared/middlewares/authenticate';
import { exportControllers } from '@/modules/export/export.controller';

const router = Router();

// Endpoint to dynamically generate styled Excel spreadsheets from JSON payloads
router.post('/excel', authenticate, exportControllers.exportExcel);

export default router;
