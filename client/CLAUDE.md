# client/CLAUDE.md

Frontend rules. Read `../CLAUDE.md` first.

## Layout (module-based — mirrors the backend)

```
/src
  /core         app infra: api-client.js (axios), query-client.js (TanStack), auth-token-store.js
  /features
    /bag-procurement    Vendor, PO, GRN, BagStock, BagInspection, BagIssuance, BagDiscard
    /donation           DonationManagement (central view: Inhouse/Camp tabs + timeline drawer)
    /camp               Camp listing, CampDetails, CampDonationManagement, CampDonorManagement
    /donor              DonorManagement
    /inventory          ReserveWizard, NearExpiry
    /component          ComponentSeparate, NearExpiry
    /serology           Serology (TTI)
    /requisition        RequisitionManagement
    /mis                DonationMIS, InventoryMIS, IssueMIS, DiscardMIS, ExecutiveMIS, DonorMIS, ExceptionMIS
    /appointment        AppointmentList
    /auth               Login-Page, Registration-Page
    /hospital           AddHospital
    /<feature>/
      api.js            axios calls — ONLY place axios is used per feature
      queries.js        TanStack Query hooks (useXList, useXDetail, useCreateX, ...)
      schemas.js        zod schemas (form + API DTO) — if forms exist
      components/       feature-local components
      pages/            page-level components (route targets)
  /components
    /ui                 radix wrappers (button, card, dialog, ...) — legacy home
    /shared             cross-module UI + helpers
    PageHeader          shared header component (no back button)
  /hooks        compatibility shims (useDonor → features/donor/queries)
  /lib          legacy utils (cn, formatters)
  /store        auth context
  main.jsx      providers: QueryClientProvider → AuthProvider → BrowserRouter
```

Aliases: `@/core/*`, `@/features/*`, `@/shared/*` (all resolve via `@ → src`). Legacy tree (`/src/page`, `/components`, `/services`) still live — migrate per-feature, don't bulk-rename.

## Hard rules

1. **No `axios.*` in components.** Calls live in `features/<x>/api.js`; components consume `features/<x>/queries.js` hooks (TanStack Query).
2. **Every form has a zod schema** in `features/<x>/schemas.js`, fed to `react-hook-form` via `@hookform/resolvers/zod`.
3. **No inline business logic in JSX.** Compute in hooks/selectors. The render tree describes UI, not workflows.
4. **No new components > 250 LOC.** If you're adding to a god component (e.g., `Create-Donation.jsx`), split first.
5. **One Modal component.** Use `<Modal>` from `components/ui/modal`; variant via props (`variant="confirm" | "alert" | "form"`). Do not create `CustomFooConfirmAlertModal`.
6. **Role gating** through `<Can module="x" action="y">` + `useAccess()`. Never copy-paste `checkAccess(...)`.
7. **Dates rendered through `lib/format-date.js`** in `Asia/Kolkata`. Never `new Date(value).toString()`.
8. **Routes declared in `src/app/routes.jsx`** as a config array, not inline JSX in `App.jsx`. Pull legacy routes out as you touch them.

## TanStack Query patterns

- Query keys are arrays starting with the feature: `['donor', 'list', filters]`, `['donor', 'detail', id]`.
- Mutations call `queryClient.invalidateQueries({ queryKey: ['donor', 'list'] })` on success.
- Always set `staleTime` for read-mostly data (5 min for catalogues; 0 for live counters).
- Optimistic updates only where the operation is naturally idempotent (renames, toggles); never for clinical state changes.

## Forms

- One zod schema per form, exported from `schemas.js`.
- `useForm({ resolver: zodResolver(schema) })`.
- Field components from `components/ui/form` — they wire up label, error, aria.
- Multi-step wizards: each step owns its own sub-schema; the parent composes them with `z.intersection` (or `.merge`).

## Naming

- Files `kebab-case.jsx`; default exports are PascalCase.
- Folders `kebab-case`.
- Pages are nouns (`donor-list.jsx`), not actions (`create-donor.jsx` → `donor-create.jsx`).
- Fix spellings as you touch: `Registeration → Registration`, `sernology → serology`, `Seriology → Serology`.

## Styling

- Tailwind v4 utility-first. No CSS modules.
- Design tokens in `index.css` via `@theme inline`. Add new tokens there, not as hard-coded hex.
- Dark mode via the `@custom-variant dark` already configured.
- Use `cn(...)` from `lib/utils.js` for conditional class composition.

## State

- Server state → TanStack Query.
- Auth/user → `AuthContext` (one context, not three).
- Form state → `react-hook-form`.
- Anything else → local `useState`.
- No Redux, no Zustand unless a real reason appears.

## Tests

- `vitest` + `@testing-library/react` for the rewritten components.
- Test what the user can see/do; do not test implementation details.
