// Entry for the new src/ tree. Currently NOT used in production —
// the legacy server.js continues to run until the first feature is
// cut over end-to-end. Run locally with `npm run dev:src`.

import http from 'node:http';
import { env } from '@/config/env';
import { logger } from '@/infra/logger';
import { buildApp } from '@/app';

async function main(): Promise<void> {
  const app = buildApp();
  const server = http.createServer(app);

  server.listen(env.PORT + 1, () => {
    logger.info({ port: env.PORT + 1 }, 'new-tree server listening (side-by-side)');
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'shutting down');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal boot error:', err.message ?? err);
  process.exit(1);
});
