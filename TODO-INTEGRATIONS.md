# Integration setup and remaining verification

This application includes working local workflows and explicit external-service boundaries. Credentials have not been invented, and no production services have been provisioned or contacted by the test suite.

## Real AI responses

1. Create an AI Gateway key with an appropriate spend limit in your own Vercel account.
2. Set server-only `AI_GATEWAY_API_KEY` and `AI_GATEWAY_MODEL` in the runtime environment. The model uses `provider/model` format; select a currently available model with structured-output support from the [Gateway model catalog](https://ai-gateway.vercel.sh/v1/models). No model ID is silently defaulted.
3. Restart the server. Review approved instructions and business FAQ at `/admin/settings`.
4. Submit a visitor question, verify its price/features against the canonical property record, request a human handoff, and review the persisted summary in `/admin/conversations`.

The implementation uses the installed AI SDK's `generateText` and `Output.object`, a 25-second timeout, no automatic provider retry, at most 12 recent public messages, at most 40 public property records, and a 1,200-token output budget. Property IDs are checked against the supplied catalog. Current-property context is prioritized. Internal CRM records, consent records, staff notes, provider credentials, and private messages are excluded. A production retrieval index/paginated search is recommended when inventory outgrows this bounded context. AI remains fallible; the visible interface asks visitors to confirm property details with an agent.

Within that bound, retrieval prioritizes the current property, matching address/location/type keywords and explicit upper-budget preferences. Only verified public records are supplied to the provider.

Without both variables, questions persist and the API returns an explicit 503 unavailable state. The UI offers human follow-up. SDK success and failure are tested with isolated test doubles; **a paid provider response has not been verified because credentials were not supplied**. See [Gateway setup](https://vercel.com/docs/ai-gateway/getting-started).

## Google sign-in and connected authentication

Use the existing Supabase Auth integration. Configure Google OAuth in the project's Auth provider settings, supply its client credentials to Supabase, register the Supabase callback URL in Google, and add the app's `/auth/callback` to Supabase's redirect allowlist. Set server-only `GOOGLE_OAUTH_ENABLED=true`, then enable Google in the workspace capture settings. The browser receives no Google client secret.

The callback exchanges the code server-side. A short-lived HttpOnly cookie preserves an internal return path; external/open redirects are rejected. Name/email can be prefilled from the authenticated profile, while missing required information is still collected and validated by the property form. Authentication alone does not fabricate a lead or a phone number. Mock mode does not advertise Google authentication.

**An actual Google account round trip is pending provider credentials and redirect configuration.** Connected staff invitations are managed in Supabase Auth; the team UI changes roles only for existing connected accounts. The initial administrator is provisioned by an authorized database administrator.

## Email and SMS

External sending requires all of:

- `NEXT_PUBLIC_DATA_MODE=supabase`, `NEXT_PUBLIC_APP_ENV=production`, and `DELIVERY_MODE=live`.
- Email: `RESEND_API_KEY`, verified `RESEND_FROM_EMAIL`, and `LEADS_NOTIFY_EMAIL` for team inquiry notifications.
- SMS: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER`.
- Required channel consent on the contact. SMS additionally needs a valid phone number.

The staff communication form requires review before an external send. An outbox ID prevents accidental retries of queued/accepted requests. `sent_at` means **accepted by the provider**, not delivered to the recipient. Development/log mode keeps local outbox records and never claims delivery. Auth email delivery is separately configured in Supabase Auth.

**Provider deliveries and delivery-receipt webhooks are not verified/implemented.** Failed or ambiguous queued requests require review rather than an automatic duplicate send. Domain verification, SMTP, unsubscribe/STOP processing, final disclosure copy, and operational retention policies must be completed before a live marketing launch. Existing disclosure text is preserved; this project does not claim legal compliance certification.

## Scheduling and workflows

Appointments are stored in UTC and displayed/entered in `America/Chicago`. Public tours are requests, with tentative ICS attachments when the existing inquiry notification is used; team confirmation is explicit. No external calendar invitation or synchronization is claimed.

Internal automation actions create real tasks or workspace notifications. Supported events include new contacts, inquiries, assignment changes, appointments, overdue follow-up dates, and contacts left new for 24 hours. Uncontacted reminders use a daily event key; follow-up reminders use the exact follow-up timestamp. Rule/event keys are transactional and unique. Delay controls the generated task's due offset, not a falsely advertised background delivery timer.

Set a random server-only `AUTOMATION_JOB_SECRET` of at least 32 characters and have your scheduler POST `/api/jobs/automations` with `Authorization: Bearer <secret>`. Alternatively, an administrator can run due checks at `/admin/automations`. **No recurring external scheduler or calendar service has been provisioned.**

## Data, media, analytics and launch content

Use Supabase and strong runtime secrets for shared operation. The JSON adapter is single-process development storage. Uploads enforce staff permissions, file size, supported MIME types, and matching signatures. Connected media URLs use the public Supabase hostname, while internal server traffic can use `SUPABASE_INTERNAL_URL`. Rebuild after changing the public storage URL.

Dashboard lead, appointment, task, conversation, source and conversion values come from actual records. Property-view counts use recorded `property_viewed` activities only. **A first-party property-view ingestion endpoint is not included; existing optional Vercel/GTM analytics do not automatically populate these activities.** No synthetic traffic is added. Provider delivery analytics and historical pipeline snapshots are also outside this implementation.

The existing fictional catalog, sample portraits, placeholder school/local statistics, social profile search links, and draft blog content remain clearly labeled. Licensed IDX credentials, verified brokerage assets/copy, production analytics IDs, approved retention/deletion procedures, accessibility review of all legacy public content, and a production performance audit remain launch work. Do not present the prototype's neighborhood figures, testimonials, or sample photography as verified business evidence.
