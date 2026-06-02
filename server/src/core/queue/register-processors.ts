// Single entry point to wire all Bull processors at boot. Called by
// server.ts (new tree) and can be required from legacy server.js after
// build.

import { registerEmailProcessor } from '@/modules/notification/notification.processor';
import { registerInventoryJobs } from '@/modules/inventory/inventory.jobs';
import { childLogger } from '@/core/logger';

const log = childLogger({ module: 'core/queue/register' });

export function registerProcessors(): void {
  registerEmailProcessor();
  registerInventoryJobs();
  log.info('queue processors registered');
}
