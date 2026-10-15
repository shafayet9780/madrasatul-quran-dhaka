import { test, expect } from '@playwright/test';

for (const locale of ['english', 'bengali']) {
  const en = locale === 'english';

  test(`${locale} about: the chairman alone at the top, the board, the advisors`, async ({ page }) => {
    await page.goto(`/${locale}/about`);
    const main = page.locator('main');
    await expect(page.locator('h1')).toHaveText(en ? 'About us' : 'আমাদের সম্পর্কে');
    // The menu has one About us link, no Our people dropdown.
    const menu = page.getByRole('navigation', { name: en ? 'Main' : 'প্রধান' }).first();
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(menu.getByRole('link', { name: en ? 'About us' : 'আমাদের সম্পর্কে' })).toBeVisible();
    await expect(menu.getByRole('button')).toHaveCount(0);
    // The chairman's band comes before the board, and links to his profile.
    const sections = main.locator('section');
    await expect(sections.nth(1).locator('h2')).toBeVisible();
    await expect(sections.nth(1).getByRole('link', { name: en ? 'Full message and profile' : 'পূর্ণ বাণী ও পরিচিতি' })).toHaveAttribute('href', new RegExp(`^/${locale}/directors/`));
    await expect(main.locator('#board h2')).toHaveText(en ? 'Board of directors' : 'পরিচালনা পর্ষদ');
    expect(await main.locator('#board li img').count()).toBeGreaterThan(0);
    await expect(main.locator('#advisors h2')).toHaveText(en ? 'Advisors' : 'উপদেষ্টাবৃন্দ');
    expect(await main.locator('#advisors li').count()).toBeGreaterThan(0);
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });

  test(`${locale} about: the old directors and advisors pages redirect`, async ({ page }) => {
    await page.goto(`/${locale}/directors`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/about#board$`));
    await page.goto(`/${locale}/advisors`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/about#advisors$`));
  });

  test(`${locale} profile: the chairman's page, its biography headings without emoji`, async ({ page }) => {
    await page.goto(`/${locale}/about`);
    await page.getByRole('link', { name: en ? 'Full message and profile' : 'পূর্ণ বাণী ও পরিচিতি' }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/directors/`));
    const main = page.locator('main');
    await expect(main.locator('h1')).toBeVisible();
    await expect(main.getByRole('heading', { level: 2, name: en ? 'Biography' : 'জীবনী' })).toBeVisible();
    const headings = await main.locator('h3').allTextContents();
    expect(headings.length).toBeGreaterThan(0);
    expect(headings.some((h) => /\p{Extended_Pictographic}/u.test(h))).toBe(false);
    await expect(main.getByRole('link', { name: en ? 'About us' : 'আমাদের সম্পর্কে' }).first()).toHaveAttribute('href', `/${locale}/about`);
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });
}
