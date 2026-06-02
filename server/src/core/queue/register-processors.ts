import { registerEmailProcessor } from '@/modules/notification/notification.processor';
import { registerInventoryJobs } from '@/modules/inventory/inventory.jobs';
import { registerDonorJobs } from '@/modules/donor/donor.jobs';
import { childLogger } from '@/core/logger';

const log = childLogger({ module: 'core/queue/register' });

export function registerProcessors(): void {
  registerEmailProcessor();
  registerInventoryJobs();
  registerDonorJobs();
  log.info('queue processors registered');
}
