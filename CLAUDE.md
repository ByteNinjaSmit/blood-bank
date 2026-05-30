# Blood Bank — CLAUDE.md (repo root)

Internal Blood Bank Management System (BBMS) for hospital staff at Sanjivani Blood Bank. **Not** a public donor portal — every workflow assumes a licensed bank operator is using the screen.

This file is loaded into Claude's context for any task in this repository. Read `server/CLAUDE.md` and `client/CLAUDE.md` for area-specific rules. Domain reference lives in `Blood Compatibility - Crossmatch Rules.md` and (during the redesign) in the memory file `domain-quick-ref.md`.

---

## What's where

```
/server                  Node 20 + Express 5 + Mongoose + Bull + Redis + Socket.io
/server/src              (new SOLID rewrite — see server/CLAUDE.md)
/client                  React 19 + Vite 7 + Tailwind v4 (internal staff app, Vercel)
/public-frontend         Next.js 16 marketing site — OUT OF SCOPE for the redesign
/docker-compose.yml      Prod stack (api ×2, redis, nginx)
/nginx.conf              Reverse proxy + websocket upgrade
/.github/workflows       CI/CD (build → Trivy → Docker Hub → SSH deploy)
/Blood Compatibility…md  ABO/Rh rules per component (authoritative)
/DOCUMENTATION.md        Legacy long-form docs
```

Branches: `main` (prod) ← PRs from feature branches (`smit-dev`, `AtharvaDev`, etc.).

## Run

| Concern | Command |
|---|---|
| Backend dev | `cd server && npm run dev` |
| Backend lint | `cd server && npm run lint` |
| Frontend dev | `cd client && npm run dev` |
| Frontend lint | `cd client && npm run lint` |
| Full stack (Docker) | `docker compose --env-file .env up -d` |
| Health check | `curl http://localhost:5000/health` |

## Hard rules — apply to every change

1. **No secrets in tracked files.** Real values live in a host `.env`, GitHub Secrets, or Vercel env. `*.env` is gitignored; only `*.env.example` is committed.
2. **No `Mongoose.find/aggregate/...` in controllers.** Data access goes through a repository.
3. **No `axios.*` in React components.** Use `features/<x>/api.js` and TanStack Query hooks.
4. **Every new route declares `requireRole(...)` and where appropriate `requirePermission(...)`.** Auth without authorisation is not "auth".
5. **Every request body has a zod validator.** Reject malformed input before it reaches the service.
6. **`BloodUnit.status` transitions only via `domain/unit/state-machine.transition`.** Invalid transitions throw.
7. **Soft-delete only for clinical records.** All deletes write an audit entry.
8. **TTI quarantine is non-bypassable.** A unit cannot reach `RELEASED` without a released TTI result.
9. **RBC issue requires a passing crossmatch.** Medical-officer override is allowed but must be logged.
10. **Special-needs flags on a patient are hard requirements.** Irradiated/CMV-neg/leukoreduced/washed/HbS-neg/phenotype-matched units must be filtered before display, not relied on the user.
11. **Times stored UTC, rendered in `Asia/Kolkata`** through a formatter — never `new Date()` in JSX.
12. **Naming standard:** files `kebab-case`, React components `PascalCase.jsx`, Mongoose models singular `PascalCase`, schema fields `camelCase`, enums `SCREAMING_SNAKE`, env vars `SCREAMING_SNAKE`, route paths `kebab-case`.
13. **Fix legacy spellings as you touch them:** `Registeration → Registration`, `sernology → serology`, `Seriology → Serology`.

## Side-by-side rebuild contract

We are mid-migration. The old code lives where it always did. The new SOLID/TypeScript implementation lives under `server/src/`. Rules:

- **Do not refactor old controllers in place.** If a feature is being rewritten, only add new code under `server/src/`.
- **Old endpoints stay mounted until the new replacement is proven** (tests pass + manual verification by user).
- **Migrations are online dual-write.** Write to both old + new collections for 1–2 weeks, verify counts, switch reads, then drop old. No big-bang cutovers.

## When unsure

- Domain question → `bbms-domain-research.md` (in memory) or `Blood Compatibility - Crossmatch Rules.md`.
- Layering / convention question → `server/CLAUDE.md` or `client/CLAUDE.md`.
- "Should I add a comment?" → almost certainly no. Code that names things well doesn't need narration. Comments only for hidden constraints or non-obvious workarounds.
