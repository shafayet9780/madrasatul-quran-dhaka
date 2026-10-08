import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The admissions admin against the local preview (pnpm test:e2e:admissions), with sample
// applications added through POST /api/admissions/dev/seed (local preview only). Desktop only:
// the tests share one in-memory database, so they run in order.

test.describe.configure({ mode: 'serial' });
test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop project only'));

async function seed(page: Page, counts = 'paid=4&unpaid=2&drafts=1') {
  const res = await page.request.post(`/api/admissions/dev/seed?${counts}`);
  expect(res.ok()).toBe(true);
}

async function noSeriousA11yIssues(page: Page) {
  const results = await new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

const idCells = (page: Page) => page.locator('tbody td:nth-child(2) a');

test('the admin needs the Studio login, pages and downloads alike', async ({ browser, baseURL }) => {
  const anonymous = await browser.newContext({ baseURL, httpCredentials: undefined });
  for (const path of ['/admin/admissions', '/admin/admissions/export', '/admin/admissions/file?id=x&key=y']) {
    expect((await anonymous.request.get(path)).status(), path).toBe(401);
  }
  await anonymous.close();
});

test('overview, module switcher and the paid list with search and filters', async ({ page }) => {
  await seed(page);
  await page.goto('/admin/admissions');
  await expect(page.getByRole('heading', { name: /প্রি-অ্যাডমিশন/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /^পরিশোধিত আবেদন/ })).toBeVisible();
  await noSeriousA11yIssues(page);

  // A class on the overview opens the paid list filtered to it.
  await page.getByRole('link', { name: /^কেজি/ }).click();
  await expect(page).toHaveURL(/\/admin\/admissions\/applications\?class=KG$/);
  for (const id of await idCells(page).allTextContents()) expect(id).toMatch(/^KG-/);
  await page.goto('/admin/admissions');

  // The switcher leads to the survey module and back.
  await page.getByRole('button', { name: /মডিউল: ভর্তি/ }).click();
  await expect(page.getByRole('menuitem', { name: 'শিক্ষক ও অভিভাবক জরিপ' })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('navigation', { name: 'ভর্তি মেনু' }).getByRole('link', { name: /আবেদন/ }).click();
  await expect(page).toHaveURL(/\/admin\/admissions\/applications$/);
  const ids = await idCells(page).allTextContents();
  expect(ids.length).toBeGreaterThanOrEqual(4);

  // Search by ID as the office types it ("kg 1" finds KG-001).
  const target = ids.find((id) => id.startsWith('KG-')) ?? ids[0];
  const typed = target.replace('-', ' ').toLowerCase().replace(/ 0+/, ' ');
  await page.getByRole('searchbox', { name: 'খুঁজুন' }).fill(typed);
  await expect(page).toHaveURL(/q=/);
  await expect(idCells(page)).toHaveText([target]);
  await page.getByRole('searchbox', { name: 'খুঁজুন' }).fill('');
  await expect(page).not.toHaveURL(/q=/);

  // Class filter.
  await page.getByRole('button', { name: 'শ্রেণী' }).click();
  await page.getByRole('menuitemradio', { name: 'কেজি' }).click();
  await expect(page).toHaveURL(/class=KG/);
  await expect(page.getByRole('menu')).toHaveCount(0);
  for (const id of await idCells(page).allTextContents()) expect(id).toMatch(/^KG-/);
  await noSeriousA11yIssues(page);
});

test('bulk status change on selected rows', async ({ page }) => {
  await page.goto('/admin/admissions/applications');
  await page.getByRole('checkbox', { name: /নির্বাচন$/ }).nth(1).check();
  await page.getByRole('checkbox', { name: /নির্বাচন$/ }).nth(2).check();
  await expect(page.getByText('২টি নির্বাচিত')).toBeVisible();
  await page.getByRole('combobox', { name: 'নতুন অবস্থা' }).selectOption({ label: 'মূল্যায়ন নির্ধারিত' });
  await page.getByRole('button', { name: 'প্রয়োগ করুন' }).click();
  await expect(page.getByRole('status')).toHaveText('২টি আবেদনের অবস্থা বদলানো হয়েছে।');
  await expect(page.locator('tbody').getByText('মূল্যায়ন নির্ধারিত')).toHaveCount(2);

  await page.getByRole('button', { name: 'অবস্থা' }).click();
  await page.getByRole('menuitemradio', { name: 'মূল্যায়ন নির্ধারিত' }).click();
  await expect(idCells(page)).toHaveCount(2);
});

test('detail: answers, documents, notes, status, evaluation day, PDF and Excel', async ({ page }) => {
  await page.goto('/admin/admissions/applications');
  const id = (await idCells(page).first().textContent())!;
  await idCells(page).first().click();
  await expect(page.getByText(id, { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'শিক্ষার্থীর তথ্য' })).toBeVisible();
  await noSeriousA11yIssues(page);

  // A private document opens through the admin route.
  const doc = page.getByRole('link', { name: /শিক্ষার্থীর ছবি/ });
  const docRes = await page.request.get((await doc.getAttribute('href'))!);
  expect(docRes.status()).toBe(200);
  expect(docRes.headers()['content-type']).toBe('image/jpeg');

  await page.getByRole('textbox', { name: 'নতুন নোট' }).fill('পরিবহন দরকার, মিরপুর রুট');
  await page.getByRole('button', { name: 'নোট যোগ করুন' }).click();
  await expect(page.getByRole('textbox', { name: 'নতুন নোট' })).toHaveValue('');
  await expect(page.locator('p', { hasText: 'পরিবহন দরকার, মিরপুর রুট' }).first()).toBeVisible();

  await page.getByRole('combobox', { name: 'অবস্থা' }).selectOption({ label: 'অপেক্ষমাণ' });
  await page.getByRole('button', { name: 'সংরক্ষণ' }).click();
  await expect(page.getByText('অবস্থা বদলেছে: অপেক্ষমাণ').first()).toBeVisible();

  // The switches start off on a fresh preview; setChecked keeps a rerun on the same server working.
  const fee = page.getByRole('switch', { name: /মূল্যায়ন ফি/ });
  await fee.setChecked(false);
  await page.getByPlaceholder('ঐচ্ছিক').fill('R-102');
  await fee.setChecked(true);
  await expect(page.getByText('মূল্যায়ন ফি গৃহীত (রসিদ R-102)').first()).toBeVisible();
  await page.getByRole('switch', { name: 'উপস্থিত' }).setChecked(true);
  await expect(page.getByRole('switch', { name: 'উপস্থিত' })).toBeChecked();

  const pdf = await page.request.get(page.url().replace(/\?.*$/, '') + '/pdf');
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()['content-type']).toBe('application/pdf');

  const xlsx = await page.request.get('/admin/admissions/export');
  expect(xlsx.status()).toBe(200);
  expect(xlsx.headers()['content-disposition']).toMatch(/pre-admission-2027-.*\.xlsx/);
  expect((await xlsx.body()).subarray(0, 2).toString()).toBe('PK');
});

test('evaluation day: an ID opens the application, today’s check-ins are listed', async ({ page }) => {
  await page.goto('/admin/admissions/applications');
  const id = (await idCells(page).nth(1).textContent())!;
  await page.goto('/admin/admissions/evaluation-day');
  await page.getByLabel('আবেদন আইডি').fill('ZZ-999');
  await page.getByRole('button', { name: 'খুলুন' }).click();
  await expect(page.locator('#checkin-error')).toContainText('আইডিটি পড়া যায়নি');

  await page.getByLabel('আবেদন আইডি').fill(id.toLowerCase());
  await page.getByRole('button', { name: 'খুলুন' }).click();
  await expect(page).toHaveURL(/from=evaluation-day/);
  await page.getByRole('switch', { name: 'উপস্থিত' }).setChecked(true);
  await expect(page.getByRole('switch', { name: 'উপস্থিত' })).toBeChecked();
  await page.getByRole('link', { name: /মূল্যায়নের দিনে ফিরুন/ }).click();
  await expect(page.getByRole('link', { name: id })).toBeVisible();
  await noSeriousA11yIssues(page);
});

test('fee pending: progress, payment attempts, and deleting an unpaid application', async ({ page }) => {
  await page.goto('/admin/admissions/unpaid');
  await expect(page.getByText('ফর্ম সম্পূর্ণ').first()).toBeVisible();
  await expect(page.getByText(/ব্যর্থ, ১ বার/).first()).toBeVisible();
  await noSeriousA11yIssues(page);
  // Guardian tests running alongside add rows (one may be mid-payment, which cannot be deleted),
  // so pick a seeded row (mobiles 01712-0000…) and follow it by its link.
  const row = page.locator('tbody tr', { hasText: '01712-0000' }).first();
  const href = (await row.getByRole('link').first().getAttribute('href'))!;
  await row.getByRole('button', { name: 'মুছুন' }).click();
  await page.getByRole('button', { name: 'মুছে ফেলুন' }).click();
  await expect(page.locator(`tbody a[href="${href}"]`)).toHaveCount(0);
  expect((await page.request.get(href)).status()).toBe(404);
});
