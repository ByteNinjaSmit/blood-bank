# Blood Bank — Client (Admin App)

React + Vite single-page app for blood bank staff and admins. Talks to the
Express API in [`../server`](../server).

Part of the [Blood Bank Management System](../README.md) monorepo. For full
setup, deployment, environment, security, and licensing details see
[`../DOCUMENTATION.md`](../DOCUMENTATION.md).

---

## Tech Stack

- **React 19** + **Vite 7** (HMR dev server, fast builds)
- **React Router 7** — client-side routing
- **TanStack Query** — server state / data fetching
- **Axios** — HTTP client
- **Radix UI** + **Tailwind CSS 4** — UI components and styling
- **React Hook Form** + **Zod** — forms and validation
- **Recharts** — MIS charts; **jsPDF** / **xlsx** — report export

## Project Structure

```
client/src/
├── main.jsx          app bootstrap
├── App.jsx           root component / routes
├── page/             feature pages
│   ├── auth-pages/        login, OTP
│   ├── dashboard/         dashboard
│   ├── donor/             donor registration & management
│   ├── donation/          blood bag collection
│   ├── Serology/          lab / serology results
│   ├── component-separate/ component separation
│   ├── Inventory/         component inventory
│   ├── hospital/          hospital master data
│   ├── requisition/       hospital requests / issue
│   ├── camp/              donation camps
│   ├── appointment/       donor appointments
│   ├── mis/               MIS reports
│   └── user-manage/       users & roles
├── services/         API clients (api.js + per-domain modules)
├── components/       shared UI components
├── hooks/            custom React hooks
├── store/  atoms/    state management
├── constants/  lib/  helpers & constants
└── assets/           static assets
```

Vite path aliases (`vite.config.js`): `@`, `@/components`, `@/lib`,
`@/hooks`, `@/pages`, `@/assets`.

## Environment

Copy the template and edit:

```bash
cp .env.example .env
```

| Variable | Purpose | Dev | Prod |
|----------|---------|-----|------|
| `VITE_APP_URI_API` | Backend API base URL | `http://localhost:5000` | production API host |

`.env` is read at **build time** — restart `npm run dev` or rebuild after
changes. Only `VITE_`-prefixed vars reach the browser; never put secrets here.

## Scripts

```bash
npm install        # install dependencies
npm run dev        # Vite dev server -> http://localhost:5173
npm run build      # production build -> dist/
npm run preview    # preview the production build
npm run lint       # ESLint
```

## Development

```bash
cd client
npm install
cp .env.example .env          # VITE_APP_URI_API=http://localhost:5000
npm run dev
```

Open `http://localhost:5173`. Backend must be running (see
[`../server/README.md`](../server/README.md)).

## Production Build & Hosting

```bash
# set VITE_APP_URI_API to the production API URL first
npm run build                 # output in dist/
```

`vercel.json` rewrites all routes to `/` (SPA fallback) — deployable to Vercel
or any static host. Serve `dist/` behind HTTPS.

The production API origin must be in the `allowedOrigins` array in
`server/server.js` or browser requests are blocked by CORS.
