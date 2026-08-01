// Test environment bootstrap. Runs before any test file is imported, so
// `@/core/config/env` — which throws on a failed zod parse at module load —
// always sees a complete environment.
//
// Developer machines have a real server/.env that dotenv picks up; CI does
// not, which previously made 11 suites fail at import time rather than at
// assertion time. These are placeholders only: nothing here should point at
// a reachable service, and `??=` means a real .env still wins locally.

process.env.NODE_ENV ??= 'test';
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/bloodbank-test';
process.env.REDIS_URL ??= 'redis://127.0.0.1:6379';
process.env.JWT_SECRET ??= 'test-jwt-secret';
process.env.JWT_SECRET_KEY ??= 'test-jwt-secret-key';
// 'fatal' is the quietest level the LOG_LEVEL enum in env.ts accepts —
// 'silent' is valid for pino but would fail the same zod parse this file
// exists to satisfy.
process.env.LOG_LEVEL ??= 'fatal';
