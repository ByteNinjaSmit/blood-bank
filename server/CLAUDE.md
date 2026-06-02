# server/CLAUDE.md

Backend rules. Read `../CLAUDE.md` first.

## Single tree

```
/server
  /src                       TypeScript SOLID tree — only backend code
    /app.ts                  Express app factory (no listen)
    /server.ts               canonical entry — listens on env.PORT
    /routes.ts               central registry — registerRoutes() mounts every module
    /core
      /config/env.ts         zod env (reads process.env directly)
      /logger                pino instance + childLogger helper
      /db                    mongoose connect/disconnect
      /cache                 cached() / invalidate() over Redis
      /redis                 ioredis client (shared for Bull + pub/sub)
      /search                atlasTextSearch + atlasVectorSearch (fallback: regex)
      /queue                 Bull queue setup + register-processors
      /security              global + auth rate limiters
      /mail                  nodemailer transporter
    /modules/<feature>       EVERYTHING for one feature, colocated:
      <f>.model.ts           Mongoose schema + indexes (no domain hooks)
      <f>.repository.ts      data access only; return plain DTOs
      <f>.service.ts         orchestration; no Express/Mongoose
      <f>.<rule>.ts          pure domain rule
      <f>.controller.ts      parse → call service → respond {success,data}
      <f>.validator.ts       zod schemas
      <f>.routes.ts          router wiring; requireRole + requirePermission here
      <f>.service.test.ts    colocated vitest tests
    /shared
      /middlewares           authenticate, rbac, error, request-id, http-logger
      /compatibility         ABO/Rh engine + FEFO selector
      /email                 layout + templates
      enums.ts, errors.ts, result.ts, role-map.ts
```

Modules: auth, donor, donation, unit, tti, inventory, deferral, patient, requisition,
crossmatch, issue, transfusion, adverse-reaction, lookback, audit, user, hospital, camp.

## Dev

```bash
npm run dev          # tsx watch src/server.ts
npm run build        # tsc + tsc-alias → dist/
npm run typecheck    # tsc --noEmit
npm test             # vitest run
```

## Add a new endpoint (5-step recipe)

1. **Validator** `modules/<f>/<f>.validator.ts` — `z.object(...)` for body/params/query.
2. **Repository** `modules/<f>/<f>.repository.ts` — Mongoose call, return plain DTO.
3. **Service** `modules/<f>/<f>.service.ts` — orchestrate; no Express, no Mongoose.
4. **Controller** `modules/<f>/<f>.controller.ts` — validate → service → `{success,data}`.
5. **Route** `modules/<f>/<f>.routes.ts` — `requireRole([...])` + `requirePermission('...')`, then add to `src/routes.ts`.

## Hard invariants

- No Mongoose call in any controller. Only in repositories.
- No business logic in Mongoose `pre`/`post` hooks (timestamps/slug OK).
- Every route has `requireRole(...)`. Public health check is the only exception.
- Every body/query has a zod validator.
- Every `BloodUnit.status` write goes through `modules/unit/unit.state-machine.transition`.
- Clinical deletes are soft (`deletedAt`, `deletedBy`) + audit log entry.
- TTI quarantine: unit can only reach `RELEASED` if `TTIResult.releaseDecision === 'released'`.
- RBC issue requires passing crossmatch or MO override with logged reason.
- Patient special-needs flags filter units at the service layer.

## Logging

- `childLogger({ module: 'x-service' })` from `@/core/logger`.
- Never log request body at INFO — PHI/PII. Audit-log only.

## Errors

- Throw `AppError` subclasses (`ValidationError`, `NotFoundError`, `ForbiddenError`, ...).
- `errorMiddleware` maps to `{ success: false, code, message, details, requestId }`.
- Never `res.status(...).json(...)` from a controller for errors — throw instead.
