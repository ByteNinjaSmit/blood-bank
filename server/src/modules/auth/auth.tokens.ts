// JWT sign/verify + a tiny duration parser (avoids the `ms` dep). Access
// tokens signed with JWT_SECRET_KEY, refresh tokens with JWT_SECRET —
// two distinct secrets so a leaked access secret can't mint refreshes.

import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '@/core/config/env';

export interface AccessClaims {
  userID: string;
  email: string;
  role: string;
}

// @types/jsonwebtoken@9 narrows expiresIn to a template-literal string
// union; env values like '15m'/'7d' are valid at runtime, so cast.
const accessOpts = { expiresIn: env.ACCESS_TOKEN_EXPIRY } as SignOptions;
const refreshOpts = { expiresIn: env.REFRESH_TOKEN_EXPIRY } as SignOptions;

export function signAccessToken(claims: AccessClaims): string {
  return jwt.sign(claims, env.JWT_SECRET_KEY, accessOpts);
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userID: userId }, env.JWT_SECRET, refreshOpts);
}

export function verifyAccessToken(token: string): AccessClaims {
  return jwt.verify(token, env.JWT_SECRET_KEY) as AccessClaims;
}

export function verifyRefreshToken(token: string): { userID: string } {
  return jwt.verify(token, env.JWT_SECRET) as { userID: string };
}

// Parse '15m' / '7d' / '1h' / '30s' to milliseconds.
export function parseDuration(value: string): number {
  const m = /^(\d+)\s*(ms|s|m|h|d)?$/.exec(value.trim());
  if (!m) return 0;
  const n = Number(m[1]);
  switch (m[2]) {
    case 'ms':
      return n;
    case 's':
      return n * 1000;
    case 'm':
      return n * 60_000;
    case 'h':
      return n * 3_600_000;
    case 'd':
      return n * 86_400_000;
    default:
      return n; // bare number = ms
  }
}
