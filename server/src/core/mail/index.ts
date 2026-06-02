// Nodemailer transport. Lazy-initialised; verified on first use. SMTP
// config comes from validated env.

import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '@/core/config/env';
import { logger } from '@/core/logger';

const log = logger.child({ module: 'core/mail' });

let transporter: Transporter | null = null;

export function getTransporter(): Transporter {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_SECURE,
    auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
    pool: true, // reuse connections for batch sends
    maxConnections: 5,
    maxMessages: 100,
  });
  return transporter;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; path?: string; content?: Buffer }>;
}

export async function sendMail(input: SendMailInput): Promise<void> {
  const t = getTransporter();
  await t.sendMail({
    from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_USER}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    attachments: input.attachments,
  });
  log.info({ to: input.to, subject: input.subject }, 'mail sent');
}
