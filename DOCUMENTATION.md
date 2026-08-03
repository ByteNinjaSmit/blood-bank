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

A full-stack Blood Bank Management System (monorepo) for internal hospital staff at Sanjivani Blood Bank, built to NBTC/CDSCO/NABH guidelines.

- **client/** — React + Vite admin/staff single-page app (Vercel).
- **server/** — Node.js + Express REST API, Socket.IO, Bull queues, TypeScript SOLID rewrite.
- **public-frontend/** — Next.js public marketing site (out of scope for redesign).

Backing services: **MongoDB** (data), **Redis** (cache, rate limiting, queues, Socket.IO adapter), **Nginx** (reverse proxy in production).

### Complete operational lifecycle

```
PROCUREMENT (Blood Bag Procurement & Stock Management)
────────────────────────────────────────────────────
Vendor Registration
        ↓
Purchase Order (DRAFT → PENDING_APPROVAL → APPROVED)
        ↓
Goods Receipt Note — Invoice + Batch registration
        ↓
Quality Inspection (7 physical checks per batch)
        ↓
Bag Stock Acceptance → Empty Bag Inventory

COLLECTION
────────────────────────────────────────────────────
Bag Issue for Collection (bag serial assigned)
        ↓
Donor Registration & Screening (eligibility + vitals)
        ↓
Donation Created → Blood Unit(s) at COLLECTED status

LABORATORY
────────────────────────────────────────────────────
TTI Testing (HIV / HBsAg / HCV / Syphilis / Malaria)
        ↓
   ┌────┴────┐
RELEASED   QUARANTINE/DISCARDED
   ↓
Component Separation (PRBC / FFP / Platelets / Cryo)
        ↓
Blood Unit in Inventory (FEFO, special-needs filtered)

TRANSFUSION
────────────────────────────────────────────────────
Hospital Requisition → Crossmatch → Issue
        ↓
Transfusion Record → Outcome
        ↓
Adverse Reaction (if any) → Lookback (if TTI reactive)

TRACEABILITY
────────────────────────────────────────────────────
Vendor → PO → GRN Batch → Bag Serial → Donor
        → Donation → Blood Unit → Blood Component
        → Crossmatch → Patient Transfusion
```

### API modules (`/api/v2/`)

| Module | Route | Key operations |
|---|---|---|
| auth | `/auth` | Login, refresh, OTP, registration |
| vendor | `/vendor` | Vendor CRUD, approval workflow, contract tracking |
| purchase-order | `/purchase-order` | PO lifecycle, GST line-item totals, state machine |
| goods-receipt | `/goods-receipt` | GRN + invoice, batch lines, financial fields, stock upsert |
| bag-stock | `/bag-stock` | Stock register, closingStock virtual, summary by type |
| bag-inspection | `/bag-inspection` | QC per batch, 7 checks, ACCEPTED/REJECTED/QUARANTINE |
| bag-issue | `/bag-issue` | Issue to collection, ISSUED→USED/RETURNED/DAMAGED |
| bag-discard | `/bag-discard` | Discard register, 9 reasons, BMW manifest |
| donor | `/donor` | Registration, eligibility, deferral, lookup |
| donation | `/donation` | Collection event, source=inhouse\|camp, timeline detail |
| unit | `/unit` | Blood unit state machine (11 statuses), FEFO, special needs |
| tti | `/tti` | TTI results, quarantine gate, release decision |
| inventory | `/inventory` | Stock view, reserve, near-expiry alerts |
| deferral | `/deferral` | Temporary/permanent deferral records |
| requisition | `/requisition` | Hospital request, FIFO matching, approval |
| transfusion | `/transfusion` | Transfusion record + outcome |
| adverse-reaction | `/adverse-reaction` | Reaction categories + severity grades |
| camp | `/camp` | Donation camp registration + donor/donation management |
| lookback | `/lookback` | TTI-reactive lookback, recall notifications |
| audit | `/audit` | Immutable audit trail (all modules) |
| user | `/user` | Staff user management (14 roles) |
| hospital | `/hospital` | Hospital / consignee registry |

---

## 2. Repository Layout

```
blood-bank/
├── client/                   React 19 + Vite 7 admin/staff SPA (Vercel)
│   ├── src/
│   │   ├── core/             api-client.js, auth-token-store.js, query-client.js
│   │   ├── features/
│   │   │   ├── bag-procurement/  Vendor, PO, GRN, BagStock, BagInspection,
│   │   │   │                     BagIssuance, BagDiscard (api.js + queries.js + 7 pages)
│   │   │   ├── donation/     DonationManagement (central view: Inhouse/Camp tabs + timeline)
│   │   │   ├── camp/         Camp listing, details, donation & donor management
│   │   │   ├── donor/        DonorManagement
│   │   │   ├── inventory/    ReserveWizard, NearExpiry
│   │   │   ├── component/    ComponentSeparate, NearExpiry
│   │   │   ├── serology/     TTI (Serology page)
│   │   │   ├── requisition/  RequisitionManagement
│   │   │   ├── mis/          7 MIS report pages
│   │   │   ├── auth/         Login, Registration
│   │   │   └── hospital/     AddHospital
│   │   ├── components/       Shared UI (PageHeader, Button, Modal, Table, ...)
│   │   ├── store/            AuthContext
│   │   └── lib/              Utilities (cn, formatters)
│   ├── .env / .env.example
│   ├── vite.config.js        path alias @ → src
│   └── vercel.json           SPA rewrite (all routes → /)
│
├── server/                   Node 20 + Express 5 TypeScript SOLID backend
│   ├── src/
│   │   ├── server.ts         canonical entry (listens on PORT)
│   │   ├── app.ts            Express app factory
│   │   ├── routes.ts         central router registry (/api/v2/*)
│   │   ├── core/             env, logger, db, cache, redis, queue, security, mail, search
│   │   ├── modules/
│   │   │   ├── vendor/           vendor.{model,repo,validator,service,controller,routes}.ts
│   │   │   ├── purchase-order/   purchase-order.*.ts
│   │   │   ├── goods-receipt/    goods-receipt.*.ts
│   │   │   ├── bag-stock/        bag-stock.*.ts
│   │   │   ├── bag-inspection/   bag-inspection.*.ts
│   │   │   ├── bag-issue/        bag-issue.*.ts
│   │   │   ├── bag-discard/      bag-discard.*.ts
│   │   │   ├── auth/             auth.*.ts
│   │   │   ├── donor/            donor.*.ts + donor.eligibility.ts
│   │   │   ├── donation/         donation.*.ts + donation.unit-derivation.ts
│   │   │   ├── unit/             unit.*.ts + unit.state-machine.ts
│   │   │   ├── tti/              tti.*.ts
│   │   │   ├── inventory/        inventory.*.ts
│   │   │   ├── deferral/         deferral.*.ts
│   │   │   ├── requisition/      requisition.*.ts
│   │   │   ├── transfusion/      transfusion.*.ts
│   │   │   ├── adverse-reaction/ adverse-reaction.*.ts
│   │   │   ├── camp/             camp.*.ts + camp-donation.model.ts
│   │   │   ├── lookback/         lookback.*.ts
│   │   │   ├── audit/            audit.*.ts
│   │   │   ├── user/             user.*.ts
│   │   │   └── hospital/         hospital.*.ts
│   │   └── shared/
│   │       ├── enums.ts          All enums (BAG_TYPE, UNIT_STATUS, PERMISSION, ROLE, ...)
│   │       ├── role-map.ts       Role → Permission mapping (14 roles)
│   │       ├── errors.ts         AppError subclasses
│   │       ├── result.ts         Result<T, E> type
│   │       └── middlewares/      authenticate, rbac, error, request-id, http-logger
│   ├── .env / .env.example
│   ├── Dockerfile                node:20-bookworm-slim, non-root `node`
│   └── tsconfig.json
│
├── public-frontend/          Next.js 16 public marketing site (out of scope)
├── docker-compose.yml        api + redis + nginx production stack
├── nginx.conf                reverse proxy + WebSocket upgrade
├── .github/workflows/        CI/CD: build → Trivy scan → Docker Hub → SSH deploy
├── Blood Compatibility…md    ABO/Rh compatibility rules (authoritative domain ref)
├── CLAUDE.md                 AI coding instructions (this project)
└── DOCUMENTATION.md          Infrastructure, env vars, deployment (this file)
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
| API → MongoDB | `src/core/db` (`connectToDatabase`) | `MONGODB_URI`, `maxPoolSize: 200` |
| API → Redis (rate limit / adapter) | `src/core/redis` (`getRedis`) | `REDIS_URL` |
| API → Redis (queues) | `src/core/queue` (Bull) | `REDIS_URL` |
| API → SMTP | `src/core/mail` (nodemailer) | `EMAIL_*` |
| API → S3 / MinIO | `src/modules/upload` (`@aws-sdk/client-s3`) | `S3_*` |
| Browser ↔ API realtime | Socket.IO server in `src/server.ts` | `corsOptions` |
| Nginx → API | `upstream api_cluster { server api:5000; }` | `nginx.conf` |

**Important wiring facts:**

- `src/core/db` forces `dbName: 'BloodBank'` — the path in `MONGODB_URI` is
  ignored for the database name.
- CORS is configured in `src/core/config/cors.ts`. The allow-list is the
  `STATIC_ORIGINS` array **merged with** the comma-separated `CORS_SERVER`
  env var, so a new production domain can be added via env alone.
- Inside Docker, Redis is reached as `redis://redis:6379` (service name),
  **not** `localhost`. On a dev host it is `redis://localhost:6379`.
  `REDIS_URL` is required — `src/core/config/env.ts` refuses to boot without
  it; there is no localhost fallback.
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
| `CORS_SERVER` | — | Extra allowed origins, comma-separated; merged with `STATIC_ORIGINS` in `src/core/config/cors.ts` | `http://localhost:5173` | prod domain |
| `JWT_SECRET` | yes | JWT signing secret | dev placeholder | strong random ≥32 chars |
| `JWT_SECRET_KEY` | yes | Second JWT secret | dev placeholder | strong random ≥32 chars |
| `ACCESS_TOKEN_EXPIRY` | yes | Access token TTL | `15m` | `15m` |
| `REFRESH_TOKEN_EXPIRY` | yes | Refresh token TTL | `7d` | `7d` |
| `EMAIL_USER` | for email | Gmail SMTP user | test inbox | prod sender |
| `EMAIL_PASS` | for email | Gmail **App Password** | app password | app password |
| `EMAIL_FROM_NAME` | for email | Display name on outgoing mail | `Sanjivani Blood Bank` | `Sanjivani Blood Bank` |
| `EMAIL_HOST` | for email | SMTP host | `smtp.gmail.com` | `smtp.gmail.com` |
| `EMAIL_PORT` | for email | SMTP port | `465` (or `587`) | `465` |
| `EMAIL_SECURE` | for email | SSL on/off | `true` for 465, `false` for 587 | `true` |
| `ADMIN_EMAIL` | for email | Report recipient | dev inbox | admin inbox |
| `BANK_NAME` | yes | Bank name on PDFs / email footers | real name | real name |
| `BANK_ADDRESS` | yes | Bank address on PDFs | real address | real address |
| `BANK_PHONE` | yes | Bank phone on PDFs | real phone | real phone |
| `BANK_LICENSE` | yes | Blood bank / drug licence no. printed on reports | real licence | real licence |
| `BANK_WEBSITE` | — | Website on PDFs | `https://sanjivanibloodbank.org` | same |
| `S3_ENDPOINT` | for uploads | S3-compatible endpoint (MinIO) | MinIO URL | MinIO URL |
| `S3_REGION` | for uploads | Bucket region | `us-east-1` | `us-east-1` |
| `S3_ACCESS_KEY` | for uploads | Object store access key | dev key | prod key |
| `S3_SECRET_KEY` | for uploads | Object store secret key | dev secret | prod secret |
| `S3_BUCKET` | for uploads | Bucket name | `blood-bank` | `blood-bank` |
| `S3_PUBLIC_URL` | for uploads | Public base URL for stored objects | MinIO public URL | MinIO public URL |
| `REPORTS_DIR` | yes | PDF output dir | `./reports` | `./reports` |
| `NEAR_EXPIRY_DAYS` | yes | Near-expiry window (days) | `2` | `2` |
| `SYSTEM_USER_ID` | yes | Mongo ObjectId for system audit actor | valid ObjectId | valid ObjectId |

`BANK_*` and `S3_*` have permissive defaults in `src/core/config/env.ts`, so a
missing value does **not** stop the server booting — it silently produces PDFs
with placeholder licence details, or uploads that fail at request time.
`docker-compose.yml` marks them `:?required` for exactly that reason.

**Removed — do not re-add without wiring a consumer first:**
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `SNS_PHONE`,
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` (no SMS
provider is wired), and `TIMEZONE` (the client formats in `Asia/Kolkata` via
`client/src/lib/format-date.js`; the server stores UTC).

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

### 6.0 How configuration is supplied

`docker-compose.yml` hard-codes **no** values. Every setting is a variable
reference, and the required ones use the `${VAR:?message}` form so Compose
aborts with a named error rather than starting a half-configured container.

Values reach Compose from one of:

- a `.env` file sitting next to `docker-compose.yml` on the host (this is what
  the CI/CD deploy job writes — see §9.2),
- the calling shell's environment, or
- `docker compose --env-file /path/to/secrets.env up -d`.

`server/.env` is for **local development only** — it is read by `dotenv` when
running `npm run dev` outside Docker, and is never baked into the image
(`server/.dockerignore` excludes it).

```bash
# Local dev: Redis must be running on :6379
cd server
npm run dev          # tsx watch src/server.ts, reads server/.env
```

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

Variables split into two groups.

**Required — Compose aborts if unset** (`${VAR:?...}`):

`MONGODB_URI`, `CORS_SERVER`, `JWT_SECRET`, `JWT_SECRET_KEY`, `EMAIL_USER`,
`EMAIL_PASS`, `ADMIN_EMAIL`, `BANK_NAME`, `BANK_ADDRESS`, `BANK_PHONE`,
`BANK_LICENSE`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`,
`S3_PUBLIC_URL`, `SYSTEM_USER_ID`.

**Defaulted — safe to omit** (`${VAR:-default}`):

`NODE_ENV` (`production`), `PORT` (`5000`), `LOG_LEVEL` (`info`), `REDIS_URL`
(`redis://redis:6379`), `ACCESS_TOKEN_EXPIRY` (`15m`), `REFRESH_TOKEN_EXPIRY`
(`7d`), `EMAIL_FROM_NAME`, `EMAIL_HOST`, `EMAIL_PORT` (`465`), `EMAIL_SECURE`
(`true`), `BANK_WEBSITE`, `S3_REGION` (`us-east-1`), `S3_BUCKET`
(`blood-bank`), `NEAR_EXPIRY_DAYS` (`2`), `REPORTS_DIR` (`./reports`).

> `REDIS_URL` defaults to the Compose service name `redis://redis:6379`. Never
> point it at `localhost` inside a container — that resolves to the container
> itself, not the Redis service.

### 6.4 Code that differs by environment

| Item | Development | Production |
|------|-------------|------------|
| Entrypoint | `npm run dev` → `tsx watch src/server.ts` | `node dist/server.js` (the image's `CMD`) |
| Horizontal scaling | single process | `docker compose up -d --scale api=2`, load-balanced by Nginx via Docker DNS |
| Logging | `pino-pretty`, colored, `LOG_LEVEL=debug` | raw JSON to stdout, `LOG_LEVEL=info`, captured by the Docker json-file driver |
| Rate limiting | on (`buildApp({ rateLimit: false })` disables it in tests only) | on |
| Cookies | `secure: false`, `sameSite: lax` | `secure: true`, `sameSite: none` (see `src/modules/auth/auth.cookies.ts`) |

> There is no `server.js` and no `start.js`. The legacy CommonJS monolith was
> deleted; `src/server.ts` compiled to `dist/server.js` is the only entrypoint.
> Process-level redundancy comes from running two `api` containers, not from
> Node's `cluster` module.

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
  `src/core/db` (`maxPoolSize: 200`, `serverSelectionTimeoutMS: 5000`,
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
5. `src/core/mail` verifies the transporter on boot and logs the result.
   If `EMAIL_USER`/`EMAIL_PASS` are unset, verification is skipped (no crash).

### 7.4 File storage (S3 / MinIO)

`src/modules/upload` talks to any S3-compatible object store through
`@aws-sdk/client-s3`. Production uses a self-hosted MinIO instance.

- `S3_ENDPOINT` — full base URL of the store. Leave empty only when using real
  AWS S3, in which case `S3_REGION` selects the endpoint.
- `S3_ACCESS_KEY` / `S3_SECRET_KEY` — credentials.
- `S3_BUCKET` — bucket name; must already exist.
- `S3_PUBLIC_URL` — public base URL prepended to stored object keys to build
  the URL handed back to the client. Usually `<S3_ENDPOINT>/<S3_BUCKET>`.

These have blank defaults, so an unset value produces a runtime upload failure
rather than a boot failure. `docker-compose.yml` marks them required.

> **SMS is not wired.** No Twilio or AWS SNS provider exists in the codebase.
> The corresponding env vars were removed; do not add them back without an
> actual consumer.

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
npm ci                        # use ci, not install — respects the lockfile
cp .env.example .env          # then edit .env with dev values
npm run dev                   # tsx watch src/server.ts — auto-reload
```

Other useful scripts: `npm run typecheck`, `npm run lint`, `npm test`,
`npm run build` (→ `dist/`). These four are exactly what CI runs, so a green
local run means a green `verify` job.

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
2. Put a `.env` next to `docker-compose.yml` on the host containing **production
   values and freshly rotated secrets** (see [Security](#10-security)). The
   CI/CD deploy job rewrites this file from GitHub Secrets on every deploy, so
   editing it by hand is only for out-of-band runs.
3. Confirm every required variable from §6.3 is present. Compose fails fast
   with a named error if one is missing.
4. Set `CORS_SERVER` to the production domain (it is merged into the CORS
   allow-list, no code change needed).
5. In the Vercel project for `client/`, set `VITE_APP_URI_API` to the
   production API URL and redeploy. The client is **not** built or deployed by
   this pipeline.

### 9.2 Deploy with Docker Compose

```bash
docker compose up -d --scale api=2   # start 2 api replicas + redis + nginx
docker compose ps                    # check status
docker compose logs -f api           # follow API logs
```

In normal operation this is driven by the `deploy` job in
`.github/workflows/deploy.yml`, which on every push to `main`:

1. writes `/root/blood-bank/.env` (mode `600`) from GitHub Secrets,
2. `git pull origin main` for the latest `docker-compose.yml` / `nginx.conf`,
3. pulls the new image,
4. runs a **throwaway api+redis pair on an isolated network** and polls
   `/health` up to 10 times — if it never answers, the deploy aborts and the
   running stack is left untouched,
5. only then `docker compose down && pull && up -d --scale api=2`.

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
> block of `nginx.conf` **and** set `CORS_SERVER` (or add the domain to
> `STATIC_ORIGINS` in `src/core/config/cors.ts`).

### 9.4 Build / publish the API image

CI does this automatically on push to `main` (`build-test-push` job: build →
Trivy scan, failing on any fixable HIGH/CRITICAL → push `:latest` and
`:<sha>`). Manual equivalent:

```bash
cd server
docker build -t byteninjasmit/blood-bank-api:latest .
docker push byteninjasmit/blood-bank-api:latest
```

On the host: `docker compose pull && docker compose up -d` (the api service
has `pull_policy: always`).

The image entrypoint is `CMD ["node", "dist/server.js"]`. The build stage runs
`npm run build` (tsc + tsc-alias); the runtime stage installs with
`npm ci --omit=dev` and runs as the non-root `node` user.

### 9.5 Scaling

Redundancy comes from replicas, not from Node's `cluster` module:
`docker compose up -d --scale api=2`. Nginx load-balances them through Docker
DNS (`upstream api_cluster { server api:5000; }`), and Redis-backed rate
limiting plus the Socket.IO Redis adapter keep state consistent across
replicas.

### 9.6 Client hosting — separate pipeline

**The CI/CD workflow in this repo builds and deploys the API only.** The React
client is a separate Vercel project that builds from the same repo on its own
triggers; `client/vercel.json` rewrites all routes to `/` for SPA fallback.

Consequences worth knowing:

- A client-only change does not go through `deploy.yml` at all. Its lint/build
  gate is Vercel's.
- `VITE_APP_URI_API` is baked in at **build** time, so changing the API URL
  requires a Vercel redeploy, not just an env edit.
- `public-frontend/` (Next.js marketing site) is likewise deployed separately
  and is not covered by this pipeline.
- The QR-code unit-verification page (`public-frontend/src/app/verify/[unitId]`)
  needs two env vars set, one per project, both baked/read at their own
  build or request time — see below.

**Env vars added for the QR verification feature:**

| Var | Where | Value | Why |
|---|---|---|---|
| `BACKEND_URL` | `public-frontend/` Vercel project | production API URL, e.g. `https://system.sanjivanibloodbank.org` (same value as `VITE_APP_URI_API`) | server-side `fetch` from the `/verify/[unitId]` page to `GET /api/v2/verify/:unitId` |
| `VITE_PUBLIC_FRONTEND_URL` | `client/` Vercel project | production public-frontend URL, e.g. `https://www.sanjivanibloodbank.org` | baked into the QR-code payload printed on inventory stock and requisition issue labels — must point at the live public-frontend so scanned codes resolve |

Neither var touches `docker-compose.yml`/`nginx.conf` — `/api/v2/verify/:unitId`
is served by the existing `api` container through the same reverse proxy, no
new route needed there. Set both Vercel vars and redeploy both projects;
until `VITE_PUBLIC_FRONTEND_URL` is set in `client/`'s Vercel project, newly
printed QR codes will encode a broken/relative URL.

### 9.7 Production checklist

- [ ] All secrets rotated and unique (not the values in git history)
- [ ] Host `.env` filled with production values, mode `600`, not in git
- [ ] Every GitHub Secret consumed by `deploy.yml` exists and is non-empty
- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI` → production DB; password URL-encoded
- [ ] `REDIS_URL=redis://redis:6379` (never `localhost` inside a container)
- [ ] `BANK_*` set to the real licence details — they print on reports
- [ ] `S3_*` set and the bucket exists; test one upload after deploy
- [ ] `CORS_SERVER` + `nginx.conf` OPTIONS block set to the production domain
- [ ] `VITE_APP_URI_API` points to the production API; client redeployed on Vercel
- [ ] `VITE_PUBLIC_FRONTEND_URL` (client) and `BACKEND_URL` (public-frontend) set on their
      respective Vercel projects and both redeployed — QR-verification links depend on both
- [ ] Health checks passing (`/health`, `/health/queues`)
- [ ] HTTPS/TLS terminated in front of Nginx
- [ ] MongoDB auth + TLS enabled
- [ ] Logs writing to `server/logs/`; rotation configured
- [ ] Backups scheduled (MongoDB dump, Redis volume)

---

## 10. Security

### 10.1 ⚠️ Secrets in git history — rotation still outstanding

`server/.env` and `client/.env` are **no longer tracked** — that was fixed in
commit `038df44`, and `.gitignore` now covers them. The current working tree
and every tracked file are clean; a scan for connection strings, AWS keys and
private keys across tracked source returns nothing but placeholders in
`.env.example`.

**The history is not clean.** `server/.env` was committed from `72093fe`
onwards and `client/.env` from `d36ea34`, so live values remain readable in
roughly a dozen reachable commits via `git show <sha>:server/.env`:

- MongoDB username, password and host
- `JWT_SECRET`, `JWT_SECRET_KEY`
- Gmail `EMAIL_PASS` (app password)

Untracking a file does not remove it from history. Anyone who has ever cloned
this repository still holds those values.

**Required actions:**

1. **Rotate every exposed credential** — MongoDB password, both JWT secrets,
   and the Gmail app password. Rotation is the only real fix; do this first.
   Generate new JWT secrets with `openssl rand -base64 48`.
2. Rotating `JWT_SECRET` / `JWT_SECRET_KEY` invalidates all live sessions —
   every user is logged out and must sign in again. Schedule it accordingly.
3. Optionally purge the blobs from history with `git filter-repo` (or BFG) and
   force-push. This rewrites every commit hash, so coordinate with everyone
   holding a clone. Rotation matters more than purging — do not let the purge
   plan delay step 1.
4. Audit the MinIO credentials in the current `server/.env` as well: if they
   reuse a password pattern shared with the leaked Mongo credential, rotate
   them too.

### 10.2 Built-in protections (already in code)

- **helmet** — HTTP security headers (`src/app.ts`).
- **CORS** — origin allow-list in `src/core/config/cors.ts`; no wildcard;
  credentials enabled so the httpOnly refresh cookie flows.
- **Rate limiting** — Redis-backed `rate-limiter-flexible`, so limits hold
  across all `api` replicas: global 100 req / 30s per IP (15s block), and
  10 req / 60s (60s block) on `/api/v2/auth`.
- **trust proxy** — `app.set("trust proxy", 1)` so limits use the real client
  IP behind Nginx.
- **JWT auth** — short-lived access token (`15m`, signed with
  `JWT_SECRET_KEY`) + refresh token (`7d`, signed with `JWT_SECRET`) —
  separate secrets, so leaking one does not forge the other.
- **Cookies** — `httpOnly` always; `secure` + `sameSite: none` in production.
- **RBAC** — every route under `src/modules/` declares `requirePermission(...)`
  (`auth.routes.ts` is the only exception). Note that `role` is a free-text
  display label with **no** authorization weight — the per-user permission
  grid in `src/shared/role-map.ts` is the sole source of truth.
- **Log redaction** — `src/core/logger` censors auth headers, cookies, and
  password/token/OTP bodies, plus `JWT_SECRET`, `JWT_SECRET_KEY`,
  `EMAIL_PASS`, `S3_SECRET_KEY`.
- **bcrypt** — password hashing.
- **Input validation** — Zod validators colocated as
  `src/modules/<f>/<f>.validator.ts`.
- **Non-root container** — Docker image runs as user `node`.

### 10.3 Hardening recommendations

- Generate JWT/session secrets with `openssl rand -base64 48`; never reuse dev
  values in production.
- Enforce HTTPS/TLS in front of Nginx; the current `nginx.conf` listens on
  plain `:80` and sets `X-Forwarded-Proto http` — terminate TLS at a load
  balancer or add a TLS server block.
- Enable MongoDB authentication and TLS; restrict network access to the DB
  host, which is reachable on a public IP.
- Keep dependencies patched: `npm audit --omit=dev` on `client/` and
  `server/`. The `build-test-push` job runs Trivy with `exit-code: 1` on
  fixable HIGH/CRITICAL, so an unpatched dependency blocks the deploy rather
  than shipping.
- `client/` depends on `xlsx`, which has open prototype-pollution and ReDoS
  advisories and **no upstream fix**. `exceljs` is already a server dependency
  and is the intended replacement.

---

## 11. Health Checks & Monitoring

- **`GET /health`** — status, uptime, and service name. Used by the Docker
  healthcheck, by Nginx, and by the CI/CD pre-flight gate.
- **`GET /health/queues`** — per-queue counts. Returns `200` when every queue
  has zero failed and zero dead-lettered jobs, `207` (degraded) otherwise.
  Worth wiring to an alert.
- **Docker healthchecks:** defined for `api` (`curl /health`), `redis`
  (`redis-cli ping`), and `nginx` (`curl /health`).
- **Logs:** pino to stdout. In production the Docker json-file driver captures
  them, capped at `10m × 3` files per container.

---

## 12. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `MongoServerSelectionError` | Wrong `MONGODB_URI`, DB down, IP not whitelisted, unencoded password | Verify URI; encode `@`/`#`; check `mongod`/Atlas allow-list |
| Redis `MaxRetriesPerRequestError` | `REDIS_URL` wrong, Redis down, or unset in container | `redis-cli ping`; inside Docker it must be `redis://redis:6379` |
| Queues never run inside Docker | `REDIS_URL` points at `localhost`, which is the container itself | Set `REDIS_URL=redis://redis:6379` |
| `Invalid environment variables: ...` on boot | A required var failed the zod schema in `src/core/config/env.ts` | The message names the offending keys; set them |
| Compose exits with `X is required` | A `${VAR:?}` variable is missing from the host `.env` | See §6.3 for the required list |
| CORS error in browser | Origin not allow-listed | Add it to `CORS_SERVER` (comma-separated) and to the `nginx.conf` OPTIONS block |
| Email not sending | Bad app password, 2FA off, wrong port/secure pair | Use Gmail App Password; `465+true` or `587+false` |
| Uploads fail, server otherwise healthy | `S3_*` unset or bucket missing | Blank S3 vars fail at request time, not boot — check §7.4 |
| PDF has placeholder licence details | `BANK_*` unset, falling back to defaults | Set all `BANK_*` vars |
| PDF generation fails | `REPORTS_DIR` missing/not writable | Ensure `./reports` exists and is writable |
| 429 Too Many Requests | Rate limiter triggered | Expected under load; tune in `src/core/security/rate-limit.ts` |
| `npm ci` fails with `Missing: <pkg> from lock file` | `package.json` edited without refreshing the lockfile | Run `npm install` in that workspace and commit the lockfile — CI and the Docker build both use `npm ci` and will fail otherwise |

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
