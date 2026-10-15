import { test, expect } from '@playwright/test';

for (const locale of ['english', 'bengali']) {
  test(`${locale} contact: calls, WhatsApp, emails, the map on request and the layout`, async ({ page }) => {
    await page.goto(`/${locale}/contact`);
    const main = page.locator('main');
    await expect(page.locator('h1')).toHaveText(locale === 'english' ? 'Contact' : 'যোগাযোগ');
    // No message form: calls and WhatsApp reach the office directly.
    await expect(main.locator('form')).toHaveCount(0);
    // The office's call button and one link per desk, the numbers in the page's digits.
    const calls = main.locator('a[href^="tel:+880"]');
    expect(await calls.count()).toBeGreaterThanOrEqual(2);
    const desk = main.locator('li a[href^="tel:+880"]').first();
    await expect(desk).toHaveText(locale === 'english' ? /01\d{3}-\d{6}/ : /০১[০-৯]{3}-[০-৯]{6}/);
    await expect(main.locator('a[href^="https://wa.me/880"]')).toHaveCount(2);
    expect(await main.locator('a[href^="mailto:"]').count()).toBeGreaterThanOrEqual(1);
    // Google's map loads only when asked for.
    await expect(main.locator('iframe')).toHaveCount(0);
    await main.getByRole('button', { name: locale === 'english' ? 'Show the map' : 'মানচিত্র দেখান' }).click();
    await expect(main.locator('iframe[src^="https://www.google.com/maps/embed"]')).toBeVisible();
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });
}
