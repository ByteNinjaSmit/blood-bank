---
name: add-endpoint
description: Scaffold a new backend endpoint in server/src following the 5-step recipe (validator → repository → service → controller → route with RBAC). Use when adding any new HTTP route to the new SOLID tree.
---

# /add-endpoint

Use this when adding a new HTTP endpoint to the backend's `server/src/` tree.

## Inputs you need

- **Feature** (e.g., `donor`, `unit`, `requisition`).
- **HTTP method + path** (e.g., `POST /api/donor`).
- **Role(s)** allowed to call it (from `server/src/shared/enums.ts` `ROLE` array).
- **Permission(s)** required (from `PERMISSION` array). If not yet present, add to the array first.
- **Input shape** (body / params / query).
- **Output shape**.
- **Side effects** (DB writes, queue enqueues, audit log writes).

## Steps

All files for a feature live in one folder: `server/src/modules/<feature>/`.

1. **Validator** — `server/src/modules/<feature>/<feature>.validator.ts`. Export zod schemas and a `Validate` helper (`createBody`, `idParam`, ...).
2. **Repository** — `server/src/modules/<feature>/<feature>.repository.ts`. Add only the data-access method this endpoint needs. Return a plain DTO, never a Mongoose Document.
3. **Service** — `server/src/modules/<feature>/<feature>.service.ts`. Orchestrate: load aggregates, call domain rules (state machine, compatibility engine, etc.), write via repo, enqueue jobs, write audit log. No Express imports, no Mongoose imports.
4. **Controller** — `server/src/modules/<feature>/<feature>.controller.ts`. `async (req, res, next)` — validate, call service, `res.json({ success: true, data })` or throw `AppError`.
5. **Route** — `server/src/modules/<feature>/<feature>.routes.ts`. `router.<method>('/path', authenticate, requireRole([...]), requirePermission('...'), controller.method)`. Register it in `server/src/routes.ts` (`MODULE_ROUTES`).

## Then

- Add a colocated test `server/src/modules/<feature>/<feature>.service.test.ts` covering: happy path + at least one error/guard path. (RBAC + validation are exercised by integration tests once the supertest harness lands.)
- Run `cd server && npm run typecheck && npm run lint && npm test`.
- If this endpoint replaces a legacy one, leave the legacy route mounted until verification. Do **not** delete the old controller yet.

## Hard checks before saying "done"

- [ ] `requireRole` is present on the route definition.
- [ ] `requirePermission` is present if the action is finer than the role suggests.
- [ ] Validator exists; controller calls it.
- [ ] No `Model.<anything>` or `mongoose` import in the controller.
- [ ] No `axios.*` outside infra (this is a backend rule but applies equally if you touch the client).
- [ ] If the endpoint changes `BloodUnit.status`, it goes through `modules/unit/unit.state-machine.transition`.
- [ ] If the endpoint touches a clinical record, an audit log entry is written.
