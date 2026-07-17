import { test, expect } from '@playwright/test';

const CONSENT_STORAGE_KEY = 'mq-analytics-consent-v1';

test.describe('analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.removeItem(key);
      sessionStorage.clear();
      (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
    }, CONSENT_STORAGE_KEY);
  });

  test('does not expose legacy gtag global', async ({ page }) => {
    await page.goto('/bengali');
    const hasGtag = await page.evaluate(() => typeof (window as Window & { gtag?: unknown }).gtag !== 'undefined');
    expect(hasGtag).toBe(false);
  });

  test('shows consent banner and pushes consent events to dataLayer', async ({ page }) => {
    await page.goto('/bengali?utm_source=google&gclid=raw-click-id&email=test@example.com');

    await page.waitForFunction(() => {
      const layer = (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer ?? [];
      return layer.some((entry) => entry.event === 'consent_default');
    });

    const acceptButton = page.getByRole('button', { name: /Accept all|সব গ্রহণ করুন/i });
    await expect(acceptButton.or(page.getByRole('button', { name: /Cookie preferences|কুকি পছন্দ/i }))).toBeVisible({
      timeout: 15_000,
    });

    const eventsBeforeAccept = await page.evaluate(() => {
      const layer = (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer ?? [];
      return layer.map((entry) => entry.event).filter(Boolean);
    });

    expect(eventsBeforeAccept).toContain('consent_default');

    if (await acceptButton.isVisible()) {
      await acceptButton.click();
    } else {
      await page.getByRole('button', { name: /Cookie preferences|কুকি পছন্দ/i }).click();
      await page.getByRole('button', { name: /Save preferences|পছন্দ সংরক্ষণ/i }).click();
    }

    await page.waitForFunction(() => {
      const layer = (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer ?? [];
      return layer.some((entry) => entry.event === 'consent_update');
    });

    await page.waitForFunction(() => {
      const layer = (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer ?? [];
      return layer.some((entry) => entry.event === 'page_view');
    });

    const pageViewPath = await page.evaluate(() => {
      const layer = (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer ?? [];
      return layer.find((entry) => entry.event === 'page_view')?.page_path;
    });

    expect(pageViewPath).toBe('/bengali?utm_source=google');

    const consentDefaultCount = await page.evaluate(() => {
      const layer = (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer ?? [];
      return layer.filter((entry) => entry.event === 'consent_default').length;
    });

    expect(consentDefaultCount).toBe(1);
  });

  test('privacy and cookie policy routes resolve in both locales', async ({ page }) => {
    for (const locale of ['bengali', 'english'] as const) {
      const privacy = await page.goto(`/${locale}/privacy-policy`);
      expect(privacy?.status()).toBeLessThan(400);
      await expect(page.locator('h1')).toContainText(/Privacy Policy|গোপনীয়তা নীতি/);

      const cookies = await page.goto(`/${locale}/cookie-policy`);
      expect(cookies?.status()).toBeLessThan(400);
      await expect(page.locator('h1')).toContainText(/Cookie Policy|কুকি নীতি/);
    }
  });

  test('contact form container is masked for Clarity', async ({ page }) => {
    await page.goto('/bengali/contact');
    await expect(page.locator('[data-clarity-mask="true"]').first()).toBeAttached({ timeout: 15_000 });
  });
});
