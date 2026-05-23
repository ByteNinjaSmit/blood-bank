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
- **nodemailer** (Gmail SMTP), **Twilio**, **AWS SNS** — notifications
- **pdfkit** — PDF reports; **Winston** / **Pino** — logging
- **Zod** — input validation

## Project Structure

```
server/
├── server.js          app entrypoint (single process)
├── start.js           cluster entrypoint (forks per CPU in production)
├── Dockerfile         node:20-bookworm-slim, runs as non-root `node`
├── config/            db.js, redis.js, mailConfig.js, twilio.js
├── controllers/       request handlers per domain
├── routers/           route definitions (*-routes.js)
├── models/            Mongoose models
├── middlewares/        auth, admin, role, error, upload
├── validators/        Zod schemas
├── queues/            Bull queue definitions
├── jobs/              background job processors
├── services/          business logic (expiry, email, reports)
├── lib/               pdfGenerator, smsClient, helpers
├── utils/             logger and utilities
├── reports/           generated PDF reports
├── uploads/           uploaded files
└── logs/              app.log, error.log, info.log
```

## Environment Variables

Copy the template and fill in values:

```bash
cp .env.example .env
```

`.env.example` documents every variable with `[DEV]` / `[PROD]` markers. Key
variables:

| Variable | Required | Dev | Prod |
|----------|----------|-----|------|
| `MONGODB_URI` | yes | `mongodb://localhost:27017/` | authenticated remote URI |
| `REDIS_URL` | yes | `redis://localhost:6379` | `redis://redis:6379` (Docker) |
| `PORT` | yes | `5000` | `5000` |
| `NODE_ENV` | yes | `development` | `production` |
| `JWT_SECRET`, `JWT_SECRET_KEY` | yes | dev placeholders | strong random, unique |
| `ACCESS_TOKEN_EXPIRY` / `REFRESH_TOKEN_EXPIRY` | yes | `15m` / `7d` | `15m` / `7d` |
| `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE` | for email | Gmail App Password; `465`+`true` or `587`+`false` | same |
| `ADMIN_EMAIL` | for email | test inbox | admin inbox |
| `REPORTS_DIR`, `NEAR_EXPIRY_DAYS`, `TIMEZONE` | yes | `./reports`, `2`, `Asia/Kolkata` | same |
| `AWS_*`, `SNS_PHONE` | optional | — | set if SMS used |
| `TWILIO_*` | optional | — | set if SMS used |
| `SYSTEM_USER_ID` | yes | valid Mongo ObjectId | valid Mongo ObjectId |

> Full table, dev-vs-prod comment matrix, and connection details:
> [`../DOCUMENTATION.md`](../DOCUMENTATION.md) §5–§7.

## Installation & Run

```bash
cd server
npm install
cp .env.example .env          # edit with your values
npm start                     # nodemon server.js (auto-reload)
```

| Command | Use |
|---------|-----|
| `npm start` / `npm run dev` | development — `nodemon server.js`, auto-reload |
| `node server.js` | single-process run |
| `node start.js` | production cluster — one worker per CPU, auto-restart |

API: `http://localhost:5000` · Health: `http://localhost:5000/health`

## API Endpoints

Base path `/api`. Route prefixes mounted in `server.js`:

| Prefix | Router | Domain |
|--------|--------|--------|
| `/api/auth` | `auth-routes` | login, OTP, register, logout, refresh |
| `/api/site` | `site-routes` | site / branch management |
| `/api/donor` | `donor-routes` | donor registration & management |
| `/api/donation` | `donation-routes` | blood bag collection |
| `/api/hospitals` | `hospital-routes` | hospital master data |
| `/api/inventory` | `inventory-routes` | component inventory |
| `/api/requests` | `request-routes` | requisitions, matching, issue |
| `/api/component` | `component-routes` | component separation |
| `/api/users` | `user-routes` | users & roles |
| `/api/discard` | `discard-routes` | discard management |
| `/api/sernology` | `lab-routes` | serology / lab results |
| `/api/admin` | `admin-routes` | admin operations |
| `/api/dashboard` | `dashboard-routes` | dashboard data |
| `/api/mis` | `mis-routes` | MIS reports & KPIs |
| `/api/appointments` | `appointment-routes` | donor appointments |
| `/api/test` | `test-routes` | dev/test utilities (e.g. trigger expiry report) |

Non-API routes:

| Route | Purpose |
|-------|---------|
| `GET /` | API welcome message |
| `GET /health` | health check (status, uptime, env, service flags) |
| `/socket.io/` | Socket.IO realtime endpoint |
| `/database/uploads/*` | static uploaded files |

> Additional router files exist (`audit-routes`, `import-routes`,
> `report-routes`, `transfusion-routes`). Mount them in `server.js` before use
> and document them here when activated.

## Connections

| Connection | Configured in | Variable |
|------------|---------------|----------|
| MongoDB | `config/db.js` (`connectToDatabase`) | `MONGODB_URI` |
| Redis (rate limit / Socket.IO adapter) | `server.js` | `REDIS_URL` |
| Redis (Bull queues) | `config/redis.js` (`createQueue`) | `REDIS_URL` |
| SMTP | `config/mailConfig.js` | `EMAIL_*` |
| Twilio | `config/twilio.js` (lazy init) | `TWILIO_*` |

Notes:

- `config/db.js` forces `dbName: 'BloodBank'` — the path in `MONGODB_URI` is
  ignored for the database name. Pool size `200`, server-selection timeout `5s`.
- Inside Docker, Redis is reached as `redis://redis:6379` (service name), not
  `localhost`. `REDIS_URL` must be set explicitly in containers — ioredis
  otherwise falls back to `127.0.0.1:6379` and fails.
- CORS / Socket.IO origins are the hard-coded `allowedOrigins` array in
  `server.js`. Add production domains there.
- `app.set("trust proxy", 1)` — required for correct client IPs behind Nginx.

## Background Queues & Jobs

Bull queues, initialized on boot in `server.js`:

| Queue | File | Purpose |
|-------|------|---------|
| Expiry report | `queues/expiry-queue.js` | daily near-expiry PDF report + email |
| Discard | `queues/discard-queue.js` | discard processing |
| Email OTP | `queues/email-otp-queue.js` | OTP email delivery |
| Birthday SMS | `queues/birthday-queue.js` | birthday SMS notifications |

Queue defaults (`config/redis.js`): 3 attempts, exponential backoff,
`removeOnComplete`, lock duration 5 min.

**Expiry report** — generates a near-expiry PDF (`lib/pdfGenerator.js`) via
`services/blood-expiry-service.js` and emails it to `ADMIN_EMAIL`.

> **Environment difference:** the expiry cron uses a frequent test schedule in
> development. Set it to the daily production schedule (`0 8 * * *`) before
> deploying — see [`EMAIL_QUEUE_SETUP.md`](./EMAIL_QUEUE_SETUP.md).

Component-specific near-expiry thresholds: Platelets 1 day, RBC 7 days,
FFP 30 days, Cryo 30 days.

## Security

- **helmet** — HTTP security headers.
- **CORS** — origin allow-list (`allowedOrigins` in `server.js`).
- **Rate limiting** — global `rate-limiter-flexible` (100 req / 30s per IP,
  15s block) backed by Redis; stricter `express-rate-limit` (10 req / 30s) for
  sensitive endpoints.
- **JWT auth** — short access token (`15m`) + refresh token (`7d`);
  middleware in `middlewares/auth-middleware.js`, role checks in
  `role-middleware.js` / `admin-middleware.js`.
- **bcrypt** — password hashing.
- **Input validation** — Zod schemas in `validators/`.
- **Non-root container** — Docker image runs as user `node`.

> **Do not commit `.env`.** Use `.env.example` as the shared template. See
> [`../DOCUMENTATION.md`](../DOCUMENTATION.md) §10 for the committed-secrets
> warning and rotation steps.

## Logging & Monitoring

- **Logger:** Winston/Pino (`utils/logger.js`). Logs HTTP requests, queue
  events, job lifecycle, and errors.
- **Files:** `logs/app.log`, `logs/error.log`, `logs/info.log`. Docker
  json-file driver caps at `10m × 3`.
- **Health:** `GET /health` returns status, uptime, environment, version, and a
  `services` flag object (database, redis, email, pdf).
- **Debug logging:** `LOG_LEVEL=debug npm run dev`.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `MongoServerSelectionError` | bad `MONGODB_URI`, DB down, IP not whitelisted, unencoded password | verify URI; encode `@`→`%40`, `#`→`%23` |
| Redis `MaxRetriesPerRequestError` | `REDIS_URL` wrong / unset / Redis down | `redis-cli ping`; set `REDIS_URL` |
| Queues idle in Docker | `REDIS_URL` not set in container → ioredis hits localhost | set `REDIS_URL=redis://redis:6379` |
| CORS error in browser | origin missing from allow-list | add domain to `allowedOrigins` in `server.js` |
| Email not sending | bad app password, 2FA off, wrong port/secure pair | use Gmail App Password; `465`+`true` or `587`+`false` |
| PDF generation fails | `REPORTS_DIR` missing / not writable | ensure `./reports` exists and is writable |
| `429 Too Many Requests` | rate limiter triggered | expected under load; tune limits in `server.js` |

More: [`PRODUCTION.md`](./PRODUCTION.md), [`EMAIL_QUEUE_SETUP.md`](./EMAIL_QUEUE_SETUP.md),
[`../DOCUMENTATION.md`](../DOCUMENTATION.md).
