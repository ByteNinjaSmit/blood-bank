// Notification service. Enqueues typed email jobs onto the Bull email
// queue. Callers never touch nodemailer directly — they describe WHAT
// to send; the processor renders + delivers asynchronously with retry.

import { getQueue, QUEUE_NAMES } from '@/core/queue';
import { childLogger } from '@/core/logger';
import type { NotificationType } from '@/shared/enums';
import type { TemplatePayloads } from '@/shared/email/templates';

export interface EmailJob<K extends NotificationType = NotificationType> {
  type: K;
  to: string;
  payload: TemplatePayloads[K];
}

const log = childLogger({ module: 'notification-service' });

export const notificationService = {
  async send<K extends NotificationType>(job: EmailJob<K>): Promise<void> {
    await getQueue<EmailJob>(QUEUE_NAMES.EMAIL).add('send-email', job, {
      jobId: dedupeId(job),
    });
    log.info({ type: job.type, to: job.to }, 'email enqueued');
  },
};

// Dedupe identical alerts within a short window (Bull drops duplicate
// jobIds). Keeps a flapping TTI reactive from spamming the counsellor.
function dedupeId(job: EmailJob): string | undefined {
  if (job.type === 'TTI_REACTIVE_ALERT' || job.type === 'LOOKBACK_RECALL') {
    return `${job.type}:${JSON.stringify(job.payload)}`;
  }
  return undefined;
}
