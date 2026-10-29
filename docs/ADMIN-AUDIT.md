# Admin expansion: baseline audit and implementation plan

Audit date: 2026-10-29. Source: the existing repository, not an assumed template.

## Existing architecture

- Next.js 15.5.28 App Router, React 19, strict TypeScript, pnpm, Tailwind v4/PostCSS, local Fraunces and Geist fonts. CSS tokens use warm paper, ink, sand and burgundy. Radix dialogs, Lucide icons, React Hook Form and Zod are already available.
- Public pages and `/admin` share the global marketing header/footer. `/admin/[table]` supplies a generic collection editor with server routes at `/api/admin/[table]`. Existing routes are preserved.
- `lib/repository.ts` is the shared persistence boundary: Supabase in configured mode; an atomic-write JSON file in `.local` in mock mode. `lib/types.ts` defines domain records. No ORM is present. Three SQL migrations and generated Supabase types exist.
- Supabase Auth supports magic links and Google OAuth. Mock mode uses HMAC-signed HttpOnly cookies and a demo team code. Existing roles: user, agent, admin.
- Public listings use `lib/data.ts`, listing cards, search/map filters, property detail/gallery, showing requests, valuation, and mortgage calculator. Data is seeded with 40 fictional listings. Admin can currently edit only featured rank, featured flag, hidden flag and price.
- Lead forms validate on client/server, record separate consent choices, rate-limit public requests, and persist an email outbox. Development does not send externally. Resend/Twilio/Turnstile boundaries exist. API credentials are server-only. Saved homes/searches and profile preferences exist.
- Existing CMS: agents, testimonials, blog markdown/drafts, neighborhoods, social posts, site settings, redirects, upload endpoint, audit log and CSV lead export.
- Docker/Compose, CI scaffolding, env examples and health route exist. Baseline `pnpm typecheck` and `pnpm lint` pass. No working unit/e2e suite existed at this audit. Docker access requires the permitted host process.

## Gaps and risks found

- No full listing creation, image ordering, publication workflow, admin property detail, or archive workflow.
- Leads are appended for every inquiry; there is no normalized identity, many-to-many property interest, pipeline, priority, activity timeline, tasks or deduplication.
- Staff routes currently treat agents and administrators equally; service-role repository mutations need explicit record authorization. Supabase staff policies likewise need assignment scope.
- Existing demo login can recover a previously privileged demo account by email without rechecking its team code; this will be corrected.
- No conversations/messages, AI provider, handoff, appointment management, workflow execution or record-based analytics. These must be implemented, not represented by static counters.
- Generic admin tables lack pagination and use technical field names. Marketing navigation/header consumes significant screen space on admin routes.
- Local JSON storage is a single-process development adapter, not a horizontally scalable production database. Hosted use requires Supabase. Existing uncommitted prototype work is checkpointed before expansion.
- Seed portraits, listings, demographics, reviews and article drafts are explicitly illustrative. Licensed IDX, approved brand assets, live Google OAuth, AI credentials, delivery credentials and hosted projects are unavailable.

## Reference and design direction

Public reference pages reviewed: https://www.luxurypresence.com/ and https://www.luxurypresence.com/ai-lead-nurture/ . These publicly describe CRM, listing alerts, inbound lead qualification and human handoff. Their authenticated admin UI was not accessed or reproduced.

Adaptation: retain the Ellison lockup, burgundy, paper, serif headings and local voice. Add a focused staff workspace, property photography, readable tables, contextual actions and restrained status badges. Reuse Radix dialogs and current form/button patterns. Do not copy reference assets, marketing claims, branding or proprietary layouts.

## Implementation order

1. Shared model/migration, assignment authorization, normalized lead identity, publication workflow and property editor.
2. CRM list/pipeline, lead detail/activity, assignments, follow-up tasks and property relationships.
3. Configurable lead gates, contact capture and existing Google OAuth return flow.
4. Server-only real AI provider boundary, persisted conversation sessions, human handoff and staff inbox. Missing credentials return a real configuration error; no fake AI completion.
5. Appointments, communication records, templates, attributed campaigns and idempotent internal automation rules.
6. Record-based analytics with date filters, team controls, responsive/a11y polish and regression tests.

Extend existing tables rather than introduce duplicate properties, contacts, or appointments. Leads are the contact records; showing_requests are the appointment records. Keep the existing three sales statuses and add a separate draft/published/archived publication state.

## Verification plan

Unit tests: validation, normalized identity, transitions, assignment authorization, analytics math, scheduling, workflow idempotency and AI grounding. API/browser: admin/user/agent permissions, listing CRUD/public sync, duplicate inquiries, lead assignment/stages, task/appointment updates, chat unavailable/handoff, record metrics, mobile navigation and existing public pages. Apply migrations only to the local development database. Report real-provider/OAuth tests as unavailable until credentials are configured.
