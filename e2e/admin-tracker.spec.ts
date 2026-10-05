import { execFileSync } from 'node:child_process';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Response tracker against the Neon dev database; fixtures are reloaded before and after.
const loadFixtures = () => execFileSync('pnpm', ['survey:fixtures'], { stdio: 'ignore' });

test.describe.configure({ mode: 'serial' });
test.beforeAll(loadFixtures);
test.afterAll(loadFixtures);
test.use({ httpCredentials: { username: 'playwright-editor', password: 'playwright-test-password' } });

test('shows coverage and drafts, and resolves a duplicate', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/tracker/);
  await expect(page.getByRole('heading', { name: 'রেসপন্স ট্র্যাকার', level: 1 })).toBeVisible();
  await expect(page.getByText('শ্রেণি × বিষয় · কভার ২/৬৫')).toBeVisible();
  await expect(page.getByRole('row', { name: /নার্সারি B/ }).getByText(/ডুপ্লিকেট · উস্তাদ আব্দুল্লাহ, উস্তাযা সুমাইয়া/)).toBeAttached();

  const drafts = page.getByRole('region', { name: /শিক্ষকদের খসড়া/ });
  await expect(drafts.getByText('কেজি A · আরবি')).toBeVisible();
  await expect(drafts.getByText('৩/৫')).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);

  const dups = page.getByRole('region', { name: /^ডুপ্লিকেট/ });
  await dups.getByRole('radio', { name: /উস্তাযা সুমাইয়া-এরটি রাখুন/ }).check();
  await dups.getByRole('button', { name: 'সিদ্ধান্ত সংরক্ষণ করুন' }).click();
  await expect(dups.getByText('কোনো ডুপ্লিকেট নেই।')).toBeVisible();
  await expect(page.getByRole('row', { name: /নার্সারি B/ }).getByText(/^জমা · উস্তাযা সুমাইয়া$/)).toBeAttached();
});
