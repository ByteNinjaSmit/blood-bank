import pino from 'pino';
import { env } from '@/core/config/env';

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.passwordHash',
  'req.body.token',
  'req.body.otp',
  'req.body.code',
  'JWT_SECRET',
  'JWT_SECRET_KEY',
  'EMAIL_PASS',
  'AWS_SECRET_ACCESS_KEY',
  'TWILIO_AUTH_TOKEN',
];

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: { paths: redactPaths, censor: '[REDACTED]' },
  ...(env.NODE_ENV !== 'production'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
        },
      }
    : {}),
});

export function childLogger(bindings: Record<string, unknown>): pino.Logger {
  return logger.child(bindings);
}
