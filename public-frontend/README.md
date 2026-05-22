# Blood Bank — Public Frontend

Next.js public-facing marketing / landing site for the Blood Bank Management
System. Provides informational pages and entry points (CTAs) into the admin
[`client`](../client) app.

Part of the [Blood Bank Management System](../README.md) monorepo. For full
setup, deployment, environment, security, and licensing details see
[`../DOCUMENTATION.md`](../DOCUMENTATION.md).

---

## Tech Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Radix UI** + **Tailwind CSS 4** — components and styling
- **React Hook Form** + **Zod** — forms and validation
- **Axios** — HTTP client; **Mongoose** — server actions / data models
- **@vercel/analytics** — page analytics

## Project Structure

```
public-frontend/src/
├── app/          App Router routes, layouts, pages
├── components/   shared UI components
├── context/      React context providers
├── actions/      server actions
├── models/       Mongoose models
├── schemas/      Zod validation schemas
└── lib/          helpers & utilities
```

## Scripts

```bash
npm install        # install dependencies
npm run dev        # Next dev server -> http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint
```

## Development

```bash
cd public-frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

This package may use server actions and Mongoose. If it connects to MongoDB or
the API, create `.env.local` with the required values (e.g. `MONGODB_URI`,
API base URL). Keep `.env.local` out of git. See
[`../DOCUMENTATION.md`](../DOCUMENTATION.md) §5 for variable conventions.

## Production

```bash
npm run build
npm run start
```

`vercel.json` is present — the site is deployable to Vercel. Serve behind
HTTPS.
