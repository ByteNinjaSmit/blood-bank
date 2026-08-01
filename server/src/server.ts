import 'dotenv/config';
import dns from 'node:dns';
import http from 'node:http';

// Fix MongoDB Atlas DNS resolution on Windows, where the system resolver
// sometimes fails SRV/TXT lookups. Fall back to whatever DNS servers the
// OS already had configured if 8.8.8.8/1.1.1.1 are unreachable (e.g.
// corporate network blocking outbound port 53) instead of leaving every
// downstream lookup to hang.
const systemDnsServers = dns.getServers();
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', ...systemDnsServers]);
} catch {
  dns.setServers(systemDnsServers);
}
dns.setDefaultResultOrder('ipv4first');

import { env } from '@/core/config/env';
import { logger } from '@/core/logger';
import { buildApp } from '@/app';
import { connectDb, disconnectDb } from '@/core/db';
import { registerProcessors } from '@/core/queue/register-processors';

async function main(): Promise<void> {
  await connectDb();
  registerProcessors();

  const app = buildApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'server listening');
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'shutting down');
    server.close(async () => {
      await disconnectDb().catch(() => undefined);
      process.exit(0);
    });
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
