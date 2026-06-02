// Express app factory for the new tree. Self-sufficient: helmet, CORS,
// compression, cookie parsing, request-id, structured logging, global
// rate limiting, the module routers, and the error envelope. Used by
// the standalone server (server.ts) and integration tests.

import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { corsOptions } from '@/core/config/cors';
import { globalRateLimit, authRateLimit } from '@/core/security/rate-limit';
import requestId from '@/shared/middlewares/request-id';
import httpLogger from '@/shared/middlewares/http-logger';
import { errorMiddleware } from '@/shared/middlewares/error';
import { registerRoutes } from '@/routes';

export interface BuildAppOptions {
  // Tests run without Redis; skip the rate limiter there.
  rateLimit?: boolean;
}

export function buildApp(opts: BuildAppOptions = {}): Express {
  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(requestId);
  app.use(httpLogger);
  app.use(cookieParser());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  if (opts.rateLimit !== false) {
    app.use(globalRateLimit());
    app.use('/api/v2/auth', authRateLimit());
  }

  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'blood-bank-api',
    });
  });

  app.use('/api/v2', registerRoutes());

  app.use(errorMiddleware);
  return app;
}
