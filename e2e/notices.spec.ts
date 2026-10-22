import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Runs against the local preview (pnpm test:e2e:admissions), where the notice board is switched on with sample notices
// (src/lib/notices/testing/sample-notices.ts).

async function expectNoSeriousAxe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

async function open(page: Page, path: string) {
  await page.goto(path);
  await page.getByRole('button', { name: /শুধু জরুরিগুলো|Reject non-essential/ }).click({ timeout: 3000 }).catch(() => {});
}

test('the board shows the pinned notice, then the notices month by month, by type and year', async ({ page, isMobile }) => {
  await open(page, '/bengali/notices');
  await expect(page.locator('h1')).toHaveText('নোটিশ বোর্ড');
  if (!isMobile) await expect(page.getByRole('navigation', { name: 'প্রধান মেনু' }).first().getByRole('link', { name: 'নোটিশ' })).toHaveAttribute('aria-current', 'page');

  const pinned = page.getByRole('region', { name: 'জরুরি নোটিশ' });
  await expect(pinned.getByRole('listitem')).toHaveCount(1);
  await expect(pinned.getByRole('link')).toContainText('অর্ধবার্ষিক পরীক্ষার রুটিন');
  await expect(pinned.getByRole('link')).toHaveAttribute('href', '/bengali/notices/2026-17');

  const board = page.getByRole('region', { name: '২০২৬ সালের নোটিশ' });
  await expect(board.getByRole('heading', { level: 3 })).toHaveText(['অক্টোবর ২০২৬', 'সেপ্টেম্বর ২০২৬']);
  await expect(board.getByRole('link', { name: /অভিভাবক সমাবেশ/ })).toContainText('নং ২০২৬/১৯');
  // The pinned notice keeps its place in the list too.
  await expect(board.getByRole('link', { name: /অর্ধবার্ষিক পরীক্ষার রুটিন/ })).toContainText('PDF');

  const types = page.getByRole('group', { name: 'নোটিশের ধরন' });
  await types.getByRole('button', { name: 'পরীক্ষা ও ফলাফল' }).click();
  await expect(board.getByRole('listitem')).toHaveCount(2);
  await types.getByRole('button', { name: 'ভর্তি' }).click();
  await expect(board.getByRole('listitem')).toHaveCount(1);
  await types.getByRole('button', { name: 'সব' }).click();
  await expect(board.getByRole('listitem')).toHaveCount(6);

  await page.getByLabel('বছর').selectOption('2025');
  const old = page.getByRole('region', { name: '২০২৫ সালের নোটিশ' });
  await expect(old.getByRole('listitem')).toHaveCount(1);
  await expect(old.getByRole('link')).toContainText('শীতকালীন ছুটি');
  await expectNoSeriousAxe(page);
});

test('a notice opens as a sheet with its attachments, sharing and the notices either side', async ({ page }) => {
  await open(page, '/bengali/notices/2026-17');
  await expect(page.locator('h1')).toHaveText('অর্ধবার্ষিক পরীক্ষার রুটিন');
  await expect(page.locator('article header')).toContainText('নোটিশ নং ২০২৬/১৭');
  await expect(page.locator('article header time')).toHaveAttribute('dateTime', '2026-10-12');

  const files = page.getByRole('region', { name: 'সংযুক্তি' });
  await expect(files).toContainText('২৪০ KB');
  await expect(files.getByRole('link', { name: 'দেখুন: অর্ধবার্ষিক পরীক্ষার রুটিন' })).toHaveAttribute('href', 'https://example.com/routine.pdf');
  await expect(files.getByRole('img', { name: 'সই করা নোটিশ' })).toBeVisible();

  // The link preview leads with the date; the WhatsApp message with the number.
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /^১২ অক্টোবর ২০২৬: সকল অভিভাবক/);
  const whatsapp = await page.getByRole('link', { name: 'হোয়াটসঅ্যাপে পাঠান' }).getAttribute('href');
  expect(decodeURIComponent(whatsapp ?? '')).toMatch(/^https:\/\/wa\.me\/\?text=নং ২০২৬\/১৭, অর্ধবার্ষিক পরীক্ষার রুটিন: http.*\/bengali\/notices\/2026-17$/);
  const either = page.getByRole('navigation', { name: 'আগের ও পরের নোটিশ' });
  await expect(either.getByRole('link', { name: /আগের নোটিশ/ })).toHaveAttribute('href', '/bengali/notices/2026-16');
  await expect(either.getByRole('link', { name: /পরের নোটিশ/ })).toHaveAttribute('href', '/bengali/notices/2026-18');
  await expectNoSeriousAxe(page);

  // Printing gives the sheet alone.
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('header').first()).toBeHidden();
  await expect(page.locator('footer').last()).toBeHidden();
  await expect(page.getByRole('button', { name: 'প্রিন্ট' })).toBeHidden();
  await expect(page.locator('h1')).toBeVisible();
});

test('the English board shows a Bengali-only notice in Bengali, with a note', async ({ page }) => {
  await open(page, '/english/notices');
  await expect(page.locator('h1')).toHaveText('Notice board');
  const row = page.getByRole('link', { name: /সরকারি ছুটিতে স্কুল বন্ধ/ });
  await expect(row).toContainText('No. 2026/18');
  await expect(row.locator('[lang="bn"]').first()).toBeVisible();

  await row.click();
  await expect(page).toHaveURL(/\/english\/notices\/2026-18$/);
  await expect(page.locator('h1')).toHaveAttribute('lang', 'bn');
  await expect(page.getByText('This notice is in Bengali only.')).toBeVisible();
  await expectNoSeriousAxe(page);
});

test('the homepage shows the latest notices, pinned first; old News leads to the board; an unknown number is not found', async ({ page }) => {
  await open(page, '/bengali');
  const block = page.getByRole('region', { name: 'নোটিশ বোর্ড' });
  await expect(block.getByRole('link', { name: /নং/ })).toHaveCount(3);
  await expect(block.getByRole('link', { name: /নং/ }).first()).toContainText('অর্ধবার্ষিক পরীক্ষার রুটিন');
  await expect(block.getByRole('link', { name: 'সব নোটিশ দেখুন' })).toHaveAttribute('href', '/bengali/notices');

  await page.goto('/english/news');
  await expect(page).toHaveURL(/\/english\/notices$/);

  const missing = await page.goto('/bengali/notices/2026-99');
  expect(missing?.status()).toBe(404);
});
