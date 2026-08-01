# Security & Secrets Setup

All secrets are out of the repo. Real values live in three places only:

1. **GitHub Repository Secrets** — consumed by `.github/workflows/deploy.yml`.
2. **Host `.env`** at `/root/blood-bank/.env` on the prod server — consumed by `docker-compose.yml` (`${VAR}` substitution). The deploy workflow regenerates this file from the GitHub Secrets on each deploy.
3. **Vercel project Environment Variables** — for `client/` and `public-frontend/`.

`*.env` is gitignored; `server/.env` and `client/.env` were untracked from git. Only `*.env.example` is committed.

---

## ⚠️ Rotate these — they were committed and are compromised

The following were exposed in git history / docker-compose / the deploy workflow. **Rotation is the only safe remedy** (the values are public-readable in history).

| Secret | Action | Where it lived |
|---|---|---|
| `JWT_SECRET`, `JWT_SECRET_KEY` | Regenerated below — paste new values | docker-compose, deploy.yml |
| `EMAIL_PASS` (Gmail app password) | Revoke + create a new Gmail App Password | docker-compose, deploy.yml |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Deactivate the IAM key, create a new one, audit CloudTrail | server/.env |
| `TWILIO_AUTH_TOKEN` | Rotate in Twilio console, audit message logs | docker-compose, deploy.yml |
| `MONGODB_URI` (db password) | Reset the Mongo user password, update URI | server/.env, public-frontend/.env, deploy.yml |

Freshly generated JWT secrets (already in dev `server/.env`):

```
JWT_SECRET=xFviy5fU9B12a2RgSJ/zALNgvgfvgCQXvvwYZrpH/Evlz6hZnw/7D6zPybWDmOfn
JWT_SECRET_KEY=SEJs/rkaVjod67az63wvN6h3MMC8inlua6QJTLTWZRE4RQ6kaqLEJ/B8BIqWFZFK
```

Generate new ones any time with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

---

## GitHub Repository Secrets (Settings → Secrets and variables → Actions)

CI/CD (`deploy.yml`) reads these:

```
DOCKERHUB_USERNAME      DOCKERHUB_TOKEN
SSH_HOST  SSH_USER  SSH_PRIVATE_KEY  SSH_PORT
MONGODB_URI
JWT_SECRET  JWT_SECRET_KEY
ACCESS_TOKEN_EXPIRY  REFRESH_TOKEN_EXPIRY
CORS_SERVER
EMAIL_USER  EMAIL_PASS  EMAIL_HOST  EMAIL_PORT  EMAIL_SECURE  ADMIN_EMAIL
NEAR_EXPIRY_DAYS  REPORTS_DIR  TIMEZONE  LOG_LEVEL
AWS_ACCESS_KEY_ID  AWS_SECRET_ACCESS_KEY  AWS_REGION  SNS_PHONE
TWILIO_ACCOUNT_SID  TWILIO_AUTH_TOKEN  TWILIO_PHONE_NUMBER
SYSTEM_USER_ID
```

The deploy job writes them into the host `.env` (chmod 600) before `docker compose up`.

---

## Host `.env` (prod server, `/root/blood-bank/.env`)

Mirror of `server/.env.example` with real values. Never commit. The deploy
workflow recreates it; for a manual bring-up, copy the template:

```bash
cp server/.env.example /root/blood-bank/.env
# fill real values, then:
docker compose --env-file /root/blood-bank/.env up -d
```

`docker-compose.yml` requires (`${VAR:?...}`): `MONGODB_URI`, `CORS_SERVER`,
`JWT_SECRET`, `JWT_SECRET_KEY`, `EMAIL_USER`, `EMAIL_PASS`, `ADMIN_EMAIL`,
`SYSTEM_USER_ID`. It refuses to start if any are missing.

---

## Vercel (client + public-frontend)

| Project | Var |
|---|---|
| `client` | `VITE_APP_URI_API` = `https://api.sanjivanibloodbank.org` |
| `public-frontend` | `NEXT_PUBLIC_API_BASE_URL` = `https://api.sanjivanibloodbank.org` |

**Never** put `MONGODB_URI` (or any DB credential) in a Vercel/Vite/Next public
var — it ships in the browser bundle. The public site talks to the API only.

---

## App-level hardening already in place

- Zod env validation at boot (`server/src/core/config/env.ts` + `server/config/env.js`) — process refuses to start on missing/weak secrets (JWT < 32 chars rejected).
- Refresh tokens: httpOnly cookie, `secure` in prod, `sameSite` lax(dev)/none(prod), rotation + reuse-detection (family revoke).
- Access signed with `JWT_SECRET_KEY`, refresh with `JWT_SECRET` (distinct secrets).
- Redis-backed rate limiting: global + stricter on `/api/v2/auth`.
- Helmet, CORS allowlist, gzip, pino with secret redaction (`Authorization`, `*.password`, `*.token`, `MONGODB_URI`, etc.).
- Trivy blocks deploy on HIGH/CRITICAL image vulns.
