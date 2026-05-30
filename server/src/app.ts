// Standalone Express app used by integration tests and the
// side-by-side dev runtime (server.ts on PORT+1). Production mounts
// the v2 router under the legacy server.js process instead — see
// v2-router.ts.

import express, { type Express } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import requestId from '@/http/middlewares/request-id';
import httpLogger from '@/http/middlewares/http-logger';
import { errorMiddleware } from '@/http/middlewares/error';
import { buildV2Router } from '@/v2-router';

export function buildApp(): Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(requestId);
  app.use(httpLogger);
  app.use(cookieParser());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'blood-bank-api-src',
    });
  });

  app.use('/api/v2', buildV2Router());

  app.use(errorMiddleware);
  return app;
}
