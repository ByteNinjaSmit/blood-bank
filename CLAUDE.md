# Blood Bank — CLAUDE.md (repo root)

Internal Blood Bank Management System (BBMS) for hospital staff at Sanjivani Blood Bank. **Not** a public donor portal — every workflow assumes a licensed bank operator is using the screen.

This file is loaded into Claude's context for every task. Read `server/CLAUDE.md` and `client/CLAUDE.md` for area-specific rules. Domain reference lives in `Blood Compatibility - Crossmatch Rules.md` and (during the redesign) in the memory file `domain-quick-ref.md`.

---

## What's where

```
/server                  Node 20 + Express 5 + Mongoose + Bull + Redis + Socket.io
/server/src              TypeScript SOLID rewrite (canonical backend)
/client                  React 19 + Vite 7 + Tailwind v4 (internal staff app, Vercel)
/public-frontend         Next.js 16 marketing site — OUT OF SCOPE for the redesign
/docker-compose.yml      Prod stack (api ×2, redis, nginx)
/nginx.conf              Reverse proxy + websocket upgrade
/.github/workflows       CI/CD (build → Trivy → Docker Hub → SSH deploy)
/Blood Compatibility…md  ABO/Rh rules per component (authoritative)
/DOCUMENTATION.md        Infrastructure, env vars, deployment reference
```

Branches: `main` (prod) ← PRs from feature branches (`smit-dev`, `AtharvaDev`, etc.).

---

## Complete system lifecycle

```
PROCUREMENT
  Vendor → Purchase Order → Goods Receipt → Batch → Quality Inspection
                                ↓
                           Bag Stock (empty bags inventory)
                                ↓
COLLECTION
                         Bag Issue for Collection
                                ↓
                    Donor Registration & Screening
                                ↓
                           Donation Created
                                ↓
LABORATORY
                    TTI Testing (HIV/HBV/HCV/Syphilis/Malaria)
                                ↓
                    Component Separation (PRBC/FFP/Platelets/Cryo)
                                ↓
                         Blood Units Released
                                ↓
TRANSFUSION
                Requisition → Crossmatch → Issue → Transfusion
                                ↓
                         Adverse Reaction / Lookback
```

---

## Server modules (`server/src/modules/`)

### Procurement & Stock (new — Blood Bag Procurement)
| Module | Route | Purpose |
|---|---|---|
| `vendor` | `/api/v2/vendor` | Vendor registration, drug licence, GST, approval workflow |
| `purchase-order` | `/api/v2/purchase-order` | PO lifecycle DRAFT→APPROVED, line items, GST totals |
| `goods-receipt` | `/api/v2/goods-receipt` | GRN + invoice + batch registration, accept → stock upsert |
| `bag-stock` | `/api/v2/bag-stock` | Empty bag stock register, closing stock virtual, summary |
| `bag-inspection` | `/api/v2/bag-inspection` | QC per batch (7 physical checks), ACCEPTED/REJECTED/QUARANTINE |
| `bag-issue` | `/api/v2/bag-issue` | Issue bags to collection, ISSUED→USED/RETURNED/DAMAGED |
| `bag-discard` | `/api/v2/bag-discard` | Discard register (9 reasons), biomedical waste manifest |

### Clinical — Donation & Lab
| Module | Route | Purpose |
|---|---|---|
| `donor` | `/api/v2/donor` | Donor registration, eligibility, deferral history |
| `donation` | `/api/v2/donation` | Collection event; source=inhouse\|camp filter; timeline detail |
| `unit` | `/api/v2/unit` | Blood units, state machine, FEFO, special needs |
| `tti` | `/api/v2/tti` | TTI results, quarantine gate, release decision |
| `deferral` | `/api/v2/deferral` | Temporary/permanent donor deferral |

### Inventory & Issue
| Module | Route | Purpose |
|---|---|---|
| `inventory` | `/api/v2/inventory` | Stock view, reserve, near-expiry |
| `requisition` | `/api/v2/requisition` | Hospital requisition, FIFO matching |
| `crossmatch` | *(under requisition)* | Crossmatch perform + MO override |
| `issue` | *(under requisition)* | Issue to patient |
| `transfusion` | `/api/v2/transfusion` | Transfusion record, outcome |
| `adverse-reaction` | `/api/v2/adverse-reaction` | Adverse reaction grades + categories |

### Camp & Operations
| Module | Route | Purpose |
|---|---|---|
| `camp` | `/api/v2/camp` | Camp registration, donor management, camp donations |
| `lookback` | `/api/v2/lookback` | Donor lookback when TTI reactive |
| `audit` | `/api/v2/audit` | Immutable audit trail |
| `user` | `/api/v2/user` | Staff user management, 14 roles |
| `hospital` | `/api/v2/hospital` | Hospital / consignee registry |
| `auth` | `/api/v2/auth` | JWT login, refresh, OTP, registration |

---

## Client features (`client/src/features/`)

| Feature | Pages | Notes |
|---|---|---|
| `bag-procurement` | VendorManagement, PurchaseOrders, GoodsReceipt, BagInventory, BagInspection, BagIssuance, BagDiscard | Full procurement lifecycle UI |
| `donation` | DonationManagement (central view — Inhouse + Camp tabs + timeline drawer) | `source=inhouse\|camp` filter, 6-step timeline per donation |
| `camp` | Camp listing, CampDetails, CampDonationManagement, CampDonorManagement | |
| `donor` | DonorManagement | |
| `inventory` | ReserveWizard, NearExpiry | |
| `component` | ComponentSeparate, NearExpiry | |
| `serology` | Serology (TTI testing UI) | |
| `requisition` | RequisitionManagement | |
| `mis` | DonationMIS, InventoryMIS, IssueMIS, DiscardMIS, ExecutiveMIS, DonorMIS, ExceptionMIS | |
| `appointment` | AppointmentList | |
| `auth` | Login-Page, Registration-Page | |
| `hospital` | AddHospital | |

---

## Run

| Concern | Command |
|---|---|
| Backend dev | `cd server && npm run dev` |
| Backend typecheck | `cd server && npm run typecheck` |
| Backend lint | `cd server && npm run lint` |
| Frontend dev | `cd client && npm run dev` |
| Frontend lint | `cd client && npm run lint` |
| Full stack (Docker) | `docker compose --env-file .env up -d` |
| Health check | `curl http://localhost:5000/health` |

---

## Hard rules — apply to every change

1. **No `Mongoose.find/aggregate/...` in controllers.** Data access goes through a repository.
2. **No `axios.*` in React components.** Use `features/<x>/api.js` and TanStack Query hooks.
3. **Every new route declares `requireRole(...)` and `requirePermission(...)`.** Auth without authorisation is not "auth".
4. **Every request body has a zod validator.** Reject malformed input before it reaches the service.
5. **`BloodUnit.status` transitions only via `modules/unit/unit.state-machine.transition`.** Invalid transitions throw.
6. **BagStock quantity mutations use atomic `$inc`.** Never read-modify-write stock counts — race conditions corrupt the stock register.
7. **Soft-delete only for clinical records.** All deletes write an audit entry.
8. **TTI quarantine is non-bypassable.** A unit cannot reach `RELEASED` without a released TTI result.
9. **RBC issue requires a passing crossmatch.** Medical-officer override is allowed but must be logged.
10. **Special-needs flags on a patient are hard requirements.** Irradiated/CMV-neg/leukoreduced/washed/HbS-neg/phenotype-matched units must be filtered before display, not relied on the user.
11. **Times stored UTC, rendered in `Asia/Kolkata`** through a formatter — never `new Date()` in JSX.
12. **Naming standard:** files `kebab-case`, React components `PascalCase.jsx`, Mongoose models singular `PascalCase`, schema fields `camelCase`, enums `SCREAMING_SNAKE`, env vars `SCREAMING_SNAKE`, route paths `kebab-case`.
13. **Fix legacy spellings as you touch them:** `Registeration → Registration`, `sernology → serology`, `Seriology → Serology`.
14. **No back buttons in page headers.** Navigation is handled by sidebar/router — per-page back buttons were removed.

---

## Permissions reference

Permissions are defined in `server/src/shared/enums.ts` `PERMISSION` array and wired to roles in `role-map.ts`.

### Procurement permissions (new)
```
vendor:read  vendor:create  vendor:update  vendor:delete
po:read  po:create  po:approve
grn:read  grn:create
bag-stock:read  bag-stock:update
bag-inspection:read  bag-inspection:create
bag-issue:read  bag-issue:create
bag-discard:read  bag-discard:create  bag-discard:approve
```

Roles with full procurement access: `system-admin`, `bbo`, `store-keeper`.
QA access: `qa-manager` (inspections + discard approve + stock:read).
Read-only access: `phlebotomist` (bag-stock:read, bag-issue:read).

---

## Migration status

Legacy JS monolith deleted. `server/src/` is the only backend. `server/src/server.ts` is the canonical entry.

- **`site` renamed to `camp` everywhere** — DB model is `Camp`, field `siteId` → `campId` in all schemas.
- **DB migration needed**: copy `sites` collection to `camps` before switching traffic.
- **Frontend features/**: all pages under `client/src/features/<module>/pages/`; all API calls via `features/<module>/api.js` + `queries.js`. No new `axios.*` in components.
- **Remaining axios in pages**: ~25 legacy pages still call axios directly. Migrate per-feature as touched.

---

## When unsure

- Domain question → `Blood Compatibility - Crossmatch Rules.md` or memory `bbms-domain-research.md`.
- Layering / convention → `server/CLAUDE.md` or `client/CLAUDE.md`.
- Procurement domain → follow NBTC/CDSCO guidelines: batch traceability, drug licence check, QC inspection before stock acceptance.
- "Should I add a comment?" → almost certainly no. Only for hidden constraints or non-obvious workarounds.
