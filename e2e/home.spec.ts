import { expect, test } from '@playwright/test';
import bengali from '../messages/bengali.json';
import english from '../messages/english.json';

// The 2027 homepage: every section in canvas order, the FAQ (native details + FAQPage JSON-LD), and no sideways
// scroll on a phone. Guardian reviews appear only with recorded consent, so that section is not required here.
for (const [locale, m] of [['bengali', bengali], ['english', english]] as const) {
  const h = m.home;
  test.describe(`${locale} homepage`, () => {
    test('shows the sections in order', async ({ page }) => {
      await page.goto(`/${locale}`);
      const headings = await page.locator('h1, h2').allTextContents();
      const want = [h.day.title, h.campus.title, h.why.title, h.founder.title, h.faq.title];
      const at = want.map((w) => headings.findIndex((x) => x.replace(/\u2060/g, '').includes(w.replace(/\u2060/g, ''))));
      expect(at.every((i) => i >= 0), `missing: ${want.filter((_, i) => at[i] < 0).join(', ')}`).toBe(true);
      expect([...at].sort((a, b) => a - b)).toEqual(at);
    });

    test('FAQ answers are in the page and its structured data matches', async ({ page }) => {
      await page.goto(`/${locale}`);
      const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
      const faq = ld.map((s) => JSON.parse(s)).find((d) => d['@type'] === 'FAQPage');
      expect(faq).toBeTruthy();
      const summaries = page.locator('details > summary');
      await expect(summaries).toHaveCount(faq.mainEntity.length);
      expect(await page.locator('details').first().getAttribute('open')).not.toBeNull();
      const second = page.locator('details').nth(1);
      await second.locator('summary').click();
      await expect(second).toHaveAttribute('open', '');
      await expect(second.locator('p')).toHaveText(faq.mainEntity[1].acceptedAnswer.text);
    });

    test('fits a 360px phone without sideways scroll', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(`/${locale}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    });
  });
}
