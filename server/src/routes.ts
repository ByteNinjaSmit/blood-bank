// Central route registry. Mounts every module router under /api/v2.
// Mountable on the legacy Express app so the new SOLID/TypeScript
// endpoints live on the same port (and behind the same nginx/CORS
// config) as /api/donor, /api/inventory, etc.
//
// Wiring in legacy server.js:
//   const { registerRoutes } = require('./dist/routes');
//   app.use('/api/v2', registerRoutes());
//
// Auth/RBAC live on each module's routes. Body parsing, helmet,
// cookieParser, request-id and http-logger are applied at the app
// level (app.ts) or by legacy server.js.

import { Router } from 'express';
import authRouter from '@/modules/auth/auth.routes';
import donorRouter from '@/modules/donor/donor.routes';
import donationRouter from '@/modules/donation/donation.routes';
import ttiRouter from '@/modules/tti/tti.routes';
import inventoryRouter from '@/modules/inventory/inventory.routes';
import deferralRouter from '@/modules/deferral/deferral.routes';
import requisitionRouter from '@/modules/requisition/requisition.routes';
import transfusionRouter from '@/modules/transfusion/transfusion.routes';
import adverseReactionRouter from '@/modules/adverse-reaction/adverse-reaction.routes';
import lookbackRouter from '@/modules/lookback/lookback.routes';
import auditRouter from '@/modules/audit/audit.routes';
import { errorMiddleware } from '@/shared/middlewares/error';

interface ModuleRoute {
  path: string;
  router: Router;
}

const MODULE_ROUTES: ReadonlyArray<ModuleRoute> = [
  { path: '/auth', router: authRouter },
  { path: '/donor', router: donorRouter },
  { path: '/donation', router: donationRouter },
  { path: '/tti', router: ttiRouter },
  { path: '/inventory', router: inventoryRouter },
  { path: '/deferral', router: deferralRouter },
  { path: '/requisition', router: requisitionRouter },
  { path: '/transfusion', router: transfusionRouter },
  { path: '/adverse-reaction', router: adverseReactionRouter },
  { path: '/lookback', router: lookbackRouter },
  { path: '/audit', router: auditRouter },
];

export function registerRoutes(): Router {
  const router = Router();

  for (const { path, router: moduleRouter } of MODULE_ROUTES) {
    router.use(path, moduleRouter);
  }

  // Per-router error middleware so v2 errors render with the new
  // {success,code,message,details,requestId} envelope regardless of
  // what the legacy app does on its own error path.
  router.use(errorMiddleware);

  return router;
}

export default registerRoutes;
