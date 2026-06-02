import { z } from 'zod';

const EnvShape = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  TIMEZONE: z.string().default('Asia/Kolkata'),
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CORS_SERVER: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(1),
  JWT_SECRET_KEY: z.string().min(1),
  ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
  EMAIL_USER: z.string().default(''),
  EMAIL_PASS: z.string().default(''),
  EMAIL_FROM_NAME: z.string().default('Sanjivani Blood Bank'),
  EMAIL_HOST: z.string().default('smtp.gmail.com'),
  EMAIL_PORT: z.coerce.number().default(587),
  EMAIL_SECURE: z.coerce.boolean().default(false),
  ADMIN_EMAIL: z.string().default(''),
  BANK_NAME: z.string().default('Sanjivani Blood Bank'),
  BANK_ADDRESS: z.string().default(''),
  BANK_PHONE: z.string().default(''),
  BANK_LICENSE: z.string().default(''),
  BANK_WEBSITE: z.string().default(''),
  NEAR_EXPIRY_DAYS: z.coerce.number().default(3),
  REPORTS_DIR: z.string().default('./reports'),
  AWS_ACCESS_KEY_ID: z.string().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().default(''),
  AWS_REGION: z.string().default('ap-south-1'),
  SNS_PHONE: z.string().default(''),
  TWILIO_ACCOUNT_SID: z.string().default(''),
  TWILIO_AUTH_TOKEN: z.string().default(''),
  TWILIO_PHONE_NUMBER: z.string().default(''),
  SYSTEM_USER_ID: z.string().default('000000000000000000000000'),
});

export type Env = z.infer<typeof EnvShape>;

const result = EnvShape.safeParse(process.env);
if (!result.success) {
  const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
  throw new Error(`Invalid environment variables: ${missing}`);
}
export const env: Env = result.data;
