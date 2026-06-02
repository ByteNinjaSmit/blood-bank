# server/src — new SOLID/TypeScript tree (module-based)

Future home of the backend. Legacy code under `../routers`, `../controllers`, `../models`, etc. is still live in production. Per the rebuild contract (see repo-root `CLAUDE.md`):

- All **new** features land here.
- Legacy code is **not** modified in place — it stays running until each feature cuts over and is proven.
- Each cutover is independent and reviewable on its own.

## Structure (module-based / NestJS-style)

```
src/
├── core/                  Infrastructure
│   ├── config/env.ts      zod-validated env (shared with legacy via ../config/env.js)
│   ├── logger/            pino base + child loggers
│   └── db/                (mongoose connect — to be added)
├── modules/               One folder per feature; everything colocated
│   ├── donor/
│   │   ├── donor.model.ts          (donor still uses legacy model via repo)
│   │   ├── donor.repository.ts     data access only; returns DTOs
│   │   ├── donor.service.ts        business logic
│   │   ├── donor.eligibility.ts    pure domain rule
│   │   ├── donor.controller.ts     HTTP only
│   │   ├── donor.validator.ts      zod schemas
│   │   ├── donor.routes.ts         router + RBAC
│   │   └── *.test.ts               colocated tests
│   ├── donation/   (donation.unit-derivation.ts pure rule)
│   ├── unit/       (unit.state-machine.ts — the invariant guard)
│   ├── tti/        (tti.release-rules.ts pure rule)
│   ├── inventory/
│   ├── deferral/
│   ├── patient/
│   ├── requisition/
│   ├── crossmatch/
│   └── issue/      (issue.gate.ts pure rule)
├── shared/                Cross-module
│   ├── middlewares/        authenticate, rbac, error, request-id, http-logger
│   ├── compatibility/      abo-rh engine + fefo selector (used by inventory + requisition)
│   ├── enums.ts
│   ├── errors.ts           AppError taxonomy
│   ├── result.ts
│   └── role-map.ts         legacy 6-role → new 14-role projection
├── app.ts                 Express app factory (no listen)
├── server.ts              standalone bootstrap (PORT+1, side-by-side dev)
└── routes.ts              central registry — registerRoutes() mounts every module router
```

Import alias `@/*` → `src/*`. Examples: `@/modules/donor/donor.service`, `@/shared/errors`, `@/core/logger`.

Production: legacy `server.js` does `require('./dist/routes').registerRoutes()` and mounts it at `/api/v2` — same port, same nginx, same CORS.

## Run

```bash
npm run dev:src       # tsx watch on PORT+1
npm run typecheck     # tsc --noEmit
npm test              # vitest run
npm run build         # tsc + tsc-alias → dist/
```

## The 5-step endpoint recipe (within a module)

1. **Validator** — `<feature>.validator.ts`
2. **Repository** — `<feature>.repository.ts` (data access only)
3. **Service** — `<feature>.service.ts` (orchestration; no Express/Mongoose)
4. **Controller** — `<feature>.controller.ts` (HTTP only)
5. **Routes** — `<feature>.routes.ts` (`requireRole` + `requirePermission`), then register in `routes.ts`

Then colocate an integration/unit test `<feature>.service.test.ts`.

## Hard invariants

See `../CLAUDE.md`. In code:

- `BloodUnit.status` writes go through `modules/unit/unit.state-machine.transition`.
- TTI quarantine gate: unit reaches `RELEASED` only once `tti.releaseDecision === 'released'` (`modules/tti`).
- RBC issue requires `crossmatch.result === 'COMPATIBLE'` or MO override with reason (`modules/issue/issue.gate`).
- Patient special-needs filter unit selection at the service layer (`shared/compatibility/fefo`).
