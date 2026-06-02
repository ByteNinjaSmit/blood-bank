// Redis-backed rate limiting. A global limiter protects every route; a
// strict limiter guards auth endpoints against brute force. Distributed
// (shared Redis) so it holds across multiple api replicas.

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { getRedis } from '@/core/redis';
import { childLogger } from '@/core/logger';

const log = childLogger({ module: 'core/rate-limit' });

function build(
  keyPrefix: string,
  points: number,
  durationSec: number,
  blockSec: number,
): RequestHandler {
  const limiter = new RateLimiterRedis({
    storeClient: getRedis(),
    keyPrefix,
    points,
    duration: durationSec,
    blockDuration: blockSec,
  });

  return (req: Request, res: Response, next: NextFunction) => {
    limiter
      .consume(req.ip ?? 'unknown')
      .then(() => next())
      .catch(() => {
        log.warn({ ip: req.ip, keyPrefix }, 'rate limit exceeded');
        res.status(429).json({
          success: false,
          code: 'RATE_LIMITED',
          message: 'Too many requests',
          requestId: req.id,
        });
      });
  };
}

// 100 req / 30s, block 15s — general API.
export const globalRateLimit = (): RequestHandler => build('rl_global', 100, 30, 15);

// 10 req / 60s, block 60s — login/refresh/register.
export const authRateLimit = (): RequestHandler => build('rl_auth', 10, 60, 60);
