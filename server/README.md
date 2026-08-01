# Blood Bank — Server (REST API)

Node.js + Express backend for the Blood Bank Management System. Provides all
REST APIs, Socket.IO realtime channels, background queues/jobs, PDF report
generation, email/SMS notifications, and security middleware.

Part of the [Blood Bank Management System](../README.md) monorepo. For the full
cross-cutting reference (connection architecture, environment matrix, security,
licensing) see [`../DOCUMENTATION.md`](../DOCUMENTATION.md).

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Environment Variables](#environment-variables)
4. [Installation & Run](#installation--run)
5. [API Endpoints](#api-endpoints)
6. [Connections](#connections)
7. [Background Queues & Jobs](#background-queues--jobs)
8. [Security](#security)
9. [Logging & Monitoring](#logging--monitoring)
10. [Troubleshooting](#troubleshooting)

---

## Tech Stack

- **Node.js 20**, **Express 5**
- **MongoDB** via **Mongoose 8** (database `BloodBank`)
- **Redis 7** — cache, rate limiting, queues, Socket.IO adapter
- **Socket.IO 4** — realtime channels (Redis adapter for multi-process)
- **Bull 4** — background job queues
- **JWT** + **bcrypt** + **cookie-parser** — auth
- **helmet**, **cors**, **express-rate-limit**, **rate-limiter-flexible** — security
- **nodemailer** (Gmail SMTP) — notifications. No SMS provider is wired.
- **@aws-sdk/client-s3** — uploads to an S3-compatible store (MinIO)
- **pdfkit** — PDF reports; **Pino** — logging
- **Zod** — input validation

## Project Structure

```
server/
├── src/               TypeScript source — the only backend tree
│   ├── server.ts      entrypoint (compiles to dist/server.js)
│   ├── app.ts         Express app factory
│   ├── routes.ts      central router registry
│   ├── core/          config, db, redis, queue, cache, mail, logger, security
│   ├── modules/       one folder per feature (model/repo/service/controller/
│   │                  validator/routes/tests colocated)
│   └── shared/        middlewares, compatibility engine, enums, errors
├── dist/              build output — what the Docker image runs
├── Dockerfile         node:20-bookworm-slim, runs as non-root `node`
├── scripts/           one-off maintenance + seed scripts (tsx)
├── reports/           generated PDF reports
├── uploads/           uploaded files
└── logs/              runtime logs
```

> The legacy CommonJS tree (`server.js`, `start.js`, `config/`, `controllers/`,
> `routers/`, `models/`, `services/`, …) was deleted. `src/` is canonical.
> See [`CLAUDE.md`](./CLAUDE.md) for the per-module layering rules.

## Environment Variables

Copy the template and fill in values:

```bash
cp .env.example .env
```

`.env.example` documents every variable with `[DEV]` / `[PROD]` markers. Key
variables:

| Variable                                                                                   | Required    | Dev                                               | Prod                          |
| ------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------- | ----------------------------- |
| `MONGODB_URI`                                                                              | yes         | `mongodb://localhost:27017/`                      | authenticated remote URI      |
| `REDIS_URL`                                                                                | yes         | `redis://localhost:6379`                          | `redis://redis:6379` (Docker) |
| `PORT`                                                                                     | yes         | `5000`                                            | `5000`                        |
| `NODE_ENV`                                                                                 | yes         | `development`                                     | `production`                  |
| `JWT_SECRET`, `JWT_SECRET_KEY`                                                             | yes         | dev placeholders                                  | strong random, unique         |
| `ACCESS_TOKEN_EXPIRY` / `REFRESH_TOKEN_EXPIRY`                                             | yes         | `15m` / `7d`                                      | `15m` / `7d`                  |
| `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM_NAME`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`  | for email   | Gmail App Password; `465`+`true` or `587`+`false` | same                          |
| `ADMIN_EMAIL`                                                                              | for email   | test inbox                                        | admin inbox                   |
| `BANK_NAME`, `BANK_ADDRESS`, `BANK_PHONE`, `BANK_LICENSE`, `BANK_WEBSITE`                  | yes         | real details — they print on reports              | same                          |
| `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_PUBLIC_URL` | for uploads | MinIO dev instance                                | MinIO prod instance           |
| `REPORTS_DIR`, `NEAR_EXPIRY_DAYS`                                                          | yes         | `./reports`, `2`                                  | same                          |
| `SYSTEM_USER_ID`                                                                           | yes         | valid Mongo ObjectId                              | valid Mongo ObjectId          |

> `BANK_*` and `S3_*` have permissive defaults in `src/core/config/env.ts`, so
> omitting them does not stop the server booting — it produces reports with
> placeholder licence details, or uploads that fail per-request.
>
> `AWS_*`, `SNS_PHONE`, `TWILIO_*` and `TIMEZONE` were removed; nothing reads
> them. Don't reintroduce them without a consumer.

> Full table and connection details:
> [`../DOCUMENTATION.md`](../DOCUMENTATION.md) §5–§7.

## Installation & Run

```bash
cd server
npm ci                        # use ci, not install — respects the lockfile
cp .env.example .env          # edit with your values
npm run dev                   # tsx watch src/server.ts, auto-reload
```

| Command             | Use                                     |
| ------------------- | --------------------------------------- |
| `npm run dev`       | development — `tsx watch src/server.ts` |
| `npm run build`     | `tsc` + `tsc-alias` → `dist/`           |
| `npm start`         | build, then `node dist/server.js`       |
| `npm run typecheck` | `tsc --noEmit`                          |
| `npm run lint`      | eslint                                  |
| `npm test`          | vitest (single run)                     |

> `npm run lint`, `npm run typecheck`, `npm run build` and `npm test` are
> exactly what the CI `verify` job runs. Green locally = green in CI.
>
> Editing `package.json` without re-running `npm install` desynchronises the
> lockfile, and both CI and the Docker build use `npm ci` — which hard-fails
> on a desynced lockfile. Always commit the updated `package-lock.json`.

API: `http://localhost:5000` · Health: `http://localhost:5000/health`

## API Endpoints

Base path `/api/v2`. Every module router is mounted in `src/routes.ts`:

```
adverse-reaction  affected-records  appointment  audit  auth
bag-discard  bag-inspection  bag-issue  bag-stock  bulk-transfer
camp  chemical-inventory  component  dashboard  deferral
donation  donor  donor-card  export  feedback  goods-receipt
hospital  inventory  lookback  mis  monthly-report
monthly-report-input  notification  purchase-order  requisition
role  storage-transfer  transfusion  tti  upload  user  vendor
```

A few pre-`/api/v2` paths are still mounted in `src/app.ts` for clients that
have not migrated: `/api/requests`, `/api/component`, `/api/serology`,
`/api/inventory`, `/api/discard`, `/api/donation`. Do not add new routes there.

Non-API routes:

| Route                | Purpose                                         |
| -------------------- | ----------------------------------------------- |
| `GET /health`        | health check — status, uptime, service name     |
| `GET /health/queues` | per-queue counts; `200` healthy, `207` degraded |
| `/socket.io/`        | Socket.IO realtime endpoint                     |

Every route declares `requirePermission(...)`; `auth` is the only exception.
`role` is a display label with no authorization weight — see
`src/shared/middlewares/rbac.ts`.

## Connections

| Connection                             | Configured in        | Variable      |
| -------------------------------------- | -------------------- | ------------- |
| MongoDB                                | `src/core/db`        | `MONGODB_URI` |
| Redis (rate limit / Socket.IO adapter) | `src/core/redis`     | `REDIS_URL`   |
| Redis (Bull queues)                    | `src/core/queue`     | `REDIS_URL`   |
| SMTP                                   | `src/core/mail`      | `EMAIL_*`     |
| S3 / MinIO                             | `src/modules/upload` | `S3_*`        |

Notes:

- `src/core/db` forces `dbName: 'BloodBank'` — the path in `MONGODB_URI` is
  ignored for the database name. Pool size `200`, server-selection timeout `5s`.
- Inside Docker, Redis is reached as `redis://redis:6379` (service name), not
  `localhost`. `REDIS_URL` is required — `src/core/config/env.ts` refuses to
  boot without it.
- CORS lives in `src/core/config/cors.ts`: a `STATIC_ORIGINS` array merged with
  the comma-separated `CORS_SERVER` env var, so new domains need no code change.
- `app.set("trust proxy", 1)` — required for correct client IPs behind Nginx.

## Background Queues & Jobs

Bull queues are created through `src/core/queue` and wired up by
`register-processors.ts` on boot. Each is colocated with its module as
`<module>.jobs.ts`:

| Queue                     | Defined in                                |
| ------------------------- | ----------------------------------------- |
| `inventory-maintenance`   | `modules/inventory/inventory.jobs.ts`     |
| `inventory-reports`       | `modules/inventory/inventory.jobs.ts`     |
| `component-maintenance`   | `modules/component/component.jobs.ts`     |
| `donor-maintenance`       | `modules/donor/donor.jobs.ts`             |
| `requisition-maintenance` | `modules/requisition/requisition.jobs.ts` |
| `tti-maintenance`         | `modules/tti/tti.jobs.ts`                 |

Every queue gets a dead-letter queue automatically. `GET /health/queues`
reports failed and DLQ-waiting counts per queue and returns `207` if any is
non-zero — that endpoint is the one to alert on.

Component-specific near-expiry thresholds: Platelets 1 day, RBC 7 days,
FFP 30 days, Cryo 30 days.

## Security

- **helmet** — HTTP security headers (`src/app.ts`).
- **CORS** — allow-list in `src/core/config/cors.ts`; no wildcard, credentials
  enabled for the httpOnly refresh cookie.
- **Rate limiting** — Redis-backed `rate-limiter-flexible`, so limits hold
  across replicas: 100 req / 30s per IP globally (15s block), 10 req / 60s on
  `/api/v2/auth` (60s block).
- **JWT auth** — access token `15m` signed with `JWT_SECRET_KEY`, refresh
  token `7d` signed with `JWT_SECRET`; verified in
  `src/shared/middlewares/authenticate.ts`.
- **Authorization** — `requirePermission(...)` from
  `src/shared/middlewares/rbac.ts` on every route.
- **Cookies** — `httpOnly` always; `secure` + `sameSite: none` in production.
- **bcrypt** — password hashing.
- **Input validation** — Zod schemas at `src/modules/<f>/<f>.validator.ts`.
- **Non-root container** — Docker image runs as user `node`.

> **Do not commit `.env`.** Use `.env.example` as the shared template. See
> [`../DOCUMENTATION.md`](../DOCUMENTATION.md) §10.1 — credentials remain in
> git history and rotation is still outstanding.

## Logging & Monitoring

- **Logger:** pino (`src/core/logger`), child loggers per module via
  `childLogger({ module: 'x-service' })`. Redacts auth headers, cookies,
  password/token/OTP bodies, and the secret env vars.
- **Output:** stdout. `pino-pretty` outside production; raw JSON in production,
  captured by the Docker json-file driver (`10m × 3`).
- **Health:** `GET /health` and `GET /health/queues`.
- **Debug logging:** `LOG_LEVEL=debug npm run dev`.

> Never log a request body at INFO — it carries PHI/PII. Use the audit trail
> (`modules/audit`) instead.

## Troubleshooting

| Symptom                                   | Cause                                                              | Fix                                                         |
| ----------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| `MongoServerSelectionError`               | bad `MONGODB_URI`, DB down, IP not whitelisted, unencoded password | verify URI; encode `@`→`%40`, `#`→`%23`                     |
| Redis `MaxRetriesPerRequestError`         | `REDIS_URL` wrong / unset / Redis down                             | `redis-cli ping`; set `REDIS_URL`                           |
| Queues idle in Docker                     | `REDIS_URL` points at localhost, which is the container itself     | set `REDIS_URL=redis://redis:6379`                          |
| `Invalid environment variables:`          | a required var failed the zod schema                               | the message names the keys; set them                        |
| CORS error in browser                     | origin missing from allow-list                                     | add it to `CORS_SERVER` (comma-separated)                   |
| Email not sending                         | bad app password, 2FA off, wrong port/secure pair                  | use Gmail App Password; `465`+`true` or `587`+`false`       |
| Uploads fail, server healthy              | `S3_*` unset or bucket missing                                     | blank S3 vars fail per-request, not at boot                 |
| PDF generation fails                      | `REPORTS_DIR` missing / not writable                               | ensure `./reports` exists and is writable                   |
| `429 Too Many Requests`                   | rate limiter triggered                                             | expected under load; tune `src/core/security/rate-limit.ts` |
| `npm ci`: `Missing: <pkg> from lock file` | `package.json` edited without refreshing the lockfile              | `npm install`, then commit `package-lock.json`              |

More: [`PRODUCTION.md`](./PRODUCTION.md), [`EMAIL_QUEUE_SETUP.md`](./EMAIL_QUEUE_SETUP.md),
[`../DOCUMENTATION.md`](../DOCUMENTATION.md).
