# The Ellison Group

A Next.js, Supabase, and Docker real estate prototype for Little Rock, Arkansas.

The public site and the expanded team workspace share the same listing and inquiry records. Fraunces, Geist, the original wordmark, warm paper palette, and burgundy accent are retained. All supplied listings, portraits, and testimonials are demonstration content.

## Run locally

Use Node.js 22 or newer and pnpm 10.18.3. On Windows, install pnpm once with `npm.cmd install --global pnpm@10.18.3`, then reopen your terminal. If PowerShell blocks a package-manager `.ps1` wrapper, use `pnpm.cmd` for the same commands.

```powershell
pnpm install --frozen-lockfile
pnpm run setup
pnpm dev
```

Open [the website](http://localhost:3000) or [the team workspace](http://localhost:3000/admin). `pnpm run setup` copies missing environment files; it preserves existing configuration and data. `pnpm setup` is pnpm's own command and does not run this application's setup script.

Mock mode needs no database credentials. Data persists in `.local/data.json`, and uploaded images in `.local/media`. Existing local records are upgraded on read without resetting them. Mock mode is for a single development process; use Supabase for shared or deployed operation.

For a local demo administrator, enter an email and the `DEMO_ADMIN_CODE` in `.env.development` (the example value is `prototype-admin`). Existing staff accounts require this code on every demo login. The visitor search portal has no staff permissions. Demo login is explicitly labeled and is not a production identity provider.

## Workspace

- **Properties:** full draft/create/edit workflow, photography uploads and ordering, features, pricing, sale/rental and publication states, responsible agents, private previews, related inquiries, notes, tasks, search/filter/sort, pagination, bulk featuring/archiving, and confirmed draft deletion.
- **Leads & CRM:** normalized email identity, multiple property interests, immutable consent history, list/pipeline views, assignment, configurable stages, priority, tags, follow-ups, notes, activity, conversion outcomes, and scoped CSV export.
- **Engagement:** visitor chat with a real AI Gateway integration boundary, saved conversations, explicit AI/human labels, human takeover, private staff notes, contact capture, appointments, tasks, communication history, and reviewed outbound messages when live providers are configured.
- **Growth:** attributed public campaign pages, templates, configurable internal workflows and execution history, notifications, and reports calculated from actual workspace records.
- **Administration:** team roles, record assignments, capture/assistant settings, existing content collections, audit history, and server/database authorization.

Missing AI credentials produce a clearly labeled unavailable state while visitor questions remain available for human follow-up. Google, live email, and SMS require their respective providers. See [integration setup and limitations](TODO-INTEGRATIONS.md).

First-time public visitors see a dismissible listing-update signup with kitchen photography. It appears once per browser (`ellison-welcome-v1` in local storage); returning signed-out visitors receive a sign-in recommendation after eight seconds. Dismissing that recommendation lasts for the tab session. Signed-in visitors, team pages, sign-in pages, and the privacy page skip these prompts. Google sign-in uses the existing configured Supabase provider and returns visitors to their current page; unconfigured/demo mode offers the search portal with a disabled Google button. The signup records email newsletter consent only and does not subscribe visitors to phone calls or SMS.

## Use local Supabase

Docker Desktop must be running. Start the app's existing Supabase project and apply migrations:

```powershell
pnpm exec supabase start
pnpm exec supabase migration up --local
pnpm db:types
```

Set `NEXT_PUBLIC_DATA_MODE=supabase`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY` in `.env.development`, then restart the dev server. Use the values printed by your own local Supabase CLI. Supabase Studio normally runs on [port 54323](http://localhost:54323).

Connected public forms and sign-in also require `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and server-only `TURNSTILE_SECRET_KEY`, with the hostname matching `NEXT_PUBLIC_SITE_URL`. The mock adapter's verification bypass is limited to its explicitly labeled demo mode.

The new migrations extend the existing schema. They do not reset listings, contacts, consent history, or authentication accounts. `supabase db reset` is a separate destructive development operation and is not required for this upgrade. Seed generation (`pnpm seed`) regenerates the fictional seed files; `--reset-mock` explicitly replaces local mock records and should only be used deliberately.

For the first connected administrator, create an account through Supabase Auth and assign its existing `profiles.role` to `admin` through an authorized database administrator. Subsequent roles can be managed at `/admin/team`. Agent accounts require a linked public agent profile. Visitors cannot promote themselves.

## Verification

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm exec playwright install chromium
pnpm e2e
pnpm build
pnpm lighthouse
```

The browser suite starts its own server on `127.0.0.1:3100`, uses `.next-e2e` and a unique `.local/e2e/<run>/data.json`, and never overwrites the app's normal local records. It exercises the actual UI and API; no external AI, email, SMS, or Google calls are made. Browser screenshots and traces are written to `test-results` and the HTML report to `playwright-report`.

Run browser checks and builds sequentially: Next.js updates shared generated TypeScript references when switching build directories. Lighthouse requires a completed production build; it starts an isolated server on port 3200, audits the homepage three times with mobile throttling, and saves reports locally in `.lighthouseci/reports`. It does not upload reports or contact external messaging/AI providers. If you built with `NEXT_DIST_DIR`, use the same value for the audit. Its category thresholds are 90 for performance, accessibility, best practices, and SEO; local fixture measurements are not production traffic measurements.

With the app's local Supabase container running, execute the rollback-only database tests in PowerShell:

```powershell
Get-Content tests/database/platform.sql -Raw | docker exec -i supabase_db_the-ellison-group psql -U postgres -d postgres -v ON_ERROR_STOP=1
```

These tests create transactional fixtures and roll them back. They cover anonymous/visitor/agent/admin policies, draft and gated media isolation, service-only mutations, duplicate workflow protection, late AI suppression after takeover, and appointment overlap.

## Docker

`docker compose -f docker-compose.dev.yml up --build` runs the existing development stack. The production compose file retains a standalone, non-root Next.js image behind Caddy; configure `.env.production` and rebuild after changing any `NEXT_PUBLIC_*` variable. Server provider secrets are runtime configuration. Keep development servers private and use a production build for deployed environments.

Full architecture, database changes, security decisions, metric definitions, file inventory, and verification details are in [the implementation report](docs/ADMIN-IMPLEMENTATION.md). The earlier repository audit is in [ADMIN-AUDIT.md](docs/ADMIN-AUDIT.md).
