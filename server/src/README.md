# server/src — new SOLID/TypeScript tree

This is the future home of the backend. The legacy code under `../routers`, `../controllers`, `../models`, `../middlewares`, `../services`, `../queues`, `../utils` is still live in production. Per the rebuild contract (see repo-root `CLAUDE.md`):

- All **new** features land here.
- Legacy code is **not** modified in place — it stays running until the new feature cuts over and is proven.
- Each cutover is independent and reviewable on its own.

## Layout

| Folder | Purpose |
|---|---|
| `app.ts` | Express app factory (no listen) — used by tests and the side-by-side runtime |
| `server.ts` | Listen + graceful shutdown — runs on `PORT + 1` until cutover |
| `config/` | Typed env, db, redis, mail, twilio config |
| `domain/` | Pure domain logic — no Express, no Mongoose imports |
| `domain/unit/state-machine.ts` | BloodUnit transitions; the invariant guard for the whole system |
| `domain/compatibility/` | Component-aware ABO/Rh engine + FEFO selector |
| `infra/db/models/` | Mongoose schemas only — no methods, no business hooks |
| `infra/db/repositories/` | Data access only — return plain DTOs, never Documents |
| `infra/queues/` | Bull processors |
| `infra/logger/` | pino child loggers |
| `http/middlewares/` | auth, rbac, error, request-id, http-logger, rate-limit |
| `http/validators/` | zod schemas — one per route |
| `http/controllers/` | HTTP only: parse → call service → format response |
| `http/routes/` | Router wiring; rbac applied here |
| `shared/` | enums, errors, Result type, helpers |
| `jobs/` | Cron/schedule registrations |

## Run

```bash
npm run dev:src       # tsx watch on PORT+1
npm run typecheck     # tsc --noEmit
npm test              # vitest run
npm run test:watch    # vitest in watch mode
npm run build         # tsc -p tsconfig.json
```

## The 5-step endpoint recipe

1. **Validator** in `http/validators/<feature>.ts`
2. **Repository** method in `infra/db/repositories/<feature>-repo.ts`
3. **Service** method in `domain/<feature>/<feature>-service.ts`
4. **Controller** in `http/controllers/<feature>-controller.ts`
5. **Route** in `http/routes/<feature>.ts` (with `requireRole` + `requirePermission`)

Then integration test in `test/integration/<feature>.test.ts`.

## Hard invariants

See `../CLAUDE.md`. The non-negotiable ones in code:

- `BloodUnit.status` writes go through `domain/unit/state-machine.transition`.
- TTI quarantine gate: a unit can only reach `RELEASED` once `TTIResult.releaseDecision === 'released'`.
- RBC issue requires `crossmatch.result === 'compatible'` (or MO override with audit reason).
- Patient special-needs flags filter unit selection at the service layer — see `domain/compatibility/fefo.ts`.
