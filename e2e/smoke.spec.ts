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

test('a content detail route renders (programs)', async ({ page }) => {
  const res = await page.goto('/english/programs');
  expect(res?.status()).toBeLessThan(400);
  await expect(page.locator('body')).not.toBeEmpty();
});

test('studio route loads without an application error', async ({ page }) => {
  const res = await page.goto('/studio');
  expect(res?.status()).toBeLessThan(400);
  await expect(page.getByText('Application error')).toHaveCount(0);
});
