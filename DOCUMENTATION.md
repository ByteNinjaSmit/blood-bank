# Blood Bank Management System — Full Documentation

Complete reference for setup, connections, security, environments, and
licensing. For the feature/architecture overview see [`README.md`](./README.md).
This document covers **how to run, connect, secure, and deploy** the system.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Repository Layout](#2-repository-layout)
3. [Tech Stack](#3-tech-stack)
4. [Connection Architecture](#4-connection-architecture)
5. [Environment Variables Reference](#5-environment-variables-reference)
6. [Dev vs Production — What to Comment / What to Use](#6-dev-vs-production--what-to-comment--what-to-use)
7. [Connection Setup (MongoDB, Redis, Email, SMS)](#7-connection-setup)
8. [Development Setup](#8-development-setup)
9. [Production Setup](#9-production-setup)
10. [Security](#10-security)
11. [Health Checks & Monitoring](#11-health-checks--monitoring)
12. [Troubleshooting](#12-troubleshooting)
13. [License](#13-license)

---

## 1. System Overview

A full-stack Blood Bank Management System (monorepo):

- **client/** — React + Vite admin/staff single-page app.
- **server/** — Node.js + Express REST API, Socket.IO, Bull queues, jobs.
- **public-frontend/** — Next.js public marketing site.

Backing services: **MongoDB** (data), **Redis** (cache, rate limiting, queues,
Socket.IO adapter), **Nginx** (reverse proxy in production).

---

## 2. Repository Layout

```
blood-bank/
├── client/              React + Vite admin app
│   ├── .env             local (gitignored — see warning below)
│   ├── .env.example     template
│   ├── vite.config.js   path aliases (@, @/components, ...)
│   └── vercel.json      SPA rewrite (all routes -> /)
├── server/              Express REST API
│   ├── .env             local (gitignored — see warning below)
│   ├── .env.example     template
│   ├── server.js        app entrypoint (single process)
│   ├── start.js         cluster entrypoint (forks per CPU in production)
│   ├── Dockerfile       node:20-bookworm-slim, runs as non-root `node`
│   ├── config/          db.js, redis.js, mailConfig.js, twilio.js
│   ├── controllers/ routers/ models/ middlewares/
│   ├── queues/ jobs/ services/ lib/ utils/ validators/
│   ├── reports/         generated PDF reports
│   └── uploads/         uploaded files
├── public-frontend/     Next.js public site
├── docker-compose.yml   api + redis + nginx stack
├── nginx.conf           reverse proxy config
├── README.md            feature / architecture overview
└── DOCUMENTATION.md     this file
```

---

## 3. Tech Stack

| Layer        | Technology |
|--------------|------------|
| Client       | React 19, Vite 7, React Router 7, TanStack Query, Radix UI, Tailwind 4, Axios |
| Server       | Node.js 20, Express 5, Mongoose 8, Socket.IO 4, Bull 4, Winston/Pino |
| Database     | MongoDB (database name `BloodBank`) |
| Cache/Queue  | Redis 7 |
| Auth         | JWT (access + refresh), bcrypt, cookie-parser |
| Security     | helmet, cors, express-rate-limit, rate-limiter-flexible |
| Email/SMS    | nodemailer (Gmail SMTP), Twilio, AWS SNS |
| Proxy        | Nginx |
| Container    | Docker + Docker Compose |

---

## 4. Connection Architecture

```
                         ┌─────────────────────────┐
   Browser (admin)  ───►  │  Nginx  (prod, :8080→80) │
   Browser (public) ───►  │  reverse proxy + CORS    │
                         └────────────┬─────────────┘
                                      │ proxy_pass
                                      ▼
                         ┌─────────────────────────┐
                         │  Express API  (:5000)    │
                         │  /api/*  /health  /      │
                         │  Socket.IO  /socket.io/  │
                         └───┬──────────┬───────────┘
                             │          │
                  ┌──────────▼──┐   ┌───▼───────────┐
                  │  MongoDB     │   │  Redis        │
                  │  :27017      │   │  :6379        │
                  │  db BloodBank│   │  cache /      │
                  └──────────────┘   │  rate-limit / │
                                     │  Bull queues /│
                                     │  socket adapt.│
                                     └───────────────┘
```

**Connection points and where they are configured:**

| Connection | Initiated in | Config |
|------------|--------------|--------|
| Client → API | Axios, base URL `VITE_APP_URI_API` | `client/.env` |
| API → MongoDB | `config/db.js` (`connectToDatabase`) | `MONGODB_URI`, `maxPoolSize: 200` |
| API → Redis (rate limit / adapter) | `server.js` `new Redis(REDIS_URL)` | `REDIS_URL` |
| API → Redis (queues) | `config/redis.js` (`createQueue`) | `REDIS_URL` parsed to host/port |
| API → SMTP | `config/mailConfig.js` (nodemailer) | `EMAIL_*` |
| API → Twilio | `config/twilio.js` (lazy init) | `TWILIO_*` |
| Browser ↔ API realtime | Socket.IO server in `server.js` | `allowedOrigins` array |
| Nginx → API | `upstream api_cluster { server api:5000; }` | `nginx.conf` |

**Important wiring facts:**

- `config/db.js` forces `dbName: 'BloodBank'` — the path in `MONGODB_URI` is
  ignored for the database name.
- `server.js` defines a hard-coded `allowedOrigins` array for CORS **and**
  Socket.IO. `CORS_SERVER` in `.env` exists but the array is authoritative.
  Add new production domains to that array in `server.js`.
- Inside Docker, Redis is reached as `redis://redis:6379` (service name),
  **not** `localhost`. On a dev host it is `redis://localhost:6379`.
- `app.set("trust proxy", 1)` — required so rate limiting sees the real client
  IP behind Nginx.

---

## 5. Environment Variables Reference

Full templates: [`server/.env.example`](./server/.env.example) and
[`client/.env.example`](./client/.env.example).

### 5.1 Server (`server/.env`)

| Variable | Required | Purpose | Dev value | Prod value |
|----------|----------|---------|-----------|------------|
| `MONGODB_URI` | yes | MongoDB connection string | `mongodb://localhost:27017/` | authenticated remote string (`?authSource=admin`) |
| `REDIS_URL` | yes | Redis connection | `redis://localhost:6379` | `redis://redis:6379` (Docker service) |
| `PORT` | yes | API listen port | `5000` | `5000` |
| `NODE_ENV` | yes | Runtime mode | `development` | `production` |
| `CORS_SERVER` | — | Frontend origin (array in `server.js` is authoritative) | `http://localhost:5173` | prod domain |
| `JWT_SECRET` | yes | JWT signing secret | dev placeholder | strong random ≥32 chars |
| `JWT_SECRET_KEY` | yes | Second JWT secret | dev placeholder | strong random ≥32 chars |
| `ACCESS_TOKEN_EXPIRY` | yes | Access token TTL | `15m` | `15m` |
| `REFRESH_TOKEN_EXPIRY` | yes | Refresh token TTL | `7d` | `7d` |
| `EMAIL_USER` | for email | Gmail SMTP user | test inbox | prod sender |
| `EMAIL_PASS` | for email | Gmail **App Password** | app password | app password |
| `EMAIL_HOST` | for email | SMTP host | `smtp.gmail.com` | `smtp.gmail.com` |
| `EMAIL_PORT` | for email | SMTP port | `465` (or `587`) | `465` |
| `EMAIL_SECURE` | for email | SSL on/off | `true` for 465, `false` for 587 | `true` |
| `ADMIN_EMAIL` | for email | Report recipient | dev inbox | admin inbox |
| `REPORTS_DIR` | yes | PDF output dir | `./reports` | `./reports` |
| `NEAR_EXPIRY_DAYS` | yes | Near-expiry window (days) | `2` | `2` |
| `TIMEZONE` | yes | Cron / report timezone | `Asia/Kolkata` | `Asia/Kolkata` |
| `AWS_ACCESS_KEY_ID` | optional | AWS SNS | — | set if SMS used |
| `AWS_SECRET_ACCESS_KEY` | optional | AWS SNS | — | set if SMS used |
| `AWS_REGION` | optional | AWS region | `ap-south-1` | `ap-south-1` |
| `SNS_PHONE` | optional | SNS destination | — | set if SMS used |
| `TWILIO_ACCOUNT_SID` | optional | Twilio SMS/OTP | — | set if SMS used |
| `TWILIO_AUTH_TOKEN` | optional | Twilio auth token | — | set if SMS used |
| `TWILIO_PHONE_NUMBER` | optional | Twilio sender number | — | set if SMS used |
| `SYSTEM_USER_ID` | yes | Mongo ObjectId for system audit actor | valid ObjectId | valid ObjectId |

### 5.2 Client (`client/.env`)

| Variable | Required | Purpose | Dev value | Prod value |
|----------|----------|---------|-----------|------------|
| `VITE_APP_URI_API` | yes | Backend API base URL | `http://localhost:5000` | `https://<api-host>` |

Vite only exposes `VITE_`-prefixed vars to the browser. `.env` is read at
build time — restart the dev server or rebuild after changing it. Never put
secrets in a `VITE_` variable; they ship to the browser.

---

## 6. Dev vs Production — What to Comment / What to Use

The current `.env` files keep multiple options as commented lines. Activate the
correct line per environment and comment the others.

### 6.0 Current repo state — DEVELOPMENT

The repository is currently configured to **run in development** (not via
Docker). The active configuration is:

| File | Line | State | Meaning |
|------|------|-------|---------|
| `server/.env` | `REDIS_URL=redis://localhost:6379` | **active** (uncommented) | API connects to Redis on the local host |
| `docker-compose.yml` | `# MONGODB_URI: "..."` | **commented out** | Docker is not used for dev; the prod DB URI is disabled there |
| `docker-compose.yml` | `# REDIS_URL: "redis://redis:6379"` | **commented out** | Docker Redis service URL disabled — only the host `REDIS_URL` applies |

**How to run in this development state:**

```bash
# Redis must be running locally on :6379
cd server
npm start            # reads server/.env -> REDIS_URL=redis://localhost:6379
```

**Before switching back to production / Docker, revert these:**

1. `docker-compose.yml` — **uncomment** `MONGODB_URI` and `REDIS_URL`
   (`redis://redis:6379`).
2. `server/.env` — `REDIS_URL` may stay as the local value; inside Docker the
   `docker-compose.yml` `REDIS_URL` (`redis://redis:6379`) overrides it.

> If `docker-compose.yml` is run while `MONGODB_URI` / `REDIS_URL` are
> commented, the API container has no database or Redis URL and will fail.
> Those comments are correct **only** for local development without Docker.

### 6.1 `server/.env`

**MongoDB — exactly one line active:**

```env
# DEVELOPMENT — uncomment ONE local/dev option, comment the prod line
MONGODB_URI=mongodb://localhost:27017/
# MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/
# MONGODB_URI=mongodb://<user>:<encoded-pass>@<host>:27017/?authSource=admin   <-- PROD

# PRODUCTION — uncomment the remote line, comment the two dev lines
# MONGODB_URI=mongodb://localhost:27017/
# MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/
MONGODB_URI=mongodb://<user>:<encoded-pass>@<host>:27017/?authSource=admin
```

**Redis:**

```env
# DEVELOPMENT (running Redis on the host)
REDIS_URL=redis://localhost:6379

# PRODUCTION (Docker Compose — Redis service is named "redis")
REDIS_URL=redis://redis:6379
```

**Other per-environment values:**

| Variable | Comment in DEV | Use in DEV | Use in PROD |
|----------|----------------|------------|-------------|
| `NODE_ENV` | — | `development` | `production` |
| `MONGODB_URI` | comment remote/Atlas | local URI | remote authenticated URI |
| `REDIS_URL` | comment `redis://redis:6379` | `redis://localhost:6379` | `redis://redis:6379` |
| `CORS_SERVER` | comment prod domain | `http://localhost:5173` | prod domain |
| `JWT_SECRET`, `JWT_SECRET_KEY` | — | dev placeholders OK | strong random, unique |
| `EMAIL_USER` / `ADMIN_EMAIL` | — | test inboxes | real prod inboxes |

> **Cleanup note:** the current `server/.env` has `CORS_SERVER` defined twice
> and a trailing `# Commented out...` comment on the `REDIS_URL` line. Keep one
> `CORS_SERVER` line and remove inline comments after values — some `.env`
> parsers treat everything after `=` (including `# ...`) as the value.

### 6.2 `client/.env`

```env
# DEVELOPMENT
VITE_APP_URI_API=http://localhost:5000
# VITE_APP_URI_API=https://system.sanjivanibloodbank.org   <-- comment in dev

# PRODUCTION
# VITE_APP_URI_API=http://localhost:5000                   <-- comment in prod
VITE_APP_URI_API=https://system.sanjivanibloodbank.org
```

### 6.3 `docker-compose.yml`

Production runs from `docker-compose.yml`. These values are environment
sensitive. **Currently `MONGODB_URI` and `REDIS_URL` are both commented out**
because the repo is in development mode (see §6.0):

| Line | Current state (DEV) | Prod |
|------|---------------------|------|
| `MONGODB_URI` | commented out | **uncomment** with prod URI, or inject via secret |
| `REDIS_URL` | commented out | **uncomment** `REDIS_URL: "redis://redis:6379"` so the API reaches the Redis container |
| `CORS_SERVER` | `http://localhost:5173` | prod domain |
| `NODE_ENV` | `production` (set) | `production` |

> With `MONGODB_URI` and `REDIS_URL` commented, the API container has no
> database or Redis URL — ioredis falls back to `127.0.0.1:6379` inside the
> container and the DB connection has no URI, so the stack fails. This state is
> intentional for local development without Docker. **Uncomment both lines
> before running the production Docker stack.**

### 6.4 Code that differs by environment

| Item | Development | Production |
|------|-------------|------------|
| Server entrypoint | `node server.js` (single process) | `node start.js` (cluster, forks per CPU) |
| Expiry cron (`queues/expiry-queue.js`) | frequent test schedule (`*/2 * * * *`) | daily `0 8 * * *` — see `EMAIL_QUEUE_SETUP.md` |
| Logging | console, colored, verbose | file logs, level `info`/`warn` |
| `npm start` (`package.json`) | `nodemon server.js` (auto-reload) | use Docker image / `node start.js` |
| Source maps / debug logs | keep | disable / `LOG_LEVEL` not `debug` |

> Before deploying, verify the expiry queue cron in `queues/expiry-queue.js` is
> the daily production schedule, not a test interval.

---

## 7. Connection Setup

### 7.1 MongoDB

- **Dev (local):** install MongoDB, start `mongod`, use
  `mongodb://localhost:27017/`.
- **Dev (Atlas):** create a free cluster, whitelist your IP, use the
  `mongodb+srv://...` string.
- **Prod (remote):** authenticated instance. URL-encode special characters in
  the password: `@`→`%40`, `#`→`%23`, `:`→`%3A`. Append `?authSource=admin`
  when the auth user lives in the `admin` database.
- Connection pool, timeouts, and the forced `BloodBank` db name are set in
  `config/db.js` (`maxPoolSize: 200`, `serverSelectionTimeoutMS: 5000`,
  `socketTimeoutMS: 10000`).

### 7.2 Redis

- **Dev:** `redis-server` locally, or `docker run -d --name redis -p 6379:6379
  redis:7-alpine`. Verify: `redis-cli ping` → `PONG`.
- **Prod:** the `redis` service in `docker-compose.yml` (persistent volume,
  `maxmemory 192mb`, `allkeys-lru`). API reaches it as `redis://redis:6379`.
- Used for: rate limiting, DDoS limiter, Bull queues (expiry, discard,
  email-OTP, birthday), Socket.IO Redis adapter.

### 7.3 Email (Gmail SMTP)

1. Enable 2-Factor Authentication on the Gmail account.
2. Google Account → Security → App passwords → generate one for "Mail".
3. Put it in `EMAIL_PASS` (never the account password).
4. Port `465` + `EMAIL_SECURE=true` (SSL) — current production setting.
   Alternatively `587` + `EMAIL_SECURE=false` (STARTTLS).
5. `config/mailConfig.js` verifies the transporter on boot and logs the result.
   If `EMAIL_USER`/`EMAIL_PASS` are unset, verification is skipped (no crash).

### 7.4 SMS (Twilio / AWS SNS) — optional

- Twilio: set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.
  `config/twilio.js` initializes lazily; if any var is missing it logs a
  warning and disables SMS — the server still boots.
- AWS SNS: set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`,
  `SNS_PHONE`.

---

## 8. Development Setup

### Prerequisites

- Node.js 20 LTS
- MongoDB (local or Atlas)
- Redis (local or Docker)
- Git

### 8.1 Backend — `server/`

```bash
cd server
npm install
cp .env.example .env          # then edit .env with dev values
npm start                     # nodemon server.js — auto-reload
```

Dev `.env` essentials:

```env
MONGODB_URI=mongodb://localhost:27017/
REDIS_URL=redis://localhost:6379
PORT=5000
NODE_ENV=development
CORS_SERVER=http://localhost:5173
JWT_SECRET=dev-secret
JWT_SECRET_KEY=dev-secret-2
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
REPORTS_DIR=./reports
NEAR_EXPIRY_DAYS=2
TIMEZONE=Asia/Kolkata
SYSTEM_USER_ID=<valid-mongo-objectid>
```

API: `http://localhost:5000` · Health: `http://localhost:5000/health`

### 8.2 Client — `client/`

```bash
cd client
npm install
cp .env.example .env          # VITE_APP_URI_API=http://localhost:5000
npm run dev                   # Vite dev server
```

App: `http://localhost:5173`

### 8.3 Public Frontend — `public-frontend/`

```bash
cd public-frontend
npm install
npm run dev                   # http://localhost:3000
```

### 8.4 Redis quick start for dev

```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
redis-cli ping        # -> PONG
```

---

## 9. Production Setup

Production runs the API + Redis + Nginx via `docker-compose.yml`.

### 9.1 Prepare

1. Provision the host (Docker + Docker Compose installed).
2. Create production `server/.env` from `.env.example` with **production
   values and freshly rotated secrets** (see [Security](#10-security)).
3. In `docker-compose.yml`:
   - **Uncomment** `REDIS_URL: "redis://redis:6379"`.
   - Set `MONGODB_URI` to the production database (env block or a secret).
   - Set `CORS_SERVER` to the production domain.
   - Confirm `NODE_ENV: "production"`.
4. In `client/.env` set `VITE_APP_URI_API` to the production API URL, then
   build: `cd client && npm run build` (output in `client/dist/`).
5. Confirm prod domains are in the `allowedOrigins` array in `server.js`.
6. Confirm the expiry cron in `queues/expiry-queue.js` is the daily schedule.

### 9.2 Deploy with Docker Compose

```bash
docker-compose up -d           # start api + redis + nginx
docker-compose ps              # check status
docker-compose logs -f api     # follow API logs
```

Stack from `docker-compose.yml`:

| Service | Image | Ports | Notes |
|---------|-------|-------|-------|
| `api`   | `byteninjasmit/blood-bank-api:latest` | internal `5000` | `mem_limit 2g`, healthcheck `/health` |
| `redis` | `redis:7-alpine` | internal `6379` | persistent volume, LRU eviction |
| `nginx` | `nginx:latest` | host `8080` → `80` | reverse proxy, `nginx.conf` |

The API container runs as non-root user `node` (see `Dockerfile`) with
`NODE_ENV=production` and `--max-old-space-size=2048`.

### 9.3 Nginx (`nginx.conf`)

- `upstream api_cluster { server api:5000; }` — load-balances API replicas via
  Docker DNS.
- `/health` proxied, access log off.
- `/socket.io/` — WebSocket upgrade, long timeouts (`3600s`), buffering off.
- `/` — REST proxy; OPTIONS preflight answered directly with CORS headers for
  `https://system.sanjivanibloodbank.org`.
- `client_max_body_size 20M` — upload limit.

> When the production domain changes, update the CORS origin in the `OPTIONS`
> block of `nginx.conf` **and** the `allowedOrigins` array in `server.js`.

### 9.4 Build / publish the API image

```bash
cd server
docker build -t byteninjasmit/blood-bank-api:latest .
docker push byteninjasmit/blood-bank-api:latest
```

On the host: `docker-compose pull && docker-compose up -d` (the api service
has `pull_policy: always`).

### 9.5 Cluster mode (without Docker)

`start.js` forks one worker per CPU when `NODE_ENV=production` and restarts
dead workers. Run `node start.js` instead of `node server.js` for bare-metal
production.

### 9.6 Client hosting

`client/vercel.json` rewrites all routes to `/` (SPA fallback) — suitable for
Vercel or any static host. Serve the built `client/dist/` behind HTTPS.

### 9.7 Production checklist

- [ ] All secrets rotated and unique (not the committed dev values)
- [ ] `server/.env` filled with production values, not in git
- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI` → production DB; password URL-encoded
- [ ] `REDIS_URL` uncommented in `docker-compose.yml` → `redis://redis:6379`
- [ ] `CORS_SERVER` + `allowedOrigins` (server.js) + `nginx.conf` OPTIONS block
      all set to the production domain
- [ ] `VITE_APP_URI_API` points to the production API; client rebuilt
- [ ] Expiry cron is the daily schedule, not a test interval
- [ ] Health checks passing (`/health`)
- [ ] HTTPS/TLS terminated in front of Nginx
- [ ] MongoDB auth + TLS enabled
- [ ] Logs writing to `server/logs/`; rotation configured
- [ ] Backups scheduled (MongoDB dump, Redis volume)

---

## 10. Security

### 10.1 ⚠️ Committed secrets — fix before production

`server/.env` and `client/.env` are **tracked in git** even though `.gitignore`
lists `.env`. Live credentials are exposed in repository history:

- MongoDB username/password and host
- `AWS_SECRET_ACCESS_KEY`
- `TWILIO_AUTH_TOKEN`
- Gmail `EMAIL_PASS`
- `JWT_SECRET`, `JWT_SECRET_KEY`

**Required actions:**

1. **Rotate every exposed credential** — MongoDB password, AWS key, Twilio
   token, Gmail app password, and generate new JWT secrets. Anyone who has
   cloned the repo already holds the old values; rotation is the only fix.
2. Stop tracking the files:
   ```bash
   git rm --cached server/.env client/.env
   git commit -m "stop tracking .env files"
   ```
3. The `.env.example` templates (committed) replace them as the shared
   reference.
4. To purge secrets from existing history, rewrite it with `git filter-repo`
   (or BFG) and force-push — coordinate with everyone who has a clone.

### 10.2 Built-in protections (already in code)

- **helmet** — HTTP security headers (`server.js`).
- **CORS** — origin allow-list in `server.js`; credentials enabled.
- **Rate limiting** — global `rate-limiter-flexible` (100 req / 30s per IP,
  15s block) backed by Redis; stricter `express-rate-limit` (10 req / 30s) for
  sensitive endpoints.
- **trust proxy** — `app.set("trust proxy", 1)` so limits use the real client
  IP behind Nginx.
- **JWT auth** — short-lived access token (`15m`) + refresh token (`7d`).
- **bcrypt** — password hashing.
- **Input validation** — Zod validators in `server/validators/`.
- **Non-root container** — Docker image runs as user `node`.

### 10.3 Hardening recommendations

- Generate JWT/session secrets with `openssl rand -base64 48`; never reuse dev
  values in production.
- Enforce HTTPS/TLS in front of Nginx; the current `nginx.conf` listens on
  plain `:80` and sets `X-Forwarded-Proto http` — terminate TLS at a load
  balancer or add a TLS server block.
- Enable MongoDB authentication and TLS; restrict network access to the DB
  host (currently a public IP `212.85.24.35`).
- Inject secrets via Docker secrets or an env vault, not inline in
  `docker-compose.yml`.
- Keep dependencies patched: `npm audit` on `client/` and `server/`.

---

## 11. Health Checks & Monitoring

- **Endpoint:** `GET /health` — returns status, uptime, environment, version,
  and a `services` object (database, redis, email, pdf).
- **Docker healthchecks:** defined for `api` (`curl /health`), `redis`
  (`redis-cli ping`), and `nginx` (`curl /health`).
- **Logs:** `server/logs/` — `app.log`, `error.log`, `info.log`. Docker
  json-file driver caps logs at `10m × 3` files.
- **Queues:** Bull queue events (`error`, `failed`, `completed`) logged via the
  shared logger (`config/redis.js`).

---

## 12. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `MongoServerSelectionError` | Wrong `MONGODB_URI`, DB down, IP not whitelisted, unencoded password | Verify URI; encode `@`/`#`; check `mongod`/Atlas allow-list |
| Redis `MaxRetriesPerRequestError` | `REDIS_URL` wrong, Redis down, or unset in container | `redis-cli ping`; uncomment `REDIS_URL` in compose |
| Queues never run inside Docker | `REDIS_URL` commented in `docker-compose.yml` → ioredis hits `localhost` | Set `REDIS_URL=redis://redis:6379` |
| CORS error in browser | Origin not in `allowedOrigins` | Add domain to the array in `server.js` (and `nginx.conf` OPTIONS) |
| Email not sending | Bad app password, 2FA off, wrong port/secure pair | Use Gmail App Password; `465+true` or `587+false` |
| PDF generation fails | `REPORTS_DIR` missing/not writable | Ensure `./reports` exists and is writable |
| 429 Too Many Requests | Rate limiter triggered | Expected under load; raise limits in `server.js` if needed |
| SMS disabled | Missing Twilio/SNS vars | Set `TWILIO_*` / `AWS_*` (optional — server still boots) |

Debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

---

## 13. License

**Proprietary — All Rights Reserved.**

See the [`LICENSE`](./LICENSE) file at the repository root. The Software is
proprietary and confidential; it may not be used, copied, modified, or
distributed without prior written permission from the copyright holder.

Package metadata is aligned with this:

| Package | `private` | `license` |
|---------|-----------|-----------|
| `server/package.json` | `true` | `UNLICENSED` |
| `client/package.json` | `true` | `UNLICENSED` |
| `public-frontend/package.json` | `true` | `UNLICENSED` |

> The copyright holder in `LICENSE` is **Twistark Technologies**, year
> **2026**. Update the year on each new release as needed.

---

*Keep this document updated when environment variables, connection setup,
deployment steps, or the security posture change.*
