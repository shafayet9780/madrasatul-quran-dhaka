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

test('the overview pairs guardian rounds with the teacher round and lists children needing attention', async ({ page }) => {
  await page.goto('/admin/reports/overview');
  await expect(page.getByRole('heading', { name: 'ওভারভিউ', level: 1 })).toBeVisible();
  // The guardian rounds that ran with the October teacher round were picked by date.
  await expect(page.getByLabel('শিক্ষার মান (G1)')).toContainText('স্বয়ংক্রিয় (অক্টোবর ২০২৬ · ক্লাস পরিচালনা (নমুনা))');
  await expect(page.getByText('শিক্ষার মান · শ্রেণি × বিষয় (G1 গড় মার্ক)')).toBeVisible();
  await expect(page.getByRole('link', { name: /নার্সারি A · কুরআন: গড়/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'মনোযোগ প্রয়োজন' })).toBeVisible();
  await expectAccessible(page);
});

test('teaching quality shows the class × subject heatmap with details, verified-only and Excel', async ({ page }) => {
  await page.goto('/admin/reports/teaching');
  await expect(page.getByRole('heading', { name: 'শিক্ষার মান', level: 1 })).toBeVisible();
  const cell = page.getByRole('link', { name: /নার্সারি A · কুরআন: গড় .*, ৭ জন উত্তরদাতা/ });
  await expect(cell).toBeVisible();
  // Fewer than 3 guardians elsewhere: hidden.
  await expect(page.getByRole('link', { name: /কেজি A · কুরআন: ০ জন উত্তরদাতা, ফলাফল লুকানো/ })).toBeVisible();
  await expectAccessible(page);

  await cell.click();
  const detail = page.getByRole('region', { name: 'নার্সারি A · কুরআন' });
  await expect(detail.getByText('প্রশ্নভিত্তিক মার্কের বণ্টন')).toBeVisible();
  await expect(detail.getByText('৭', { exact: true })).toBeVisible();
  await expect(detail.getByText('গণিতের হোমওয়ার্ক একটু কমালে ভালো হয়।')).toBeVisible();
  await expectAccessible(page);

  // Only one Nursery A form is verified: with "শুধু যাচাইকৃত" the cell is hidden.
  await page.getByLabel('শুধু যাচাইকৃত').check();
  await page.getByRole('button', { name: 'দেখান' }).click();
  await expect(page.getByRole('link', { name: /নার্সারি A · কুরআন: ১ জন উত্তরদাতা, ফলাফল লুকানো/ })).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Excel' }).click();
  expect((await download).suggestedFilename()).toContain('শিক্ষার মান');
});
