// Strongly typed env config. The runtime parse + redaction live in
// server/config/env.js so both old and new trees share a single
// validated object. This file re-exports that as the typed interface.

import { z } from 'zod';

const EnvShape = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.number(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),
  TIMEZONE: z.string(),
  MONGODB_URI: z.string(),
  REDIS_URL: z.string(),
  CORS_SERVER: z.string(),
  JWT_SECRET: z.string(),
  JWT_SECRET_KEY: z.string(),
  ACCESS_TOKEN_EXPIRY: z.string(),
  REFRESH_TOKEN_EXPIRY: z.string(),
  EMAIL_USER: z.string(),
  EMAIL_PASS: z.string(),
  EMAIL_HOST: z.string(),
  EMAIL_PORT: z.number(),
  EMAIL_SECURE: z.boolean(),
  ADMIN_EMAIL: z.string(),
  NEAR_EXPIRY_DAYS: z.number(),
  REPORTS_DIR: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_REGION: z.string(),
  SNS_PHONE: z.string(),
  TWILIO_ACCOUNT_SID: z.string(),
  TWILIO_AUTH_TOKEN: z.string(),
  TWILIO_PHONE_NUMBER: z.string(),
  SYSTEM_USER_ID: z.string(),
});

export type Env = z.infer<typeof EnvShape>;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const raw = require('../../../config/env.js') as Env;
export const env: Env = EnvShape.parse(raw);
