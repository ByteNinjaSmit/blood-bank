// server/config/env.js
//
// Single source of truth for environment configuration. Validates with
// zod at boot — the process refuses to start if anything required is
// missing or malformed. Old code can keep reading process.env directly
// during the side-by-side migration; new code under server/src/ should
// `require('./config/env')` and use the typed object.

const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { z } = require('zod');

const RawEnv = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    TIMEZONE: z.string().default('Asia/Kolkata'),

    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    REDIS_URL: z.string().min(1).default('redis://localhost:6379'),

    CORS_SERVER: z.string().min(1, 'CORS_SERVER is required'),

    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be >= 32 chars'),
    JWT_SECRET_KEY: z.string().min(32, 'JWT_SECRET_KEY must be >= 32 chars'),
    ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
    REFRESH_TOKEN_EXPIRY: z.string().default('7d'),

    EMAIL_USER: z.string().email(),
    EMAIL_PASS: z.string().min(1),
    EMAIL_HOST: z.string().default('smtp.gmail.com'),
    EMAIL_PORT: z.coerce.number().int().positive().default(465),
    EMAIL_SECURE: z
      .union([z.boolean(), z.string()])
      .transform((v) => v === true || v === 'true')
      .default(true),
    ADMIN_EMAIL: z.string().email(),

    NEAR_EXPIRY_DAYS: z.coerce.number().int().positive().default(2),
    REPORTS_DIR: z.string().default('./reports'),

    AWS_ACCESS_KEY_ID: z.string().optional().default(''),
    AWS_SECRET_ACCESS_KEY: z.string().optional().default(''),
    AWS_REGION: z.string().default('ap-south-1'),
    SNS_PHONE: z.string().optional().default(''),

    TWILIO_ACCOUNT_SID: z.string().optional().default(''),
    TWILIO_AUTH_TOKEN: z.string().optional().default(''),
    TWILIO_PHONE_NUMBER: z.string().optional().default(''),

    SYSTEM_USER_ID: z.string().regex(/^[a-f0-9]{24}$/i, 'SYSTEM_USER_ID must be a 24-char hex ObjectId'),
  })
  .passthrough();

let parsed;
try {
  parsed = RawEnv.parse(process.env);
} catch (err) {
  // Throw a tagged error so callers (legacy server.js mounting the v2
  // router, or src/server.ts standalone) can decide whether the failure
  // is fatal. Production should treat this as fatal.
  const message = ['Invalid or missing environment variables:'];
  if (err && Array.isArray(err.issues)) {
    for (const issue of err.issues) {
      message.push(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
  } else {
    message.push(String(err));
  }
  const error = new Error(message.join('\n'));
  error.name = 'EnvValidationError';
  throw error;
}

module.exports = Object.freeze(parsed);
