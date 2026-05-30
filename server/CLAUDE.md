# server/CLAUDE.md

Backend rules. Read `../CLAUDE.md` first.

## Two trees, one process

```
/server
  /server.js                 entry (legacy)
  /routers, /controllers,    legacy code — KEEP RUNNING, do not refactor in place
   /models, /middlewares,
   /services, /queues, /utils
  /config/env.js             zod env validator (BOTH trees use this)
  /utils/logger.js           pino logger (BOTH trees use this)
  /src                       new SOLID/TypeScript tree — all new work goes here
    /app.ts                  builds the Express app (no listen)
    /server.ts               listen + graceful shutdown
    /config                  env, db, redis, mail, twilio
    /domain
      /<feature>             pure domain logic, no Express/Mongoose imports
      /unit/state-machine.ts BloodUnit transitions (invariant guard)
      /compatibility         component-aware ABO/Rh engine + FEFO selector
    /infra
      /db/models             Mongoose schemas only (no methods, no domain hooks)
      /db/repositories       data access only; return plain DTOs
      /queues                Bull processors
      /email, /sms, /storage
      /logger                pino child loggers
    /http
      /middlewares           auth, rbac, error, request-id, rate-limit
      /validators            zod schemas, one per route
      /controllers           parse → call service → format response
      /routes                router wiring; rbac applied here
    /jobs                    cron/schedule registrations
    /shared                  errors, result types, enums, helpers
  /test
    /unit, /integration, /fixtures
```

## How to add a new endpoint (the 5-step recipe)

1. **Validator** in `src/http/validators/<feature>.ts` — `z.object(...)` for body, params, query. Export a `validate(req)` helper.
2. **Repository** method in `src/infra/db/repositories/<feature>-repo.ts` — only the Mongoose call(s) you need. Return a plain DTO, never a Mongoose Document.
3. **Service** method in `src/domain/<feature>/<feature>-service.ts` — orchestrates: load aggregates, call domain rules, write via repo, enqueue jobs, emit audit. No Express, no Mongoose.
4. **Controller** in `src/http/controllers/<feature>-controller.ts` — `async function (req, res, next)` — validate, call service, format response with `Result.ok` or throw `AppError`.
5. **Route** in `src/http/routes/<feature>.ts` — `router.post('/x', requireRole(['lab-tech-serology']), requirePermission('tti:edit'), controller.x)`.

Then add an integration test under `test/integration/<feature>.test.ts`.

## Hard invariants (must not break)

- No Mongoose call (`Model.find`, `aggregate`, `.save()`, `.lean()`, ...) in any controller. Only in repositories.
- No business logic in Mongoose `pre`/`post` hooks (timestamps and slug generation OK; status decisions not OK).
- Every route under `/api` has `requireRole(...)`. If multiple roles can call it, list them all. Public health checks are the only exception.
- Every request body and query string has a zod validator. Coercion happens in the validator, not in the service.
- Every `BloodUnit.status` write goes through `domain/unit/state-machine.transition(currentStatus, event)`. Invalid transitions throw `InvalidUnitTransition`.
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
