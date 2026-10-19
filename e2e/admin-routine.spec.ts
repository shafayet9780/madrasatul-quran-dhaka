import { expect, test } from '@playwright/test';

// The class routine admin on the local preview's sample routine (src/lib/routine/testing/dev-fixtures.ts).
// Each test puts back what it adds, so the sample stays as loaded.

test.describe.configure({ mode: 'serial' });

test('the grid blocks a clash, asks before an unlisted subject, and saves', async ({ page }) => {
  await page.goto('/admin/routine');
  await expect(page.getByRole('heading', { name: 'ক্লাস রুটিন', level: 1 })).toBeVisible();
  // Sheet-style by default: the day in blocks, Arabic levels under their band.
  await expect(page.getByRole('columnheader', { name: 'আরবি' })).toBeVisible();
  await expect(page.getByRole('rowheader', { name: 'LEVEL-1' })).toBeVisible();
  // A cell that changes by day shows each part with its days.
  await expect(page.getByRole('button', { name: /^One-A, ১০:৪৫/ })).toContainText('শনি–সোম');

  await page.getByRole('button', { name: /^Five \(M\), ১০:৪৫.*ক্লাস যোগ করুন$/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('radio', { name: 'Math' }).click();
  // Busy teachers are red and can't be picked, with where they are.
  await dialog.getByText(/^ফ্রি নেই/).click();
  const jamila = dialog.getByRole('button', { name: /^Jamila/ });
  await expect(jamila).toBeDisabled();
  await expect(jamila).toContainText('Nursery-A-এ ক্লাস');

  await dialog.getByRole('button', { name: /^Hasan/ }).click();
  await dialog.getByRole('button', { name: 'যোগ করুন', exact: true }).click();
  await expect(dialog.getByText('Hasan-এর সাবজেক্টের লিস্টে Math নেই।')).toBeVisible();
  await dialog.getByRole('button', { name: 'তাও সেভ করুন' }).click();
  await expect(dialog.getByText('সেভ হয়েছে।')).toBeVisible();
  await expect(dialog.getByText('Math · Hasan')).toBeVisible();

  await dialog.getByRole('button', { name: 'ডিলিট', exact: true }).click();
  await dialog.getByRole('button', { name: 'হ্যাঁ, ডিলিট করুন' }).click();
  await expect(dialog.getByText('Math · Hasan')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /^Five \(M\), ১০:৪৫.*ক্লাস যোগ করুন$/ })).toBeVisible();
});

test('the proxy screen: an absent teacher, their classes, a proxy from the green list', async ({ page }) => {
  // A Sunday with no sample absence.
  await page.goto('/admin/routine/proxy?date=2026-10-25');
  await page.getByLabel('যিনি আসেননি তাঁকে সিলেক্ট করুন').selectOption({ label: 'Jamila' });
  await expect(page.getByText('Jamila এ দিন আসেননি')).toBeVisible();
  await expect(page.getByText('০/২ ঠিক হয়েছে')).toBeVisible();

  // The first class is open: nobody free teaches Math then, so the free teachers are "অন্য সাবজেক্টের টিচার".
  await expect(page.getByText(/^অন্য সাবজেক্টের টিচার/)).toBeVisible();
  await page.getByRole('button', { name: /^Lubna/ }).click();
  await expect(page.getByText('১/২ ঠিক হয়েছে')).toBeVisible();
  await expect(page.getByRole('status').getByText('Lubna প্রক্সি নেবেন')).toBeVisible();

  await page.getByRole('button', { name: /প্রক্সি: Lubna/ }).click();
  await expect(page.getByRole('link', { name: 'Lubna-কে WhatsApp করুন' })).toHaveAttribute('href', /^https:\/\/wa\.me\/\d*\?text=/);
  await page.getByRole('button', { name: 'প্রক্সি সরান' }).click();
  await expect(page.getByText('০/২ ঠিক হয়েছে')).toBeVisible();

  await page.getByRole('button', { name: 'অ্যাবসেন্ট বাতিল' }).click();
  await page.getByRole('button', { name: 'হ্যাঁ, তিনি এসেছেন' }).click();
  await expect(page.getByText('এখনো কোনো প্রক্সি লাগবে না।')).toBeVisible();
});

test('the by-teacher view shows where each teacher is, with their load', async ({ page }) => {
  await page.goto('/admin/routine');
  await page.getByRole('radio', { name: 'টিচার অনুযায়ী' }).click();
  const bilal = page.getByRole('row', { name: /^Bilal/ });
  await expect(bilal.getByRole('link', { name: 'Ammapara-1' })).toBeVisible();
  await expect(bilal.getByText('টিএ')).toBeVisible();
  await expect(bilal.getByText('ঠিক আছে')).toBeVisible();
});

test('workload, free teachers, a teacher\'s week and setup open', async ({ page }) => {
  await page.goto('/admin/routine/workload');
  await expect(page.getByRole('row', { name: /Hasan/ }).getByText('বেশি')).toBeVisible();
  await page.goto('/admin/routine/free?date=2026-10-25');
  await expect(page.getByRole('heading', { name: /^ফ্রি টিচার · .*রবিবার$/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^৭:০০/ }).first()).toBeVisible();
  await page.goto('/admin/routine/teachers');
  await page.getByRole('link', { name: 'Bilal' }).click();
  await expect(page.getByRole('table', { name: 'Bilal-এর সাপ্তাহিক রুটিন' })).toContainText('Ammapara-1');
  await page.goto('/admin/routine/setup');
  await expect(page.getByRole('cell', { name: 'চালু', exact: true })).toBeVisible();
});
