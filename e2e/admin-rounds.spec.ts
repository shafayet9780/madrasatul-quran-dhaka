import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';

// Uses the Neon dev database from .env.local; the fixture rounds are reloaded before and after.
const loadFixtures = () => execFileSync('pnpm', ['exec', 'tsx', 'scripts/survey-dev-fixtures.ts'], { stdio: 'ignore' });

test.describe.configure({ mode: 'serial' });
test.beforeAll(loadFixtures);
test.afterAll(loadFixtures);

const login = { httpCredentials: { username: 'playwright-editor', password: 'playwright-test-password' } };

test('admin pages require the Studio login', async ({ request }) => {
  const response = await request.get('/admin/rounds', { maxRedirects: 0 });
  expect(response.status()).toBe(401);
});

test.describe('with login', () => {
  test.use(login);

  test('lists fixture rounds with status and T1 coverage', async ({ page }) => {
    await page.goto('/admin/rounds');
    await expect(page.getByRole('heading', { name: 'রাউন্ড', level: 1 })).toBeVisible();
    const open = page.getByRole('row', { name: /অক্টোবর ২০২৬ \(নমুনা\)/ });
    await expect(open.getByText('চলমান')).toBeVisible();
    await expect(open.getByText('২/৬৫ ক্লাস-বিষয়')).toBeVisible();
    await expect(open.getByText('১টি খসড়া')).toBeVisible();
    const closed = page.getByRole('row', { name: /সেপ্টেম্বর ২০২৬ \(নমুনা\)/ });
    await expect(closed.getByText('বন্ধ')).toBeVisible();
  });

  test('closes a round after confirmation and reopens it by extending', async ({ page }) => {
    await page.goto('/admin/rounds');
    await page.getByRole('button', { name: 'অক্টোবর ২০২৬ (নমুনা): এখনই বন্ধ' }).click();
    await expect(page.getByText('২/৬৫ ক্লাস-বিষয় জমা হয়েছে; ১টি খসড়া রয়ে যাবে।', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'হ্যাঁ, বন্ধ করুন' }).click();
    await expect(page.getByRole('status')).toContainText('রাউন্ড বন্ধ হয়েছে');
    const row = page.getByRole('row', { name: /অক্টোবর ২০২৬ \(নমুনা\)/ });
    await expect(row.getByText('বন্ধ', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'অক্টোবর ২০২৬ (নমুনা): মেয়াদ বাড়ান' }).click();
    await page.getByRole('button', { name: 'সংরক্ষণ করুন' }).click();
    await expect(page.getByRole('status')).toContainText('মেয়াদ বাড়ানো হয়েছে');
    await expect(row.getByText('চলমান')).toBeVisible();
  });

  test('rejects a closing time in the past', async ({ page }) => {
    await page.goto('/admin/rounds');
    await page.getByRole('button', { name: 'অক্টোবর ২০২৬ (নমুনা): মেয়াদ বাড়ান' }).click();
    await page.getByRole('textbox', { name: 'নতুন বন্ধের সময়' }).fill('2020-01-01T10:00');
    await page.getByRole('button', { name: 'সংরক্ষণ করুন' }).click();
    await expect(page.getByRole('status')).toContainText('নতুন বন্ধের সময় এখনকার পরে হতে হবে।');
  });
});
