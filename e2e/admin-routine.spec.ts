import { expect, test } from '@playwright/test';

// The class routine admin on the local preview's sample routine (src/lib/routine/testing/dev-fixtures.ts).
// Each test puts back what it adds, so the sample stays as loaded.

test.describe.configure({ mode: 'serial' });

test('the grid blocks a clash, asks before an unlisted subject, and saves', async ({ page }) => {
  await page.goto('/admin/routine');
  await expect(page.getByRole('heading', { name: 'ক্লাস রুটিন', level: 1 })).toBeVisible();
  // A cell that changes by day shows each part with its days.
  await expect(page.getByRole('button', { name: /^One-A, ১০:৪৫/ })).toContainText('শনি–সোম');

  await page.getByRole('button', { name: /^Five \(M\), ১০:৪৫.*ক্লাস যোগ করুন$/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('বিষয়').selectOption({ label: 'Math' });
  await dialog.getByRole('combobox', { name: /^শিক্ষক/ }).selectOption({ label: 'Jamila — ব্যস্ত: প্রতিদিন' });
  await expect(dialog.getByText('Jamila প্রতিদিন এই পিরিয়ডে Nursery-A-তে আছেন।')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'যোগ করুন' })).toBeDisabled();

  await dialog.getByRole('combobox', { name: /^শিক্ষক/ }).selectOption({ label: 'Hasan' });
  await dialog.getByRole('button', { name: 'যোগ করুন' }).click();
  await expect(dialog.getByText('Hasan-এর বিষয়ের তালিকায় Math নেই।')).toBeVisible();
  await dialog.getByRole('button', { name: 'তবুও সেভ করুন' }).click();
  await expect(dialog.getByText('সেভ হয়েছে।')).toBeVisible();
  await expect(dialog.getByText('Math · Hasan')).toBeVisible();

  await dialog.getByRole('button', { name: 'মুছুন' }).click();
  await dialog.getByRole('button', { name: 'মুছুন' }).click();
  await expect(dialog.getByText('Math · Hasan')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /^Five \(M\), ১০:৪৫.*ক্লাস যোগ করুন$/ })).toBeVisible();
});

test('the proxy register lists an absent teacher\'s classes and records a cover', async ({ page }) => {
  // A Sunday with no sample absence.
  await page.goto('/admin/routine/proxy?date=2026-10-25');
  await page.getByRole('combobox', { name: /^শিক্ষক/ }).selectOption({ label: 'Jamila' });
  await page.getByRole('button', { name: 'যোগ করুন' }).click();
  await expect(page.getByText('০/২ ঠিক হয়েছে')).toBeVisible();

  const picker = page.getByLabel('প্রক্সি শিক্ষক').first();
  // Nobody free teaches Math then: the free teachers come under "বিষয়ের শিক্ষক নন".
  await expect(picker.locator('optgroup[label="বিষয়ের শিক্ষক নন"] option').first()).toHaveText(/ — আজ .*টি ক্লাস/);
  const lubna = await picker.locator('option', { hasText: 'Lubna' }).getAttribute('value');
  await picker.selectOption(lubna!);
  await expect(page.getByText('১/২ ঠিক হয়েছে')).toBeVisible();

  await page.getByRole('button', { name: 'সরান' }).click();
  await page.getByRole('button', { name: 'তালিকা থেকে সরান' }).click();
  await expect(page.getByText('উপরে অনুপস্থিত শিক্ষক যোগ করলে')).toBeVisible();
});

test('workload, free teachers, a teacher\'s week and setup open', async ({ page }) => {
  await page.goto('/admin/routine/workload');
  await expect(page.getByRole('row', { name: /Hasan/ }).getByText('বেশি')).toBeVisible();
  await page.goto('/admin/routine/free?day=1');
  await expect(page.getByRole('heading', { name: 'ফ্রি শিক্ষক · রবিবার' })).toBeVisible();
  await page.goto('/admin/routine/teachers');
  await page.getByRole('link', { name: 'Bilal' }).click();
  await expect(page.getByRole('table', { name: 'Bilal-এর সাপ্তাহিক রুটিন' })).toContainText('Ammapara-1');
  await page.goto('/admin/routine/setup');
  await expect(page.getByRole('cell', { name: 'চালু', exact: true })).toBeVisible();
});
