import express, { type Express, type RequestHandler } from 'express';
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
import componentRouter from '@/modules/component/component.routes';
import { getQueuesHealth } from '@/core/queue';

// Connect-style middleware (IncomingMessage signatures) are narrowed to
// Express RequestHandler here; safe because Express.Request extends
// IncomingMessage and Express.Response extends ServerResponse.
type AnyMiddleware = RequestHandler;
const rh = (h: unknown): AnyMiddleware => h as AnyMiddleware;

export interface BuildAppOptions {
  rateLimit?: boolean;
}

export function buildApp(opts: BuildAppOptions = {}): Express {
  const app = express();
  app.set('trust proxy', 1);

  app.use(rh(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })));
  app.use(rh(cors(corsOptions)));
  app.use(rh(compression()));
  app.use(requestId);
  app.use(rh(httpLogger));
  app.use(rh(cookieParser()));
  app.use(rh(express.json({ limit: '20mb' })));
  app.use(rh(express.urlencoded({ extended: true, limit: '20mb' })));

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

  app.get('/health/queues', async (_req, res) => {
    const queues = await getQueuesHealth();
    const healthy = queues.every((q) => q.failed === 0 && q.dlqWaiting === 0);
    res.status(healthy ? 200 : 207).json({ status: healthy ? 'healthy' : 'degraded', queues });
  });

  app.use('/api/v2', registerRoutes());
  app.use('/api/component', componentRouter);

  app.use(errorMiddleware);
  return app;
}
