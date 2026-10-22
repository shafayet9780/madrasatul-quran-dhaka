import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function expectNoSeriousAxe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

for (const locale of ['english', 'bengali']) {
  const en = locale === 'english';

  test(`${locale} campus: the day's text is in the page, and the stage follows the scroll`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/${locale}/campus`);
    const main = page.locator('main');
    await expect(page.locator('h1')).toHaveText(en ? 'A day at Madrasatul Quran' : 'মাদরাসাতুল কুরআনে একটি দিন');
    // The menu links to Campus after Curriculum.
    const menu = page.getByRole('navigation', { name: en ? 'Main' : 'প্রধান' }).first();
    await expect(menu.getByRole('link', { name: en ? 'Campus' : 'ক্যাম্পাস' })).toHaveAttribute('href', `/${locale}/campus`);

    // Every stop is ordinary text: a time, a heading and a line, the first heading the H1.
    const steps = main.locator('[data-step]');
    const n = await steps.count();
    expect(n).toBeGreaterThan(2);
    await expect(main.locator('[data-step] h2')).toHaveCount(n - 1);
    for (let i = 0; i < n; i++) await expect(steps.nth(i).locator('p').first()).not.toBeEmpty();

    // The stage only repeats the text, and starts at dawn on the first stop.
    const stage = main.locator('[data-stage]');
    await expect(stage).toHaveAttribute('aria-hidden', 'true');
    await expect(stage).toBeVisible();
    await expect(stage).toHaveAttribute('data-sky', 'dawn');
    await expect(steps.first()).toHaveAttribute('data-pos', 'now');
    // At the last stop it is night, and nobody is left in school.
    await steps.last().scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 400);
    await expect(steps.last()).toHaveAttribute('data-pos', 'now');
    await expect(stage).toHaveAttribute('data-sky', 'night');
    await expect(stage).toHaveAttribute('data-groups', '');
    await expect(steps.first()).toHaveAttribute('data-pos', 'past');

    // Come and see: directions and a call.
    await expect(main.getByRole('heading', { level: 2, name: en ? 'Come and see for yourself' : 'নিজে এসে দেখুন' })).toBeVisible();
    await expect(main.locator('a[href^="https://www.google.com/maps/dir/"]')).toHaveCount(1);
    await expect(main.locator('a[href^="tel:+880"]')).toHaveCount(1);

    await expectNoSeriousAxe(page);
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });
}

test('campus with reduced motion: no stage, each stop shows its own photos', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/bengali/campus', { waitUntil: 'networkidle' });
  await expect(page.locator('[data-stage]')).toBeHidden();
  const stills = page.locator('.cd-still img');
  await expect(stills.first()).toBeVisible();
  for (const alt of await stills.evaluateAll((imgs) => imgs.map((i) => i.getAttribute('alt')))) expect(alt).toBeTruthy();
  await expectNoSeriousAxe(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await context.close();
});
