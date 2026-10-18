import { test, expect } from '@playwright/test';

test('root redirects to the default (bengali) locale', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/bengali(\/|$)/);
});

test('bengali home renders with chrome', async ({ page }) => {
  const res = await page.goto('/bengali');
  expect(res?.status()).toBeLessThan(400);
  await expect(page.locator('header, nav').first()).toBeVisible();
  await expect(page.locator('body')).not.toBeEmpty();
});

test('english home renders with chrome', async ({ page }) => {
  const res = await page.goto('/english');
  expect(res?.status()).toBeLessThan(400);
  await expect(page.locator('header, nav').first()).toBeVisible();
});

test('language toggle: both locale homes are reachable and differ in URL', async ({
  page,
}) => {
  await page.goto('/bengali');
  await expect(page).toHaveURL(/\/bengali(\/|$)/);
  await page.goto('/english');
  await expect(page).toHaveURL(/\/english(\/|$)/);
});

// The old-design pages stay out of search until they are redesigned. Programs also follows its Site Settings switch.
for (const path of ['/english/programs', '/bengali/news']) {
  test(`${path} is kept out of search`, async ({ page }) => {
    const res = await page.request.get(path);
    if (path.endsWith('/programs') && res.status() === 404) return;
    expect(res.status()).toBe(200);
    expect(await res.text()).toMatch(/<meta name="robots" content="noindex/);
  });
}

test('studio route loads without an application error', async ({ page }) => {
  const res = await page.goto('/studio');
  expect(res?.status()).toBeLessThan(400);
  await expect(page.getByText('Application error')).toHaveCount(0);
});

test('pre-admission form page renders', async ({ page }) => {
  const res = await page.goto('/bengali/pre-admission');
  expect(res?.status()).toBeLessThan(400);
  await expect(page.getByText('Application error')).toHaveCount(0);
  await expect(page.locator('main').first()).toBeVisible();
});
