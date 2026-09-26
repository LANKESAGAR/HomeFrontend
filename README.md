# The Lanke Family Home — Frontend

A simple, mobile-friendly web app for the Lanke family to track construction
expenses against category budgets for their house build in Kakinada, India.
Built with React + Vite and Tailwind CSS, talking to a Spring Boot REST backend.

## Checking the deployed version

The app version lives in `package.json` (currently `0.0.1-LANKE`) and is baked
into the production bundle at build time via `vite.config.js` (`define:
{ __APP_VERSION__ }`, read from `package.json` at build time — nothing to keep
in sync manually). It's displayed at the bottom of the account panel in the
desktop sidebar (e.g. "v0.0.1-LANKE"), so you can visually confirm which build
is actually live after a deploy without opening dev tools. Bump the `version`
field in `package.json` before each deploy if you want that label to reflect a
new build number.

## Features

- Login (JWT stored in `localStorage`, attached to every API call)
- Registration gated by a shared household invite code, with auto-login on
  success, and an in-app "Change Password" form
- Dashboard — total budget / spent / remaining, spend-by-category pie chart,
  monthly spend trend chart, quick "Add Expense"
- Expenses — filterable list (category / year / month), add / edit / delete,
  CSV export
- Budget — per-category allocated vs. spent with progress bars, editable
  Total House Budget, add / edit / delete categories
- Funding — tracks the two pools of money that fund the build: the bank loan
  and personal funds Sagar sends from the US. Per-source Contributed / Spent
  / Remaining summary cards with progress bars, an overall combined summary,
  a form to log new contributions (source, amount, date, note), an editable
  list of past contributions, and an exchange-rate control (manual entry or
  "Fetch current rate" from a live source)
- Plans — upload and browse building/structural/interior/layout plan
  documents (PDF or image), filter by category, view/delete
- Global currency toggle (₹ / $) in the nav — switches which currency is
  shown as the primary amount everywhere (Dashboard, Expenses, Budget,
  Funding), with the other currency shown alongside in smaller muted text.
  Choice is persisted in `localStorage`; the INR-per-USD exchange rate is
  fetched once from `/api/settings` and shared app-wide via `CurrencyContext`
- Expenses now tag every expense with which funding pool paid for it (Bank
  Loan / Personal Funds), shown as a colored badge (or "Unspecified" for
  older untagged expenses), with a matching filter
- Responsive layout: sidebar nav on desktop, top bar + bottom nav on mobile

## Tech stack

- React 19 + Vite
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- React Router v7
- Recharts (pie + bar charts, colorblind-safe fixed palette)
- Axios (with a request interceptor for the JWT and a response interceptor
  that redirects to `/login` on `401`)

## Running locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file and point it at your backend:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set `VITE_API_BASE_URL` to your Spring Boot backend's base
   URL (no trailing `/api` — that's added automatically), e.g.:

   ```
   VITE_API_BASE_URL=http://localhost:8080
   ```

   This is a small private family app, so registration is gated behind a
   shared invite code rather than being open to anyone on the internet. On
   the **backend**, set the `REGISTRATION_INVITE_CODE` environment variable
   (or equivalent config property) to the PIN/code your household shares
   privately — the `/api/auth/register` endpoint rejects sign-ups that don't
   supply a matching `inviteCode`. There's nothing to configure on the
   frontend for this; it just forwards whatever the user types.

3. Start the dev server:

   ```bash
   npm run dev
   ```

   The app runs at `http://localhost:5173` by default.

4. Build for production (also used to sanity-check the app before deploying):

   ```bash
   npm run build
   ```

   Output goes to `dist/`. Preview it locally with `npm run preview`.

## API contract

The frontend expects a backend exposing these endpoints under `/api`, all
requiring a `Authorization: Bearer <token>` header except login:

- `POST /api/auth/login` `{username, password}` → `{token, username, name}`
- `POST /api/auth/register` `{username, password, name, inviteCode}` →
  `{token, username, name}` (same shape as login, so the new user is
  auto-logged-in immediately). Fails with `403` for a bad invite code or
  max accounts reached, `409` if the username is taken, `400` for
  validation errors (e.g. password too short).
- `POST /api/auth/change-password` (requires `Authorization: Bearer` like
  other authenticated endpoints) `{currentPassword, newPassword}` →
  `{message: "Password updated"}`. Fails with `401` for a wrong current
  password, `400` if the new password is too short.
- `GET/POST/PUT/DELETE /api/categories[/{id}]`
- `GET/POST/PUT/DELETE /api/expenses[/{id}]` (with
  `?categoryId=&year=&month=&fundingSource=` filters). Expense objects
  include a `fundingSource` field (`"BANK_LOAN"`, `"PERSONAL"`, or `null` for
  older untagged expenses). `POST`/`PUT` payloads require `fundingSource`
  (`BANK_LOAN` or `PERSONAL`) for new/edited expenses.
- `GET /api/expenses/export` → CSV file download
- `GET/POST/PUT/DELETE /api/funding[/{id}]` (optional `?source=BANK_LOAN|PERSONAL`
  filter on `GET`) → `{id, source, amount, date, note, createdAt}`, where
  `source` is `BANK_LOAN` or `PERSONAL`. Backs the Funding page's
  contribution log.
- `GET/PUT /api/settings` → `{totalBudget, exchangeRateInrPerUsd}`
- `POST /api/settings/refresh-exchange-rate` (no body) → fetches a live
  INR-per-USD rate and returns the updated `{totalBudget, exchangeRateInrPerUsd}`.
  Can fail with `502` and an error message if the external rate service is
  unreachable; the Funding page surfaces that message to the user.
- `GET /api/dashboard/summary` →
  `{totalBudget, totalSpent, remaining, categoryBreakdown, monthlySpend,
  fundingBreakdown, totalContributed, totalUnspecifiedSpend}`, where
  `fundingBreakdown` is `[{source, contributed, spent, remaining}]` (always
  both `BANK_LOAN` and `PERSONAL` present) and `totalUnspecifiedSpend` is the
  spend from expenses with no funding tag (relevant only for older data).
- `POST /api/documents` (multipart/form-data: `file`, `title`, `category`,
  `uploadedBy`, `notes`) / `GET /api/documents[?category=]` /
  `DELETE /api/documents/{id}` — for the Plans page. `category` is one of
  `BUILDING_PLAN`, `STRUCTURAL_PLAN`, `INTERIOR_DESIGN`, `LAYOUT_PLAN`,
  `OTHER`. The returned `fileUrl` is expected to be a public Supabase
  Storage URL that the frontend can load/link to directly (used as-is for
  image thumbnails and the "View" link) — no separate download endpoint is
  called.

## Deploying for free (Vercel or Netlify)

Both platforms auto-detect a Vite project. Either works — pick whichever you
already have an account on.

### Vercel

1. Push this project to a Git repository (GitHub/GitLab/Bitbucket).
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Framework preset: **Vite** (auto-detected). Build command `npm run build`,
   output directory `dist` (defaults are already correct).
4. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL` = the URL of your deployed Spring Boot backend
     (e.g. `https://your-backend.onrender.com`)
5. Deploy. Every push to the connected branch redeploys automatically.

### Netlify

1. Push this project to a Git repository.
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** →
   **Import an existing project** → pick the repo.
3. Build command: `npm run build`. Publish directory: `dist`.
4. Under **Site settings → Environment variables**, add:
   - `VITE_API_BASE_URL` = the URL of your deployed backend
5. Deploy.

### Notes

- `VITE_*` env vars are baked into the JS bundle at build time — after
  changing `VITE_API_BASE_URL` in Vercel/Netlify, trigger a new deploy for it
  to take effect.
- Make sure the backend's CORS configuration allows requests from your
  deployed frontend's domain.
- Since this is a client-side routed SPA, both Vercel and Netlify need a
  rewrite rule so deep links (e.g. `/expenses`) don't 404 on refresh:
  - **Vercel**: create a `vercel.json` with:
    ```json
    { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
    ```
  - **Netlify**: create a `public/_redirects` file with:
    ```
    /*    /index.html   200
    ```
