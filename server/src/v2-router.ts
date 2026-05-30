// /api/v2 sub-router. Mountable on the legacy Express app so the new
// SOLID/TypeScript endpoints live on the same port (and behind the
// same nginx/CORS config) as /api/donor, /api/inventory, etc.
//
// Wiring in legacy server.js:
//   const { buildV2Router } = require('./dist/v2-router');
//   app.use('/api/v2', buildV2Router());
//
// Scope: only the request-handling middlewares the v2 routes need
// (auth/RBAC live on each route). Body parsing, helmet, cookieParser,
// request-id and http-logger are assumed to be applied at the legacy
// app level — server.js already wires request-id + http-logger.

import { Router } from 'express';
import donorRouter from '@/http/routes/donor';
import donationRouter from '@/http/routes/donation';
import { errorMiddleware } from '@/http/middlewares/error';

export function buildV2Router(): Router {
  const router = Router();

  router.use('/donor', donorRouter);
  router.use('/donation', donationRouter);

  // Per-router error middleware so v2 errors render with the new
  // {success,code,message,details,requestId} envelope regardless of
  // what the legacy app does on its own error path.
  router.use(errorMiddleware);

  return router;
}

export default buildV2Router;
