import { getQueue, QUEUE_NAMES } from '@/core/queue';
import { childLogger } from '@/core/logger';
import type { NotificationType } from '@/shared/enums';
import type { TemplatePayloads } from '@/shared/email/templates';
import type { INotificationService } from '@/shared/interfaces';

export interface EmailJob<K extends NotificationType = NotificationType> {
  type: K;
  to: string;
  payload: TemplatePayloads[K];
}

const log = childLogger({ module: 'notification-service' });

export const notificationService: INotificationService = {
  async send<K extends NotificationType>(job: EmailJob<K>): Promise<void> {
    await getQueue<EmailJob>(QUEUE_NAMES.EMAIL).add('send-email', job, {
      jobId: dedupeId(job as EmailJob),
    });
    log.info({ type: job.type, to: job.to }, 'email enqueued');
  },
};

function dedupeId(job: EmailJob): string | undefined {
  if (job.type === 'TTI_REACTIVE_ALERT' || job.type === 'LOOKBACK_RECALL') {
    return `${job.type}:${JSON.stringify(job.payload)}`;
  }
  return undefined;
}
