// Refresh-cookie helpers. FIXED from the legacy bug where
// `secure: true` + `sameSite: 'strict'` silently dropped the cookie on
// http/localhost, breaking refresh entirely.
//
//   - secure only in production (https). On http dev the browser keeps it.
//   - sameSite 'lax' in dev (localhost:5173 -> localhost:5000 is same-site,
//     so lax sends it on XHR); 'none' in prod for cross-subdomain XHR.
//   - path '/' so every route (incl. /api/v2/auth/refresh) receives it.

import type { Response } from 'express';
import { env } from '@/core/config/env';
import { parseDuration } from './auth.tokens';

const COOKIE = 'refreshToken';
const isProd = env.NODE_ENV === 'production';

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: parseDuration(env.REFRESH_TOKEN_EXPIRY),
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(COOKIE, { path: '/', httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax' });
}

export const REFRESH_COOKIE_NAME = COOKIE;
