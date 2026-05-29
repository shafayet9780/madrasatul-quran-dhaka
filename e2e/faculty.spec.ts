import { test, expect } from '@playwright/test';

for (const locale of ['bengali', 'english']) {
  test(`${locale} directors list renders`, async ({ page }) => {
    const res = await page.goto(`/${locale}/directors`);
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test(`${locale} teachers list renders with filter bar`, async ({ page }) => {
    const res = await page.goto(`/${locale}/teachers`);
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('input[type="search"]')).toBeVisible();
  });
}

test('unknown director slug returns 404', async ({ page }) => {
  const res = await page.goto('/english/directors/no-such-director-xyz');
  expect(res?.status()).toBe(404);
});

test('unknown teacher slug returns 404', async ({ page }) => {
  const res = await page.goto('/english/teachers/no-such-teacher-xyz');
  expect(res?.status()).toBe(404);
});
