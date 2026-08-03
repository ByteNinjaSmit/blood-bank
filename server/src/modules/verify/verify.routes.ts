// Intentionally public — this is the endpoint a QR code on a printed
// blood-bag label resolves to, scanned by anyone (staff, hospital,
// patient family) without a login. No auth/RBAC by design; the
// repository only ever selects a safe, non-PII field subset.
import { Router } from 'express';
import { createVerifyRepo } from '@/modules/verify/verify.repository';
import { createVerifyService } from '@/modules/verify/verify.service';
import { createVerifyControllers } from '@/modules/verify/verify.controller';

const router = Router();

const repo = createVerifyRepo();
const service = createVerifyService({ repo });
const controller = createVerifyControllers(service);

router.get('/:unitId', controller.verifyUnit);

export default router;
