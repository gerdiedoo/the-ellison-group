# Google sign-in deployment setup

Setup audit: November 3, 2026.

## Confirmed deployment

- Vercel project: `the-ellison-group` (`prj_jOYe2dB0LvRBG6tPPJbBPpqlpWhI`).
- Requested target: Preview environment, Git branch `development`.
- Site: https://the-ellison-group-git-development-dreg1.vercel.app
- Source commit: `df279577043394ec8d65f98ced61eb22678b401b`, committed on `feature/google-sign-in` and fast-forwarded to remote `development`.
- Connected deployment: `dpl_FKLuqr83DHUsBFSSHpvN24curjkG`, verified `READY` with the expected commit and canonical development alias. `/api/health`, `/api/visitor-session`, and `/icon.svg` each returned HTTP 200. Health reports `database: connected`; the unauthenticated session endpoint reports `google_enabled: true`.
- The live development app uses the isolated Supabase database. The main/production branch was not changed.

## Completed configuration

Created and read back a branch-specific Vercel variable:

```dotenv
NEXT_PUBLIC_SITE_URL=https://the-ellison-group-git-development-dreg1.vercel.app
```

Its scope is Preview / `development`, and it is active in the verified deployment. Production settings were not changed.

Created the user-approved Cloudflare widget `The Ellison Group Development`, in Managed mode, for `the-ellison-group-git-development-dreg1.vercel.app`. Pre-clearance is disabled. Saved and verified these Vercel variables in Preview / `development` only:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` as Config.
- `TURNSTILE_SECRET_KEY` as Secret. Its value was transferred directly between the browser dashboards, without being printed or saved to a local file.

The variables are active in the verified deployment. Managed Turnstile completed automatically during the actual Google sign-in test; no interactive challenge was solved or bypassed.

Created the separate Free Supabase project `The Ellison Group Development` (`fltqbniqcxbfgfmjdiwu`) in `us-east-1`. Its API URL is `https://fltqbniqcxbfgfmjdiwu.supabase.co`. All five repository migrations were applied; their recorded versions were aligned to the unchanged local migration filenames and verified. Every public application table has RLS enabled. The security advisor returned no warning/error findings, only the informational finding for the service-only private rate-limit table.

Copied the repository's labeled demonstration catalog: 40 sample listings, 4 agents, and 9 neighborhoods with associated public content. No contacts or authentication accounts were copied (`leads = 0`, `profiles = 0` at verification).

Saved and verified Preview / `development` overrides for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY`. These use the new project's modern publishable/secret keys in the application's existing environment variable names. Server keys were transferred directly between browser dashboard fields without being printed or written to local files. Existing production/global variables were not overwritten.

## Database compatibility decision

The connected Supabase project `The Ellison Group` (`uizrrxzvblorwdxdfiap`) contains an older application schema with existing records. It has `properties`, `settings`, and `favorites`, whereas this checkout expects `listings`, `site_settings`, and `saved_homes`. Its `profiles` table also lacks fields expected by this application, and its role enum uses `visitor` instead of `user`.

Do not apply this checkout's initial migration directly to that database: several table names already exist with incompatible definitions. No migrations or record changes have been made.

The user selected an isolated free development project in the existing `The Ellison` organization. The initial attempt was blocked by the account's two-active-free-project limit. After the user reported the slot freed, creation succeeded. The agent did not pause, delete, or upgrade any existing project. The connector's project list no longer included the original project when the slot was released; do not assume its old URL/credentials remain usable.

The tool still quotes $0/month for a project on this Free plan. That quote does not override the account's active-project limit; recheck pricing if the plan or resources change.

## Google configuration discovered

The Google Cloud project `the-ellison-group` already contains web OAuth clients named `The Ellison Group` and `Local`. The former registers the existing Supabase callback:

```text
https://uizrrxzvblorwdxdfiap.supabase.co/auth/v1/callback
```

Its OAuth audience remains External / Testing, now with the approved test user listed. The console indicates branding configuration must be completed before publishing. The development Supabase callback is registered alongside the existing callback.

Before the original project disappeared from the connector's list, its Google provider was confirmed enabled with the matching `The Ellison Group` client. Its secret was not revealed or changed. Google no longer allows revealing/downloading that existing client secret; an additional secret is required for the new Supabase project.

The user approved the development OAuth setup. Saved and re-read the development JavaScript origin and additional callback `https://fltqbniqcxbfgfmjdiwu.supabase.co/auth/v1/callback` on the existing Google client. Its old callback and original secret remain unchanged. Added `gerdlowelljana@gmail.com` as a test user and verified the user list. The OAuth app remains in Testing mode.

The new project's Site URL and exact application callback were saved in Supabase. The Google provider was saved and verified enabled with the approved client ID and replacement secret. Nonce checks remain enabled, and users without an email are not allowed.

An additional Google client secret was created with approval. Its full value accidentally appeared in a browser-tool response because the copy button's accessible label contained the value. The secret was not sent to Supabase, Vercel, source control, or local files. After explicit user approval, the exposed unused secret ending `oBtC` was disabled and permanently deleted. The original ending `PpW9` remains enabled. A replacement ending `jJ10` was generated and transferred directly into Supabase Auth without printing its value or writing it to a local file. Reloading Google confirmed only the original and replacement remain enabled. Never record full secrets in this document.

Enabled `google_enabled` in the development database's `lead_capture` configuration, preserving the default disabled property gate and optional browsing behavior. Saved branch-specific Preview / `development` overrides `GOOGLE_OAUTH_ENABLED=true` and `NEXT_PUBLIC_DATA_MODE=supabase`. Started connected deployment `dpl_FKLuqr83DHUsBFSSHpvN24curjkG` from the same reviewed source commit.

## Live verification

- Verified the connected deployment is `READY` and serves the canonical development alias.
- Confirmed the connected homepage renders the seeded public catalog, and the Google recommendation appears for an unauthenticated returning visitor.
- Clicked the real Google recommendation button after Managed Turnstile completed automatically. The existing Google authorization allowed the OAuth round trip without a new permission prompt. The callback returned to the homepage as requested.
- Opened My Search Portal and verified `Welcome, Gerd Jana` and `SIGN OUT` in the authenticated UI. The new database has one Google identity and the corresponding profile with role `user`; no administrator permissions were granted.
- Captured proof in `.local/google-login-verified.jpg`, `.local/live-google-reminder.jpg`, `.local/supabase-google-enabled.jpg`, and `.local/google-secret-replaced.jpg`. All secret values remain masked in screenshots.
- The first-visit popup was visually verified in the preceding deployment from the same source commit, and its dismissal/return behavior was covered by the browser tests. The connected mode is now verified through the live Google flow.

Google Auth and the development database switch are configured and verified end to end. The exposed unused Google secret has been revoked and replaced. Database/Turnstile server keys and the replacement OAuth secret were transferred without printing their full values or storing them in local files. Google remains in Testing mode with the approved test user; public OAuth publication and production deployment were not performed.
