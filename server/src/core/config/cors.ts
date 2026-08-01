// CORS configuration for the new tree. Allowlist is env-driven
// (CORS_SERVER, comma-separated) plus the known production origins.
// Credentials enabled so the httpOnly refresh cookie flows.

import type { CorsOptions } from 'cors';
import { env } from '@/core/config/env';

const STATIC_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://sanjivanibloodbank.org',
  'https://www.sanjivanibloodbank.org',
  'https://system.sanjivanibloodbank.org',
];

const allowlist = new Set<string>([
  ...STATIC_ORIGINS,
  ...env.CORS_SERVER.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
]);

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (no Origin header) and allowlisted origins.
    if (!origin || allowlist.has(origin)) return callback(null, true);
    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
