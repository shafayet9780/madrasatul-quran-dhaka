import { test, expect } from '@playwright/test';

for (const locale of ['english', 'bengali']) {
  for (const route of ['admissions', 'curriculum']) {
    test(`${locale} ${route}: navigation, honest fees and responsive layout`, async ({
      page,
    }) => {
      await page.goto(`/${locale}/${route}`);
      const navigation = page.getByRole('navigation', {
        name: locale === 'english' ? 'On this page' : 'এই পৃষ্ঠায়',
      });
      await expect(navigation).toBeVisible();
      await navigation.locator('a[href="#fees"]').click();
      await expect(page).toHaveURL(/#fees$/);
      await expect(page.locator('#fees')).toBeVisible();
      await expect(page.locator('main')).not.toContainText(
        /Annual Total|Estimated Annual|Admission Calendar 2025|Send Inquiry/
      );
      for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
          )
        ).toBe(true);
      }
      const links = await page
        .locator('main a[href^="/"]')
        .evaluateAll(elements => elements.map(e => e.getAttribute('href')));
      expect(links.every(href => href?.startsWith(`/${locale}/`))).toBe(true);
      if (route === 'curriculum') {
        await page.setViewportSize({ width: 390, height: 844 });
        const first = page.locator('#study-plan details').first();
        await first.locator('summary').focus();
        await page.keyboard.press('Enter');
        await expect(first).toHaveAttribute('open', '');
        await page
          .locator('#study-plan details')
          .nth(1)
          .locator('summary')
          .click();
        await expect(first).toHaveAttribute('open', '');
      } else {
        const first = page.locator('#faq details').first();
        await first.locator('summary').focus();
        await page.keyboard.press('Enter');
        await expect(first).toHaveAttribute('open', '');
      }
    });
  }
}
