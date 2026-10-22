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

// The old Programs and News pages are gone: Programs leads to the curriculum, News to the notice board (home while it is off).
test('old Programs and News links lead to their new pages', async ({ page }) => {
  await page.goto('/english/programs');
  await expect(page).toHaveURL(/\/english\/curriculum$/);
  await page.goto('/bengali/news/some-old-article');
  await expect(page).toHaveURL(/\/bengali(\/notices)?$/);
});

// An unknown address, or a missing profile or article, gets the site's 404 page inside the header and footer.
for (const [path, heading] of [
  ['/bengali/no-such-page', 'পেজটি পাওয়া যায়নি'],
  ['/english/teachers/no-such-teacher', "This page isn't here"],
]) {
  test(`${path} shows the 404 page`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText(heading);
    await expect(page.getByRole('link', { name: /হোম পেজে যান|Go to the home page/ })).toBeVisible();
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
