import { expect, test } from '@playwright/test';

// The class routine admin on the local preview's sample routine (src/lib/routine/testing/dev-fixtures.ts).
// Each test puts back what it adds, so the sample stays as loaded.

test.describe.configure({ mode: 'serial' });

/** A Sunday a week or more ahead (Dhaka): no sample absence then, and never "today". */
const SUNDAY = (() => {
  const d = new Date(Date.now() + 6 * 3600_000);
  d.setUTCDate(d.getUTCDate() + 7 + ((7 - d.getUTCDay()) % 7));
  return d.toISOString().slice(0, 10);
})();

test('the table: rooms down, times across, groups in the room they use, foldable sections', async ({ page }) => {
  await page.goto('/admin/routine');
  await expect(page.getByRole('heading', { name: 'ক্লাস রুটিন', level: 1 })).toBeVisible();
  // Qaida-A sits in Nursery-A's room, so it shows in Nursery-A's row.
  await expect(page.getByRole('row', { name: /^Nursery-A/ })).toContainText('Qaida-A');
  // A folded section is one line; open again it shows its groups.
  const hifz = page.getByRole('row', { name: /^Hifz-1 \(M\)/ });
  await expect(hifz).toBeVisible();
  await page.getByRole('button', { name: /হিফয · নাজেরা \(M\)/ }).click();
  await expect(hifz).toBeHidden();
  await page.getByRole('button', { name: /হিফয · নাজেরা \(M\)/ }).click();
  await expect(hifz).toBeVisible();
});

test('adding a class: a clash is refused, a typed time finds its column, an unlisted subject asks first, undo', async ({ page }) => {
  await page.goto('/admin/routine');
  await page.getByRole('button', { name: 'ক্লাস যোগ করুন', exact: true }).click();
  const panel = page.getByRole('dialog');
  await panel.getByRole('button', { name: 'Six (F)', exact: true }).click();
  await panel.getByRole('group', { name: 'সাবজেক্ট' }).getByRole('button', { name: 'Islam' }).click();

  // 9:30 runs into Six (F)'s English (9:00–10:00).
  await panel.getByLabel('শুরু').fill('৯:৩০');
  await panel.getByLabel('শেষ').fill('১০:১৫');
  await expect(panel.getByText(/নতুন কলাম তৈরি হবে/)).toBeVisible();
  await expect(panel.getByRole('alert')).toContainText('আগে থেকেই English আছে');

  await panel.getByLabel('শুরু').fill('১০:৪৫');
  await panel.getByLabel('শেষ').fill('১১:৩০');
  await expect(panel.getByText('✓ ১০:৪৫–১১:৩০ কলামে বসবে')).toBeVisible();
  // Busy teachers fold away, with where they are.
  await panel.getByText(/^ফ্রি নেই/).click();
  const jamila = panel.getByRole('button', { name: /^Jamila/ });
  await expect(jamila).toBeDisabled();
  await expect(jamila).toContainText('Nursery-A-এ ক্লাস');

  await panel.getByRole('button', { name: /^Omar/ }).click();
  await panel.getByRole('button', { name: 'সেভ', exact: true }).click();
  await expect(panel.getByText('Omar-এর সাবজেক্টের লিস্টে Islam নেই।')).toBeVisible();
  await panel.getByRole('button', { name: 'তাও সেভ করুন' }).click();
  await expect(page.getByRole('status').getByText('Six (F) · Islam সেভ হয়েছে')).toBeVisible();
  const six = page.getByRole('row', { name: /^Six \(F\)/ });
  await expect(six).toContainText('Omar');

  await page.getByRole('status').getByRole('button', { name: 'আনডু' }).click();
  await expect(six).not.toContainText('Omar');
});

test('the group view puts every class and group under its type; the teacher view shows loads', async ({ page }) => {
  await page.goto('/admin/routine?view=group');
  await expect(page.getByRole('button', { name: /কুরআন গ্রুপ/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /^Qaida-A/ })).toContainText('Nursery-A-এর রুমে');
  await page.getByLabel('টিচার খুঁজুন').selectOption({ label: 'Bilal' });
  await expect(page.getByText(/^\S+টা ক্লাস \(সপ্তাহে\)$/)).toBeVisible();

  await page.getByRole('radio', { name: 'টিচার', exact: true }).click();
  const bilal = page.getByRole('row', { name: /^Bilal/ });
  await expect(bilal).toContainText('Ammapara-1');
  await expect(bilal).toContainText('মেইন ১৮ / ২৪');
  await expect(bilal.getByText('কম', { exact: true })).toBeVisible();
});

test('the proxy screen: an absent teacher, their classes, a proxy from the green list; the list shows it', async ({ page }) => {
  await page.goto(`/admin/routine/proxy?date=${SUNDAY}`);
  await page.getByLabel('যিনি আসেননি তাঁকে সিলেক্ট করুন').selectOption({ label: 'Jamila' });
  await expect(page.getByText('Jamila এ দিন আসেননি')).toBeVisible();
  await expect(page.getByText(/^এ দিনের প্রক্সি · ০\//)).toBeVisible();
  await page.getByRole('button', { name: /^Amina/ }).first().click();
  await expect(page.getByRole('status').getByText('Amina প্রক্সি নেবেন')).toBeVisible();
  await expect(page.getByText(/^এ দিনের প্রক্সি · ১\//)).toBeVisible();

  await page.goto(`/admin/routine/proxy/list?mode=day&date=${SUNDAY}`);
  await expect(page.getByText('অ্যাবসেন্ট: Jamila', { exact: false })).toBeVisible();
  await expect(page.getByText('→ Amina')).toBeVisible();

  await page.goto(`/admin/routine/proxy?date=${SUNDAY}`);
  await page.getByRole('button', { name: 'অ্যাবসেন্ট বাতিল' }).click();
  await page.getByRole('button', { name: 'হ্যাঁ, তিনি এসেছেন' }).click();
  await expect(page.getByText('এখনো কোনো প্রক্সি লাগবে না।')).toBeVisible();
});

test('teachers: the delete confirm lists their classes; setup tabs; workload hides salaries', async ({ page }) => {
  await page.goto('/admin/routine/teachers');
  await page.getByRole('button', { name: 'Amina ডিলিট' }).click();
  const confirm = page.getByRole('dialog');
  await expect(confirm).toContainText('Nursery-A · English');
  await confirm.getByRole('button', { name: 'বাতিল' }).click();
  await page.getByRole('button', { name: 'Amina এডিট' }).click();
  await expect(page.getByRole('dialog').getByLabel('ছোট নাম')).toHaveValue('Amina');
  await page.keyboard.press('Escape');

  await page.goto('/admin/routine/setup?tab=types');
  await expect(page.getByText(/রুটিন টেবিলে এই ক্রমে আসে/)).toBeVisible();
  await page.getByRole('tab', { name: /সাবজেক্ট/ }).click();
  await expect(page.getByRole('heading', { name: /^আরবি · / })).toBeVisible();

  await page.goto('/admin/routine/workload');
  await expect(page.getByRole('columnheader', { name: 'বেতন' })).toBeHidden();
  await page.getByRole('switch', { name: 'বেতন দেখান' }).click();
  await expect(page.getByRole('columnheader', { name: 'বেতন' })).toBeVisible();

  await page.goto(`/admin/routine/free?date=${SUNDAY}`);
  await expect(page.getByRole('heading', { name: /^ফ্রি টিচার · .*রবিবার$/ })).toBeVisible();
  await page.goto('/admin/routine/teachers');
  await page.getByRole('link', { name: 'Bilal' }).click();
  await expect(page.getByRole('table', { name: 'Bilal-এর সাপ্তাহিক রুটিন' })).toContainText('Ammapara-1');
});
