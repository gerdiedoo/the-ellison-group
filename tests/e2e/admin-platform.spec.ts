import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { randomUUID } from 'node:crypto';
import type { PlatformSnapshot } from '@/lib/platform/snapshot';
import type { Lead } from '@/lib/types';
const code = 'qa-admin-code';
let addressCounter = 10;
async function login(api: APIRequestContext, email = 'qa-admin@example.com') {
  const r = await api.post('/api/auth', {
    headers: { 'x-forwarded-for': `198.51.100.${addressCounter++}` },
    data: { action: 'login', email, code },
  });
  expect(r.status(), await r.text()).toBe(200);
}
async function snapshot(api: APIRequestContext): Promise<PlatformSnapshot> {
  const r = await api.get('/api/admin/platform');
  expect(r.status()).toBe(200);
  return r.json() as Promise<PlatformSnapshot>;
}
async function command(
  api: APIRequestContext,
  action: string,
  values?: unknown,
  id?: string,
  request_id?: string,
) {
  const r = await api.post('/api/admin/platform', { data: { action, values, id, request_id } });
  expect(r.ok(), await r.text()).toBeTruthy();
  return r.json() as Promise<{ id: string; success: boolean }>;
}
const editLead = (l: Lead) => ({
  first_name: l.first_name,
  last_name: l.last_name,
  email: l.email,
  phone: l.phone,
  stage_id: l.stage_id,
  assigned_to: l.assigned_to,
  priority: l.priority,
  tags: l.tags,
  follow_up_at: l.follow_up_at,
});
async function dismissCookies(page: Page) {
  // These workspace scenarios use a returning visitor; onboarding has its own suite.
  await page.evaluate(() => {
    localStorage.setItem('ellison-welcome-v1', 'true');
    sessionStorage.setItem('ellison-sign-in-dismissed-v1', 'true');
  });
  const welcome = page.getByRole('button', { name: 'Close welcome popup', exact: true });
  if (await welcome.isVisible()) await welcome.click();
  const b = page.getByRole('button', { name: 'Essential only', exact: true });
  if (await b.isVisible()) await b.click();
}
test('authentication rejects missing staff codes, visitors and cross-origin mutations', async ({
  page,
  browser,
}) => {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Team access', exact: true })).toBeVisible();
  await page.getByLabel('Email address', { exact: true }).fill('qa-admin@example.com');
  await page.getByLabel('Demo team access code').fill(code);
  await page.getByRole('button', { name: 'Try the demo portal', exact: true }).click();
  await expect(page.locator('.workspace-sidebar')).toBeVisible();
  const response = await page.request.post('/api/admin/platform', {
    headers: { origin: 'https://untrusted.example' },
    data: { action: 'run_automations' },
  });
  expect(response.status()).toBe(403);
  const other = await browser.newContext(),
    api = other.request;
  const anonymousSession = await api.get('/api/auth');
  expect(await anonymousSession.json()).toEqual({ authenticated: false });
  expect(anonymousSession.headers()['cache-control']).toContain('no-store');
  expect((await api.get('/api/portal/homes')).status()).toBe(401);
  const denied = await api.post('/api/auth', {
    data: { action: 'login', email: 'qa-admin@example.com' },
  });
  expect(denied.status()).toBe(403);
  const visitor = await api.post('/api/auth', {
    data: { action: 'login', email: 'ordinary-visitor@example.com' },
  });
  expect(visitor.status()).toBe(200);
  expect(await (await api.get('/api/auth')).json()).toEqual({ authenticated: true });
  expect((await api.get('/api/admin/platform')).status()).toBe(403);
  await other.close();
});
test('property editor creates a draft, orders photos, publishes and synchronizes the public detail', async ({
  page,
}) => {
  await login(page.request);
  await page.goto('/admin/listings/new');
  await page.getByLabel('Property title', { exact: true }).fill('A thoughtfully tested home');
  await page.getByLabel('Street address', { exact: true }).fill('104 QA Garden Lane');
  await page.getByLabel('Public URL slug').fill('qa-garden-lane');
  await page.getByLabel('Listing price ($)', { exact: true }).fill('615000');
  await page.getByLabel('Living area (sq.ft.)', { exact: true }).fill('2450');
  await page
    .getByLabel('Description', { exact: true })
    .fill('QA garden residence with a covered terrace and a carefully verified gallery.');
  await page.getByRole('tab', { name: 'Photography', exact: true }).click();
  await page.getByRole('button', { name: 'Add a clearly labeled demo image' }).click();
  await page.getByRole('button', { name: 'Add a clearly labeled demo image' }).click();
  await page.getByLabel('Caption / alt text').nth(0).fill('First garden photograph');
  await page.getByLabel('Caption / alt text').nth(1).fill('Second garden photograph');
  await page.getByRole('button', { name: 'Make primary', exact: true }).nth(1).click();
  const rejected = await page.request.post('/api/admin/upload', {
    multipart: {
      bucket: 'listing-photos',
      file: {
        name: 'disguised.png',
        mimeType: 'image/png',
        buffer: Buffer.from('<html>not an image</html>'),
      },
    },
  });
  expect(rejected.status()).toBe(400);
  await page.getByLabel('Upload property photography').setInputFiles({
    name: 'qa-photo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jGZkAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await expect(page.getByLabel('Caption / alt text')).toHaveCount(3);
  await page.getByRole('button', { name: 'Create property', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/listings\/[0-9a-f-]{36}$/);
  let data = await snapshot(page.request),
    row = data.listings.find((l) => l.slug === 'qa-garden-lane')!;
  expect(row.publication_status).toBe('draft');
  expect(row.listing_photos[0].caption).toBe('Second garden photograph');
  // Next streams notFound() after the public shell; assert denied content rather than a status code.
  const draftResponse = await page.request.get(`/properties/${row.slug}`);
  expect((await draftResponse.text()).includes(row.description)).toBe(false);
  expect(await draftResponse.text()).toContain('A little off the beaten path');
  await page.getByRole('combobox', { name: 'Visibility', exact: true }).selectOption('published');
  await page.getByRole('button', { name: 'Save property', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Saved. Your workspace is up to date.' }),
  ).toBeVisible();
  data = await snapshot(page.request);
  row = data.listings.find((l) => l.id === row.id)!;
  expect(row.publication_status).toBe('published');
  await page.goto(`/properties/${row.slug}`);
  await dismissCookies(page);
  await expect(page.getByRole('heading', { name: row.address_line, exact: true })).toBeVisible();
  await expect(page.getByText(row.description, { exact: true })).toBeVisible();
  expect((await page.request.get(`/home-search/listings/${row.slug}`)).status()).toBe(200);
});
test('public inquiries deduplicate normalized email across properties; CRM assignment and pipeline persist', async ({
  page,
  browser,
}) => {
  await login(page.request);
  let data = await snapshot(page.request);
  const first = data.listings.find((l) => l.slug === 'qa-garden-lane')!,
    second = data.catalog.find((l) => l.id !== first.id)!;
  const visitor = await browser.newContext(),
    view = await visitor.newPage();
  await view.goto(`/properties/${first.slug}`);
  await dismissCookies(view);
  await view.getByRole('button', { name: 'CONTACT AGENT', exact: true }).click();
  const dialog = view.getByRole('dialog', { name: 'Leave a Message' });
  await dialog.getByLabel('First name *', { exact: true }).fill('Avery');
  await dialog.getByLabel('Last name', { exact: true }).fill('QA');
  await dialog.getByLabel('Email *', { exact: true }).fill('Avery.QA@Example.com');
  await dialog.getByLabel('Phone', { exact: true }).fill('(501) 555-0149');
  await dialog.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'Thank you.', exact: true })).toBeVisible();
  const duplicate = await view.request.post('/api/leads', {
    data: {
      source: 'agent',
      first_name: 'Avery',
      email: ' avery.qa@EXAMPLE.COM ',
      listing_id: second.id,
      trigger_source: `/properties/${second.slug}`,
      message: 'A second property of interest.',
    },
  });
  expect(duplicate.status(), await duplicate.text()).toBe(201);
  data = await snapshot(page.request);
  const matches = data.leads.filter((l) => l.email === 'avery.qa@example.com');
  expect(matches).toHaveLength(1);
  const lead = matches[0];
  expect(data.links.filter((p) => p.lead_id === lead.id)).toHaveLength(2);
  await page.goto(`/admin/leads/${lead.id}`);
  await page
    .getByRole('combobox', { name: 'Pipeline stage', exact: true })
    .selectOption(data.stages.find((s) => s.name === 'Qualified')!.id);
  await page.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('high');
  await page
    .getByRole('combobox', { name: 'Assigned staff', exact: true })
    .selectOption(data.user.id);
  await page.getByLabel('Tags, separated by commas').fill('QA verified, Hillcrest');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved.' })).toBeVisible();
  data = await snapshot(page.request);
  const saved = data.leads.find((l) => l.id === lead.id)!;
  expect(saved.priority).toBe('high');
  expect(saved.assigned_to).toBe(data.user.id);
  expect(saved.tags).toContain('QA verified');
  expect(data.activities.some((a) => a.lead_id === lead.id && a.kind === 'stage_changed')).toBe(
    true,
  );
  await page.getByRole('tab', { name: 'Activity', exact: true }).click();
  await page.getByLabel('Add a personal note').fill('A private, verified follow-up note.');
  await page.getByRole('button', { name: 'Add internal note', exact: true }).click();
  await expect(
    page.locator('.activity-timeline').getByText('A private, verified follow-up note.'),
  ).toBeVisible();
  await visitor.close();
});
test('tasks, appointments, actual metrics and observable automations work without fabricated delivery', async ({
  page,
}) => {
  await login(page.request);
  let data = await snapshot(page.request);
  const lead = data.leads.find((l) => l.email === 'avery.qa@example.com') || data.leads[0];
  const starts = new Date(Date.now() + 2 * 86400000).toISOString(),
    ends = new Date(Date.parse(starts) + 1800000).toISOString();
  const appointment = await command(page.request, 'appointment_save', {
    lead_id: lead.id,
    listing_id: lead.listing_id,
    assigned_to: data.user.id,
    starts_at: starts,
    ends_at: ends,
    kind: 'tour',
    meeting_type: 'in_person',
    status: 'requested',
    notes: 'QA requested tour',
  });
  const conflict = await page.request.post('/api/admin/platform', {
    data: {
      action: 'appointment_save',
      values: {
        lead_id: lead.id,
        listing_id: lead.listing_id,
        assigned_to: data.user.id,
        starts_at: starts,
        ends_at: ends,
        kind: 'tour',
        meeting_type: 'in_person',
        status: 'confirmed',
        notes: '',
      },
    },
  });
  expect(conflict.status()).toBe(409);
  await command(
    page.request,
    'appointment_save',
    {
      lead_id: lead.id,
      listing_id: lead.listing_id,
      assigned_to: data.user.id,
      starts_at: starts,
      ends_at: ends,
      kind: 'tour',
      meeting_type: 'video',
      status: 'confirmed',
      notes: 'Updated and confirmed in the workspace',
    },
    appointment.id,
  );
  await command(page.request, 'task_save', {
    title: 'Call Avery about the garden residence',
    lead_id: lead.id,
    listing_id: lead.listing_id,
    assigned_to: data.user.id,
    due_at: new Date(Date.now() - 3600000).toISOString(),
    status: 'open',
    notes: 'QA follow-up',
  });
  await command(page.request, 'rule_save', {
    name: 'QA due follow-up',
    event: 'follow_up_due',
    enabled: true,
    action: 'create_task',
    delay_hours: 1,
    task_title: 'QA automation task',
    assigned_to: data.user.id,
  });
  await command(
    page.request,
    'lead_save',
    { ...editLead(lead), follow_up_at: new Date(Date.now() - 3600000).toISOString() },
    lead.id,
  );
  await command(page.request, 'run_automations');
  await command(page.request, 'run_automations');
  data = await snapshot(page.request);
  expect(data.tasks.filter((t) => t.title === 'QA automation task')).toHaveLength(1);
  expect(data.appointments.find((a) => a.id === appointment.id)?.status).toBe('confirmed');
  await page.goto('/admin/tasks');
  await expect(
    page.getByText('Call Avery about the garden residence', { exact: true }),
  ).toBeVisible();
  await page.goto('/admin/analytics');
  await page.getByLabel('Report date range').selectOption('all');
  await expect(
    page.getByRole('heading', { name: 'How these numbers are calculated', exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('.workspace-metric').filter({ hasText: 'New connections' }).locator('strong'),
  ).toHaveText(String(data.leads.length));
  await page.goto('/admin/communications');
  await expect(page.getByText('Provider accepted', { exact: false })).toHaveCount(0);
});
test('chat failure is honest, human takeover persists, private notes and other visitor sessions stay isolated', async ({
  page,
  browser,
}) => {
  await login(page.request);
  const visitor = await browser.newContext(),
    view = await visitor.newPage();
  const r = await view.request.post('/api/chat', {
    data: {
      action: 'message',
      message: 'Is there a garden home near Hillcrest?',
      request_id: randomUUID(),
    },
  });
  expect(r.status()).toBe(503);
  const chat = (await r.json()) as {
    conversation: { id: string };
    messages: { role: string; body: string }[];
  };
  expect(chat.messages.some((m) => m.role === 'assistant')).toBe(false);
  expect(chat.messages[0].body).toContain('garden home');
  const duplicate = await browser.newContext();
  expect(
    (await duplicate.request.get(`/api/chat?conversation_id=${chat.conversation.id}`)).status(),
  ).toBe(404);
  await view.goto('/');
  await dismissCookies(view);
  await view
    .getByRole('button', { name: "Let's talk — open conversation with The Ellison Group" })
    .click();
  await expect(view.getByText('AI unavailable · questions are saved for our team')).toBeVisible();
  await view.getByRole('button', { name: 'Request a person', exact: true }).click();
  await expect(view.getByText('Human follow-up requested · replies appear here')).toBeVisible();
  await view.getByRole('button', { name: 'Share contact details ↗', exact: true }).click();
  const contact = view.locator('.chat-contact');
  await contact.getByLabel('First name *', { exact: true }).fill('Chat');
  await contact.getByLabel('Last name', { exact: true }).fill('Visitor');
  await contact.getByLabel('Email *', { exact: true }).fill('chat.visitor.qa@example.com');
  await contact.getByRole('button', { name: 'Share my details', exact: true }).click();
  await expect(view.getByText('Your details have been saved for the team.')).toBeVisible();
  const captured = await snapshot(page.request);
  const linkedLead = captured.leads.find((l) => l.email === 'chat.visitor.qa@example.com');
  expect(linkedLead).toBeTruthy();
  expect(captured.conversations.find((c) => c.id === chat.conversation.id)?.lead_id).toBe(
    linkedLead!.id,
  );
  await command(
    page.request,
    'conversation_reply',
    { body: 'Private note: do not show the visitor.', is_internal: true },
    chat.conversation.id,
    randomUUID(),
  );
  await command(
    page.request,
    'conversation_reply',
    { body: 'Hello, I can help you explore the garden residence.', is_internal: false },
    chat.conversation.id,
    randomUUID(),
  );
  const transcript = await (
    await view.request.get(`/api/chat?conversation_id=${chat.conversation.id}`)
  ).text();
  expect(transcript).toContain('Hello, I can help');
  expect(transcript).not.toContain('Private note');
  await page.goto(`/admin/conversations/${chat.conversation.id}`);
  await expect(
    page.getByText('Private note: do not show the visitor.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Hello, I can help you explore the garden residence.', { exact: true }),
  ).toBeVisible();
  await duplicate.close();
  await visitor.close();
});
test('configurable detail and save gates validate fields, persist a lead and resume the journey', async ({
  page,
  browser,
}) => {
  await login(page.request);
  const data = await snapshot(page.request),
    listing = data.listings.find((l) => l.slug === 'qa-garden-lane') || data.catalog[0],
    assistant = data.settings.assistant;
  const capture = {
    enabled: true,
    property_ids: [listing.id],
    detail_mode: 'immediate',
    allow_basic_browsing: true,
    actions: ['save'],
    required_fields: ['full_name', 'email', 'phone'],
    google_enabled: false,
  };
  await command(page.request, 'platform_settings', { lead_capture: capture, assistant });
  const visitor = await browser.newContext(),
    view = await visitor.newPage();
  await view.goto(`/properties/${listing.slug}`);
  await dismissCookies(view);
  await expect(
    view.getByRole('heading', { name: "Let's take the next step.", exact: true }),
  ).toBeVisible();
  expect(await view.content()).not.toContain(listing.description);
  const missing = await view.request.post('/api/leads', {
    data: {
      source: 'agent',
      first_name: 'Gate',
      email: 'gate@example.com',
      listing_id: listing.id,
      gate_action: 'detail',
    },
  });
  expect(missing.status()).toBe(400);
  await view.getByLabel('First name *', { exact: true }).fill('Gate');
  await view.getByLabel('Email *', { exact: true }).fill('gate.qa@example.com');
  await view.getByLabel('Phone', { exact: true }).fill('5015550188');
  await view.getByRole('button', { name: 'Continue to the property', exact: true }).click();
  await expect(view.getByText(listing.description, { exact: true })).toBeVisible();
  await expect(
    view.getByRole('heading', { name: "Let's take the next step.", exact: true }),
  ).toHaveCount(0);
  await command(page.request, 'platform_settings', {
    lead_capture: { ...capture, detail_mode: 'action' },
    assistant,
  });
  const soft = await browser.newContext(),
    softPage = await soft.newPage();
  await softPage.goto(`/properties/${listing.slug}`);
  await dismissCookies(softPage);
  await softPage.locator('.save-detail button').click();
  const dialog = softPage.getByRole('dialog', { name: 'A little closer to home' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('First name *', { exact: true }).fill('Saved');
  await dialog.getByLabel('Email *', { exact: true }).fill('saved.qa@example.com');
  await dialog.getByLabel('Phone', { exact: true }).fill('5015550199');
  await dialog.getByRole('button', { name: 'Continue to the property', exact: true }).click();
  await expect(softPage.locator('.save-detail button')).toHaveAttribute('aria-pressed', 'true');
  expect(await softPage.evaluate(() => localStorage.getItem('ellison-homes'))).toContain(
    listing.id,
  );
  await command(page.request, 'platform_settings', {
    lead_capture: { ...capture, enabled: false, actions: [] },
    assistant,
  });
  await soft.close();
  await visitor.close();
});
test('assigned agent access cannot cross contact, conversation, content or export boundaries', async ({
  page,
  browser,
}) => {
  await login(page.request);
  const data = await snapshot(page.request);
  const own = data.leads.find((l) => l.email === 'avery.qa@example.com')!,
    other = data.leads.find((l) => l.id !== own.id)!;
  const staff = await command(page.request, 'team_save', {
    email: 'qa-agent@example.com',
    full_name: 'QA Assigned Agent',
    role: 'agent',
    agent_id: data.agents[0].id,
  });
  await command(page.request, 'lead_save', { ...editLead(own), assigned_to: staff.id }, own.id);
  const agent = await browser.newContext();
  await login(agent.request, 'qa-agent@example.com');
  const scoped = await snapshot(agent.request);
  expect(scoped.user.role).toBe('agent');
  expect(scoped.leads.some((l) => l.id === own.id)).toBe(true);
  expect(scoped.leads.some((l) => l.id === other.id)).toBe(false);
  expect(scoped.profiles).toHaveLength(1);
  expect(
    (
      await agent.request.post('/api/admin/platform', {
        data: { action: 'lead_save', id: other.id, values: editLead(other) },
      })
    ).status(),
  ).toBe(404);
  expect((await agent.request.get('/api/admin/site_settings')).status()).toBe(403);
  const csv = await (await agent.request.get('/api/admin/leads?format=csv')).text();
  expect(csv).toContain(own.email);
  expect(csv).not.toContain(other.email);
  const noSettings = await agent.request.post('/api/admin/platform', {
    data: { action: 'platform_settings', values: data.settings },
  });
  expect(noSettings.status()).toBe(403);
  await agent.close();
});
test('campaign pages persist attribution and templates; eligible draft deletion and archiving preserve history', async ({
  page,
  browser,
}) => {
  await login(page.request);
  let data = await snapshot(page.request);
  const property = data.listings.find((l) => l.slug === 'qa-garden-lane') || data.catalog[0];
  const template = await command(page.request, 'template_save', {
    name: 'QA Personal introduction',
    channel: 'email',
    subject: 'A personal hello',
    body: 'Hello {{first_name}}, how can we help?',
  });
  expect((await snapshot(page.request)).templates.some((t) => t.id === template.id)).toBe(true);
  const campaign = await command(page.request, 'campaign_save', {
    name: 'A garden chapter',
    slug: 'qa-garden-campaign',
    status: 'active',
    utm_source: 'qa-newsletter',
    utm_medium: 'email',
    utm_campaign: 'qa-garden',
    description: 'A thoughtful invitation to explore a real record in this prototype.',
    listing_id: property.id,
  });
  expect(campaign.id).toBeTruthy();
  const visitor = await browser.newContext(),
    view = await visitor.newPage();
  await view.goto(
    '/campaign/qa-garden-campaign?utm_source=qa-newsletter&utm_campaign=qa-garden&access_token=should-never-be-stored',
  );
  await dismissCookies(view);
  await expect(view.getByRole('heading', { name: 'A garden chapter', exact: true })).toBeVisible();
  await view.getByLabel('First name *', { exact: true }).fill('Campaign');
  await view.getByLabel('Email *', { exact: true }).fill('campaign.qa@example.com');
  await view.getByRole('button', { name: 'Connect with the team', exact: true }).click();
  await expect(view.getByRole('heading', { name: 'Thank you.', exact: true })).toBeVisible();
  data = await snapshot(page.request);
  const lead = data.leads.find((l) => l.email === 'campaign.qa@example.com')!;
  expect(lead.utm).toMatchObject({
    utm_source: 'qa-newsletter',
    utm_medium: 'email',
    utm_campaign: 'qa-garden',
  });
  expect(lead.utm).not.toHaveProperty('access_token');
  expect(data.links.some((p) => p.lead_id === lead.id && p.listing_id === property.id)).toBe(true);
  const suffix = randomUUID().slice(0, 8),
    draft = await command(page.request, 'listing_save', {
      ...property,
      title: 'QA disposable draft',
      address_line: '208 Draft QA Way',
      mls_id: `QA-DRAFT-${suffix}`,
      slug: `qa-draft-${suffix}`,
      publication_status: 'draft',
      raw: { demo: true },
    });
  expect(
    (
      await page.request.post('/api/admin/platform', {
        data: { action: 'listing_delete', id: draft.id, values: { confirmation: 'wrong address' } },
      })
    ).status(),
  ).toBe(400);
  await command(page.request, 'listing_delete', { confirmation: '208 Draft QA Way' }, draft.id);
  expect((await snapshot(page.request)).listings.some((l) => l.id === draft.id)).toBe(false);
  const archive = await command(page.request, 'listing_save', {
    ...property,
    title: 'QA archive fixture',
    address_line: '209 Archive QA Way',
    mls_id: `QA-ARCHIVE-${suffix}`,
    slug: `qa-archive-${suffix}`,
    publication_status: 'published',
    raw: { demo: true },
  });
  await command(page.request, 'listing_archive', {}, archive.id);
  data = await snapshot(page.request);
  expect(data.listings.find((l) => l.id === archive.id)?.publication_status).toBe('archived');
  expect(data.catalog.some((l) => l.id === archive.id)).toBe(false);
  await view.setViewportSize({ width: 390, height: 844 });
  await view.reload();
  expect(await view.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  await view.screenshot({ path: 'test-results/campaign-mobile.png', fullPage: true });
  await visitor.close();
});
test('major modules, search, pagination, mobile navigation and accessibility remain usable', async ({
  page,
  browser,
}) => {
  await login(page.request);
  const initial = await snapshot(page.request);
  if (initial.leads.length === 0) {
    const created = await command(page.request, 'lead_create', {
      first_name: 'Mobile',
      last_name: 'QA',
      email: 'mobile.qa@example.com',
      phone: '',
      message: 'Isolated responsive fixture',
    });
    const l = (await snapshot(page.request)).leads.find((l) => l.id === created.id)!;
    await command(
      page.request,
      'lead_save',
      { ...editLead(l), stage_id: initial.stages[2].id },
      l.id,
    );
  }
  await page.goto('/admin/listings');
  await expect(
    page.getByRole('heading', { name: 'Property inventory', exact: true }),
  ).toBeVisible();
  const before = await page.locator('.workspace-table tbody').innerText();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  expect(await page.locator('.workspace-table tbody').innerText()).not.toBe(before);
  await page.getByLabel('Search properties').fill(initial.listings[0].address_line);
  await expect(page.locator('.workspace-table tbody tr')).toHaveCount(1);
  for (const route of [
    'leads',
    'conversations',
    'appointments',
    'tasks',
    'communications',
    'marketing',
    'analytics',
    'automations',
    'team',
    'settings',
    'agents',
    'blog_posts',
    'site_settings',
  ]) {
    await page.goto(`/admin/${route}`);
    await expect(page.locator('.workspace-heading h1')).toBeVisible();
    await expect(page.getByText('404', { exact: true })).toHaveCount(0);
  }
  await page.goto('/admin');
  const desktop = await new AxeBuilder({ page })
    .include('.workspace')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    desktop.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
  await page.screenshot({ path: 'test-results/admin-overview-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/leads');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  await page.getByRole('button', { name: 'Open workspace navigation' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('link', { name: 'Properties', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/listings$/);
  await page.screenshot({ path: 'test-results/admin-properties-mobile.png', fullPage: true });
  const mobile = await new AxeBuilder({ page })
    .include('.workspace')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(mobile.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
    [],
  );
  const basic = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const home = await basic.newPage();
  await home.goto('/');
  await expect(home.locator('.home-hero:visible h1')).toBeVisible();
  await expect(home.locator('.hero-photo:visible')).toBeVisible();
  await expect(home.locator('head meta[name="description"]')).toHaveCount(1);
  await home.screenshot({ path: 'test-results/public-home-mobile.png' });
  await basic.close();
});
