# server/CLAUDE.md

Backend rules. Read `../CLAUDE.md` first.

## Two trees, one process

```
/server
  /server.js                 entry (legacy) — also mounts dist/routes at /api/v2
  /routers, /controllers,    legacy code — KEEP RUNNING, do not refactor in place
   /models, /middlewares,
   /services, /queues, /utils
  /config/env.js             zod env validator (BOTH trees use this)
  /utils/logger.js           pino logger (BOTH trees use this)
  /src                       new SOLID/TypeScript tree (MODULE-BASED) — all new work here
    /app.ts                  Express app factory (no listen)
    /server.ts               standalone bootstrap (PORT+1, side-by-side dev)
    /routes.ts               central registry — registerRoutes() mounts every module
    /core
      /config/env.ts         zod env (wraps legacy ../config/env.js)
      /logger                pino child loggers
      /db                    mongoose connect (to add)
    /modules/<feature>       EVERYTHING for one feature, colocated:
      <f>.model.ts           Mongoose schema only (no methods, no domain hooks)
      <f>.repository.ts      data access only; return plain DTOs
      <f>.service.ts         orchestration; no Express/Mongoose
      <f>.<rule>.ts          pure domain rule (donor.eligibility, issue.gate, ...)
      <f>.controller.ts      parse → call service → format response
      <f>.validator.ts       zod schemas, one per route
      <f>.routes.ts          router wiring; rbac applied here
      <f>.service.test.ts    colocated tests
    /shared
      /middlewares           authenticate, rbac, error, request-id, http-logger
      /compatibility         component-aware ABO/Rh engine + FEFO selector
      enums.ts, errors.ts, result.ts, role-map.ts
```

Modules present: donor, donation, unit, tti, inventory, deferral, patient, requisition, crossmatch, issue. The `unit` module owns `unit.state-machine.ts` — the invariant guard.

## How to add a new endpoint (the 5-step recipe, within a module folder)

1. **Validator** in `modules/<feature>/<feature>.validator.ts` — `z.object(...)` for body/params/query; export a `Validate` helper.
2. **Repository** in `modules/<feature>/<feature>.repository.ts` — only the Mongoose call(s) you need. Return a plain DTO, never a Mongoose Document.
3. **Service** in `modules/<feature>/<feature>.service.ts` — orchestrates: load aggregates, call domain rules, write via repo, enqueue jobs, emit audit. No Express, no Mongoose.
4. **Controller** in `modules/<feature>/<feature>.controller.ts` — `async (req, res, next)` — validate, call service, respond `{success,data}` or throw `AppError`.
5. **Route** in `modules/<feature>/<feature>.routes.ts` — `router.post('/x', authenticate, requireRole([...]), requirePermission('...'), controller.x)`, then register it in `src/routes.ts`.

Then add a colocated `<feature>.service.test.ts` (vitest).

## Hard invariants (must not break)

- No Mongoose call (`Model.find`, `aggregate`, `.save()`, `.lean()`, ...) in any controller. Only in repositories.
- No business logic in Mongoose `pre`/`post` hooks (timestamps and slug generation OK; status decisions not OK).
- Every route under `/api` has `requireRole(...)`. If multiple roles can call it, list them all. Public health checks are the only exception.
- Every request body and query string has a zod validator. Coercion happens in the validator, not in the service.
- Every `BloodUnit.status` write goes through `modules/unit/unit.state-machine.transition(currentStatus, event)`. Invalid transitions throw `InvalidUnitTransition`.
- Every clinical delete is soft (`deletedAt`, `deletedBy`) + writes an audit log entry.
- TTI quarantine: a unit can only reach `RELEASED` if `TTIResult.releaseDecision === 'released'`. Enforce in service, not UI.
- RBC issue requires a passing crossmatch (`crossmatch.result === 'compatible'`) or an MO override with a recorded reason.
- Patient special-needs flags filter unit selection at the service layer — UI cannot bypass them by changing a query param.

## Logging

- Use the exported `logger` from `utils/logger.js` (legacy) or `infra/logger` (new).
- `pino-http` middleware emits one structured line per request; do not add another request-log middleware.
- Child loggers per module: `const log = logger.child({ module: 'donor-service' })`.
- Never log a request body at INFO — bodies contain PHI/PII. Audit-log only.
- Sensitive paths are redacted globally (see `redactPaths` in `utils/logger.js`). Add to that list when introducing a new secret-shaped field.

## Errors

- Throw an `AppError` subclass (`ValidationError`, `NotFoundError`, `ForbiddenError`, `ConflictError`, `InvalidUnitTransition`, ...).
- The single `error-middleware` maps them to HTTP responses with shape `{ success: false, code, message, details, requestId }`.
- Never `res.status(...).json(...)` from a controller for an error case — throw instead.

## Bull jobs

- One queue per concern (`expiry`, `discard`, `email-otp`, `birthday`).
- Processors live in `infra/queues/<queue>-processor.ts`; enqueueing helpers in `domain/<feature>/`.
- Jobs are idempotent — re-running must not double-charge or double-send.

## Tests

- `vitest` + `supertest` + `mongodb-memory-server`.
- Unit tests for every pure domain module (state machine, compatibility engine, FEFO selector, deferral rules).
- Integration tests for each new endpoint that prove RBAC + validation + happy path + one error path.
- Coverage target for new code: 80%. Legacy code is exempt (it will be deleted as features cut over).
