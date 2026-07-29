import { registerEmailProcessor } from '@/modules/notification/notification.processor';
import { registerInventoryJobs } from '@/modules/inventory/inventory.jobs';
import { registerDonorJobs } from '@/modules/donor/donor.jobs';
import { registerComponentJobs } from '@/modules/component/component.jobs';
import { registerTtiJobs } from '@/modules/tti/tti.jobs';
import { registerRequisitionJobs } from '@/modules/requisition/requisition.jobs';
import { childLogger } from '@/core/logger';

const log = childLogger({ module: 'core/queue/register' });

export function registerProcessors(): void {
  registerEmailProcessor();
  registerInventoryJobs();
  registerDonorJobs();
  registerComponentJobs();
  registerTtiJobs();
  registerRequisitionJobs();
  log.info('queue processors registered');
}
