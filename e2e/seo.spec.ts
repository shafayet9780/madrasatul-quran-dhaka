import { expect, test } from '@playwright/test';
import { DEFAULT_SITE_URL } from '../src/lib/site-url';

for (const locale of ['bengali', 'english']) {
  for (const route of ['', '/admissions', '/curriculum']) {
    test(`${locale}${route || '/'} publishes localized SEO`, async ({
      page,
    }) => {
      const path = `/${locale}${route}`;
      const response = await page.request.get(path);
      expect(response.status()).toBe(200);
      // Check server output so correct language does not depend on hydration.
      expect(await response.text()).toMatch(
        new RegExp(`<html[^>]*lang="${locale === 'bengali' ? 'bn' : 'en'}"`)
      );
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute(
        'lang',
        locale === 'bengali' ? 'bn' : 'en'
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `${DEFAULT_SITE_URL}${path}`
      );
      await expect(page.locator('link[hreflang="bn-BD"]')).toHaveAttribute(
        'href',
        `${DEFAULT_SITE_URL}/bengali${route}`
      );
      await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
        'href',
        `${DEFAULT_SITE_URL}/english${route}`
      );
      await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute(
        'href',
        `${DEFAULT_SITE_URL}/bengali${route}`
      );
      const title = await page.title();
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        'content',
        title
      );
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        'content',
        `${DEFAULT_SITE_URL}${path}`
      );
      await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
        'content',
        locale === 'bengali' ? 'bn_BD' : 'en_US'
      );
      await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
        'content',
        title
      );
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        'content',
        `${DEFAULT_SITE_URL}/images/social/school.jpg`
      );
      await expect(
        page.locator('meta[name="google-site-verification"][content^="your-"]')
      ).toHaveCount(0);
      await expect(page.locator('main h1')).toHaveCount(1);
    });
  }
}
test('sitemap, robots and social image use public URLs and are reachable', async ({
  request,
}) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBe(true);
  const xml = await sitemap.text();
  expect(xml).toContain(`${DEFAULT_SITE_URL}/bengali/admissions`);
  expect(xml).toContain(`${DEFAULT_SITE_URL}/english/curriculum`);
  expect(xml).not.toContain('localhost');
  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBe(true);
  const text = await robots.text();
  expect(text).toContain(`Sitemap: ${DEFAULT_SITE_URL}/sitemap.xml`);
  expect(text).toContain('Disallow: /studio');
  expect(text).not.toContain('Disallow: /_next/');
  const image = await request.get('/images/social/school.jpg');
  expect(image.ok()).toBe(true);
  expect(image.headers()['content-type']).toMatch(/^image\/jpeg/);
});
