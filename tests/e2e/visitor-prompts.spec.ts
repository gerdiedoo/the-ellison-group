import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('first visit opens an accessible welcome popup, and dismissal persists across reloads', async ({
  page,
}) => {
  await page.goto('/');
  const popup = page.getByRole('dialog', { name: 'Tailored Listings for You' });
  await expect(popup).toBeVisible();
  await page.screenshot({ path: 'test-results/visitor-welcome-desktop.png' });
  await expect(popup.getByRole('heading', { name: 'Tailored Listings for You' })).toBeFocused();
  const accessibility = await new AxeBuilder({ page }).include('.welcome-dialog').analyze();
  expect(accessibility.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(popup).not.toBeVisible();
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('ellison-welcome-v1')))
    .toBe('true');
  await expect(
    page.getByRole('complementary', { name: 'Pick up where you left off.' }),
  ).toBeVisible();
  await expect(popup).not.toBeVisible();
});

test('signup requires email and consent and persists a newsletter lead without phone or SMS consent', async ({
  page,
}) => {
  await page.goto('/?utm_source=welcome-qa');
  const popup = page.getByRole('dialog', { name: 'Tailored Listings for You' });
  await expect(popup).toBeVisible();
  const email = `welcome-${Date.now()}@example.com`;
  await popup.getByLabel('Email address', { exact: true }).fill(email);
  await popup.getByRole('button', { name: 'Submit', exact: true }).click();
  expect(
    await popup
      .locator('input[name="newsletter"]')
      .evaluate((input: HTMLInputElement) => input.validity.valueMissing),
  ).toBe(true);
  await popup.getByRole('checkbox').check();
  const saved = page.waitForResponse(
    (response) => response.url().endsWith('/api/leads') && response.request().method() === 'POST',
  );
  await popup.getByRole('button', { name: 'Submit', exact: true }).click();
  const response = await saved;
  expect(response.status(), await response.text()).toBe(201);
  const submitted = response.request().postDataJSON();
  expect(submitted).toMatchObject({
    email,
    source: 'newsletter',
    newsletter: true,
    email_phone: false,
    sms: false,
    trigger_source: 'first-visit:/',
  });
  await expect(popup.getByRole('status')).toContainText('You’re on the list.');
  await page.request.post('/api/auth', {
    data: { action: 'login', email: 'welcome-qa-admin@example.com', code: 'qa-admin-code' },
  });
  const snapshot = await (await page.request.get('/api/admin/platform')).json();
  const lead = snapshot.leads.find((row: { email: string }) => row.email === email);
  expect(lead).toMatchObject({ source: 'newsletter', utm: { utm_source: 'welcome-qa' } });
  expect(snapshot.consents.filter((row: { lead_id: string }) => row.lead_id === lead.id)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ channel: 'newsletter', granted: true }),
      expect.objectContaining({ channel: 'sms', granted: false }),
      expect.objectContaining({ channel: 'email_phone', granted: false }),
    ]),
  );
});

test('returning visitors see a dismissible sign-in recommendation with an honest demo fallback', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('ellison-welcome-v1', 'true'));
  await page.goto('/');
  const response = await page.request.get('/api/visitor-session');
  expect(response.headers()['cache-control']).toContain('no-store');
  expect(await response.json()).toEqual({ authenticated: false, google_enabled: false });
  const reminder = page.getByRole('complementary', { name: 'Pick up where you left off.' });
  await expect(reminder).toBeVisible();
  await page.screenshot({ path: 'test-results/visitor-sign-in-reminder.png' });
  await expect(reminder.getByRole('button', { name: 'Continue with Google' })).toBeDisabled();
  await expect(reminder).toContainText('Google sign-in is not connected yet.');
  await reminder.getByRole('button', { name: 'Dismiss sign-in reminder' }).click();
  await expect(reminder).not.toBeVisible();
  await page.reload();
  await page.waitForTimeout(9000);
  await expect(reminder).not.toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('ellison-sign-in-dismissed-v1'))).toBe(
    'true',
  );
});

test('signed-in visitors and account pages are not interrupted', async ({ page }) => {
  await page.goto('/home-search/account');
  await expect(page.getByRole('heading', { name: 'Welcome home.' })).toBeVisible();
  await page.waitForTimeout(2000);
  await expect(page.getByRole('dialog', { name: 'Tailored Listings for You' })).not.toBeVisible();
  await page.request.post('/api/auth', {
    data: { action: 'login', email: `visitor-${Date.now()}@example.com` },
  });
  await page.goto('/');
  expect(await (await page.request.get('/api/visitor-session')).json()).toMatchObject({
    authenticated: true,
  });
  await page.waitForTimeout(9000);
  await expect(page.locator('.welcome-dialog, .sign-in-reminder')).toHaveCount(0);
});

test('mobile popup fits the viewport and signup failures keep the form available for retry', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const popup = page.getByRole('dialog', { name: 'Tailored Listings for You' });
  await expect(popup).toBeVisible();
  const bounds = await popup.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.height).toBeLessThanOrEqual(844);
  await page.screenshot({ path: 'test-results/visitor-welcome-mobile.png' });
  await popup.getByLabel('Email address', { exact: true }).fill('retry@example.com');
  await popup.getByRole('checkbox').check();
  await page.route('**/api/leads', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Please try again shortly.' }),
    }),
  );
  await popup.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(popup.getByRole('alert')).toContainText('Please try again shortly.');
  await expect(popup.getByRole('button', { name: 'Submit', exact: true })).toBeEnabled();
});
