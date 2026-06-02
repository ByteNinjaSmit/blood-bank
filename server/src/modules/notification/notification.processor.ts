// Email queue processor. Renders the template and delivers via SMTP.
// Registered at server boot (see registerProcessors). Idempotent:
// re-running a job re-sends, which is acceptable for these alerts.

import { getQueue, QUEUE_NAMES } from '@/core/queue';
import { sendMail } from '@/core/mail';
import { renderEmail } from '@/shared/email/templates';
import { childLogger } from '@/core/logger';
import type { EmailJob } from './notification.service';

const log = childLogger({ module: 'notification-processor' });

export function registerEmailProcessor(): void {
  const queue = getQueue<EmailJob>(QUEUE_NAMES.EMAIL);
  queue.process('send-email', 5, async (job) => {
    const { type, to, payload } = job.data;
    const rendered = renderEmail(type, payload as never);
    await sendMail({
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
    log.info({ jobId: job.id, type, to }, 'email delivered');
  });
  log.info('email processor registered (concurrency 5)');
}
