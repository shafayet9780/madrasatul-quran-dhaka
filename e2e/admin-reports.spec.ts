import { execFileSync } from 'node:child_process';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// T1 reports against the Neon dev database fixtures (October round open, September closed).
const loadFixtures = () => execFileSync('pnpm', ['survey:fixtures'], { stdio: 'ignore' });

test.describe.configure({ mode: 'serial' });
test.beforeAll(loadFixtures);
test.use({ httpCredentials: { username: 'playwright-editor', password: 'playwright-test-password' } });

async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

test('finds a student and opens the profile', async ({ page }) => {
  await page.goto('/admin/reports');
  await expect(page.getByRole('heading', { name: 'ক্লাস ও শিক্ষার্থী', level: 1 })).toBeVisible();
  await expectAccessible(page);
  await page.getByLabel('নাম, আইডি বা রোল').fill('zayan');
  await page.getByRole('link', { name: /Zayan Mahmud/ }).click();
  await expect(page.getByRole('heading', { name: 'Zayan Mahmud', level: 1 })).toBeVisible();
  await expect(page.getByRole('img', { name: /শিক্ষকদের গড় মার্ক:/ })).toBeVisible(); // two rounds → trend
  await expect(page.getByText('ক্লাসে মনোযোগ ভালো, তবে সহপাঠীদের সাথে মাঝে মাঝে ঝগড়া করে।')).toBeVisible();
  await expectAccessible(page);
});

test('class page lists every student, sorts and exports', async ({ page }) => {
  await page.goto('/admin/reports');
  await page.getByRole('link', { name: /নার্সারি A/ }).click();
  await expect(page.getByRole('heading', { name: 'নার্সারি A', level: 1 })).toBeVisible();
  await expect(page.getByText('২০/২০')).toBeVisible();
  const table = page.getByRole('table');
  await expect(table.getByRole('row')).toHaveCount(21);
  await table.getByRole('button', { name: /শিক্ষকদের গড়/ }).click();
  await expect(table.getByRole('columnheader', { name: /শিক্ষকদের গড়/ })).toHaveAttribute('aria-sort', 'descending');
  await expectAccessible(page);
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Excel' }).click();
  expect((await download).suggestedFilename()).toMatch(/^নার্সারি A - অক্টোবর ২০২৬ \(নমুনা\)\.xlsx$/);
});

test('rater patterns compare teachers', async ({ page }) => {
  await page.goto('/admin/reports/raters');
  await expect(page.getByRole('heading', { name: 'শিক্ষকদের রেটিং প্যাটার্ন', level: 1 })).toBeVisible();
  await expect(page.getByRole('row', { name: /উস্তাদ আব্দুল্লাহ/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /উস্তাযা সুমাইয়া/ })).toBeVisible();
  await expectAccessible(page);
});
