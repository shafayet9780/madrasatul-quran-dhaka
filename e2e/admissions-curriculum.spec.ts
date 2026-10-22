import { test, expect } from '@playwright/test';

for (const locale of ['english', 'bengali']) {
  for (const route of ['admissions', 'curriculum']) {
    test(`${locale} ${route}: navigation, honest fees and responsive layout`, async ({
      page,
    }) => {
      await page.goto(`/${locale}/${route}`);
      const navigation = page.getByRole('navigation', {
        name: locale === 'english' ? 'On this page' : 'এই পেজে',
      });
      await expect(navigation).toBeVisible();
      const section = route === 'admissions' ? 'fees' : 'plan';
      await navigation.locator(`a[href="#${section}"]`).click();
      await expect(page).toHaveURL(new RegExp(`#${section}$`));
      await expect(page.locator(`#${section}`)).toBeVisible();
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
      // Pages link within the language; files (/api/…) are the same in both.
      const links = await page
        .locator('main a[href^="/"]:not([href^="/api/"])')
        .evaluateAll(elements => elements.map(e => e.getAttribute('href')));
      expect(
        links.every(href => new RegExp(`^/${locale}([/#]|$)`).test(href ?? ''))
      ).toBe(true);
      if (route === 'curriculum') {
        // Fees live on the Admissions page only.
        await expect(page.locator('main')).not.toContainText('৳');
        // The ten-year plan: a table of the three stages, Nursery to Class 11, from 768px; below that the same rows stacked.
        await page.setViewportSize({ width: 1280, height: 900 });
        const table = page.getByRole('region', {
          name:
            locale === 'english'
              ? 'The ten-year study plan, class by class'
              : 'দশ বছরের পাঠ পরিকল্পনা, শ্রেণি অনুযায়ী',
        });
        await expect(table).toBeVisible();
        await expect(table.locator('tbody')).toHaveCount(3);
        await expect(table.locator('tbody th[scope="row"]')).toHaveCount(13);
        expect(await table.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
        await page.setViewportSize({ width: 320, height: 800 });
        await expect(table).toBeHidden();
        const phoneRows = page.locator('#plan li:visible');
        await expect(phoneRows).toHaveCount(13);
        for (const row of await phoneRows.all()) {
          expect(await row.evaluate(element => element.getBoundingClientRect().right <= window.innerWidth)).toBe(true);
        }
        await page.setViewportSize({ width: 390, height: 844 });
        // Books by class: every panel is in the HTML, one shows; the arrow keys move between classes.
        const tabs = page.getByRole('tablist', {
          name: locale === 'english' ? 'Choose a class' : 'শ্রেণি বেছে নিন',
        });
        await expect(tabs.getByRole('tab')).toHaveCount(12);
        await expect(page.locator('[role="tabpanel"]')).toHaveCount(12);
        await tabs.getByRole('tab', { name: locale === 'english' ? 'Class 2' : '২য়' }).click();
        const panel = page.getByRole('tabpanel');
        await expect(panel).toHaveCount(1);
        await expect(panel).toContainText(locale === 'english' ? 'Bidayah 2' : 'বিদায়া ২য়');
        await page.keyboard.press('ArrowRight');
        await expect(tabs.getByRole('tab', { name: locale === 'english' ? 'Class 3' : '৩য়' })).toBeFocused();
        await expect(page.getByRole('tabpanel')).toContainText(locale === 'english' ? 'Bidayah 3' : 'বিদায়া ৩য়');
      } else if (await page.locator('#faq').count()) {
        // The questions show while an intake is open or announced. The first answer starts open; the keyboard opens the next.
        await expect(page.locator('#faq details').first()).toHaveAttribute('open', '');
        const second = page.locator('#faq details').nth(1);
        await second.locator('summary').focus();
        await page.keyboard.press('Enter');
        await expect(second).toHaveAttribute('open', '');
      }
    });
  }
}
