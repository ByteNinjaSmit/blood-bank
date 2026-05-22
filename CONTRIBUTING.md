# Contributing

Guidelines for working on the Blood Bank Management System monorepo.

---

## Before You Start

- Read [`README.md`](./README.md) (architecture) and
  [`DOCUMENTATION.md`](./DOCUMENTATION.md) (setup, environments, security).
- Set up all three packages: [`server/`](./server/README.md),
  [`client/`](./client/README.md), [`public-frontend/`](./public-frontend/README.md).
- Use **Node.js 20 LTS**.

## Repository Layout

```
client/           React + Vite admin app
server/           Express REST API
public-frontend/  Next.js public site
```

## Environment & Secrets

- Each package has a `.env.example` template. Copy it to `.env` and fill in
  **your own** values:
  ```bash
  cp server/.env.example server/.env
  cp client/.env.example client/.env
  ```
- **Never commit `.env` files.** They are listed in `.gitignore`. If git is
  already tracking one, stop it:
  ```bash
  git rm --cached server/.env client/.env
  ```
- **Never commit real secrets** — API keys, DB passwords, tokens, JWT secrets.
  If a secret is committed, it must be rotated; removing it from a later commit
  does not un-leak it.
- When you add a new environment variable, also add it to the relevant
  `.env.example` with a placeholder and a `[DEV]` / `[PROD]` note, and document
  it in [`DOCUMENTATION.md`](./DOCUMENTATION.md) §5.

## Branching & Commits

- Branch off `main`; never commit directly to `main`.
- Use clear, descriptive branch names (e.g. `feature/donor-export`,
  `fix/expiry-cron`).
- Write focused commits with meaningful messages. Conventional Commits
  encouraged: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
- Open a pull request into `main`; describe what changed and why.

## Coding Standards

- **Follow existing patterns** in controllers, routers, models, and React
  pages. Match surrounding style, naming, and structure.
- **Error handling** — return structured error responses; log internal errors
  via the shared logger (`server/utils/logger.js`). Do not swallow errors.
- **Validation** — validate all inputs (Zod schemas in `server/validators/`
  and on the client).
- **Security** — respect authentication / authorization middleware
  (`auth-middleware`, `role-middleware`, `admin-middleware`). Do not bypass
  rate limiting or CORS.
- **Linting** — run `npm run lint` in `client/` and `public-frontend/` before
  committing.

## Environment-Sensitive Code

Some behavior differs between development and production. When touching these,
keep both paths correct and document the difference:

- **Server entrypoint** — `server.js` (single process) vs `start.js` (cluster).
- **Expiry cron** (`server/queues/expiry-queue.js`) — frequent test schedule in
  dev; daily `0 8 * * *` in production. Do not commit a test schedule as the
  default for production.
- **CORS origins** — the `allowedOrigins` array in `server/server.js`. Add new
  production domains here (and in `nginx.conf`).
- **`NODE_ENV`** — `development` vs `production`.

See [`DOCUMENTATION.md`](./DOCUMENTATION.md) §6 for the full dev-vs-prod matrix.

## Testing Changes

There is no automated test suite yet. Before opening a PR, manually exercise
the flows your change touches:

- Core lifecycle: donation → lab/serology → component separation → inventory →
  request → issue / discard.
- Expiry reporting (trigger via `POST /api/test/expiry/report/trigger`).
- Auth / OTP login.
- Verify the server boots and `GET /health` returns healthy.

## Documentation

Update docs when behavior changes:

- New or changed API endpoint → `server/README.md`.
- New env variable → `.env.example` + `DOCUMENTATION.md` §5.
- New queue / job → `server/README.md` + `EMAIL_QUEUE_SETUP.md` if relevant.
- New module or flow → `README.md`.
- Deployment / connection changes → `DOCUMENTATION.md`.

## Pull Request Checklist

- [ ] Branched off `main`
- [ ] No `.env` or secrets committed
- [ ] New env vars added to `.env.example` and documented
- [ ] `npm run lint` passes (client / public-frontend)
- [ ] Server boots; `/health` healthy
- [ ] Affected flows manually tested
- [ ] Relevant docs updated
- [ ] Production cron / `NODE_ENV` / CORS not left in a dev-only state
