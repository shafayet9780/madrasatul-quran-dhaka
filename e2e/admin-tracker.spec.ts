import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { loadFixtures } from './survey-fixtures';

// Response tracker against the Neon dev database; fixtures are reloaded before and after.

test.describe.configure({ mode: 'serial' });
test.beforeAll(() => loadFixtures());
test.afterAll(() => loadFixtures());
test.use({ httpCredentials: { username: 'playwright-editor', password: 'playwright-test-password' } });

test('shows coverage and drafts, and resolves a duplicate', async ({ page }) => {
  // /admin opens the overview; the tracker is in the sidebar.
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/reports\/overview/);
  await page.getByRole('navigation', { name: 'রিপোর্ট মেনু' }).getByRole('link', { name: /রেসপন্স ট্র্যাকার/ }).click();
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
  // Decided: the box at the top goes away.
  await expect(page.getByRole('region', { name: /^ডুপ্লিকেট/ })).toHaveCount(0);
  await expect(page.getByRole('row', { name: /নার্সারি B/ }).getByText(/^জমা · উস্তাযা সুমাইয়া$/)).toBeAttached();
});

test('a guardian round shows response by class, reminders, unverified and repeated forms', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/admin/tracker');
  await page.getByRole('button', { name: /জরিপ ও রাউন্ড/ }).click();
  await page.getByRole('menuitemradio', { name: 'শিক্ষার্থী · অক্টোবর ২০২৬ · শিক্ষার্থী (নমুনা)' }).click();
  await expect(page.getByText('শিক্ষার্থীর উপর অভিভাবক রিভিউ · অক্টোবর ২০২৬ · শিক্ষার্থী (নমুনা)', { exact: false })).toBeVisible();
  // Yahya, Hamza, Zayan, Abdullah and Safiya (Nursery A) have a current form: 5 of 35 children.
  await expect(page.getByText('৫/৩৫')).toBeVisible();
  await expect(page.getByRole('link', { name: /নার্সারি A/ })).toContainText('৫/২০');

  await page.getByRole('link', { name: /নার্সারি A/ }).click();
  const pending = page.getByRole('region', { name: /নার্সারি A · এখনো জমা হয়নি \(১৫\)/ });
  await expect(pending.getByText('Maryam Binte Rafiq')).toBeVisible();
  await expect(pending.getByText('বাবা ০১৭০০-০০০০০১')).toBeVisible();
  await pending.getByRole('button', { name: 'Maryam Binte Rafiq: বার্তা কপি' }).click();
  await expect(pending.getByText('কপি হয়েছে')).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('Maryam Binte Rafiq-এর জন্য “শিক্ষার্থীর উপর অভিভাবক রিভিউ”');
  expect(copied).toContain('/survey/fixture-g2?k=fixture-g2-link-key-00000');
  // Children without any number cannot get a reminder.
  await expect(pending.getByText('ERP-তে নম্বর যোগ করুন').first()).toBeVisible();

  const unverified = page.getByRole('region', { name: /অযাচাইকৃত জমা \(১\)/ });
  await expect(unverified.getByText('রাশেদ কবির (মামা) · Hamza Rahim')).toBeVisible();
  const multiple = page.getByRole('region', { name: /একাধিক জমা \(১\)/ });
  await expect(multiple.getByText('Hamza Rahim')).toBeVisible();
  await expect(multiple.getByText('গণ্য', { exact: true })).toBeVisible();
  await expect(multiple.getByText('আগের', { exact: true })).toBeVisible();
  // The counted form came from the uncle's number, not the father's: flagged with both numbers shown.
  await expect(multiple.getByText('আগের ফর্ম অন্য নম্বর থেকে')).toBeVisible();
  await expect(multiple.getByText(/০১৮৫৫-০০০০০০/)).toBeVisible();
  await expect(multiple.getByText(/০১৭০০-০০০০০২/)).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);

  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Excel' }).click();
  expect((await download).suggestedFilename()).toContain('অভিভাবক ট্র্যাকার');
});
