import { execFileSync } from 'node:child_process';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Guardian identity (G1/G2) against the Neon dev database; fixtures are reloaded before and after.
const loadFixtures = () => execFileSync('pnpm', ['survey:fixtures'], { stdio: 'ignore' });
const G2 = '/survey/fixture-g2?k=fixture-g2-link-key-00000';
const G1 = '/survey/fixture-g1?k=fixture-g1-link-key-00000';

test.describe.configure({ mode: 'serial' });
test.beforeAll(loadFixtures);
test.afterAll(loadFixtures);
test.use({ viewport: { width: 390, height: 844 } });

async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

async function toIdentify(page: Page, link = G2) {
  await page.goto(link);
  await page.getByRole('button', { name: 'শুরু করুন' }).click();
  await page.getByRole('radio', { name: /^নার্সারি/ }).click();
  await page.getByRole('radio', { name: 'শাখা A' }).click();
  await page.getByRole('button', { name: 'নার্সারি · শাখা A · চালিয়ে যান' }).click();
  await expect(page.getByRole('heading', { name: 'শিক্ষার্থী খুঁজে বের করুন' })).toBeVisible();
}

test('a guardian finds siblings by mobile, picks one and is verified', async ({ page }) => {
  await page.goto(G2);
  await expect(page.getByRole('heading', { name: 'শিক্ষার্থীর উপর অভিভাবক রিভিউ' })).toBeVisible();
  await expect(page).toHaveTitle(/অভিভাবক রিভিউ/);
  await expectAccessible(page);
  await page.getByRole('button', { name: 'শুরু করুন' }).click();
  await expect(page.getByRole('heading', { name: 'আপনার সন্তান কোন শ্রেণিতে পড়ে?' })).toBeVisible();
  await expectAccessible(page);
  await page.getByRole('radio', { name: /^নার্সারি/ }).click();
  await page.getByRole('radio', { name: 'শাখা A' }).click();
  await page.getByRole('button', { name: 'নার্সারি · শাখা A · চালিয়ে যান' }).click();

  const field = page.getByLabel('বাবা বা মায়ের মোবাইল নম্বর');
  await field.fill('01800000000');
  await page.getByRole('button', { name: 'খুঁজুন' }).click();
  await expect(page.getByText('নার্সারি · শাখা A-তে এই নম্বরের কোনো শিক্ষার্থী পাওয়া যায়নি')).toBeVisible();
  await expectAccessible(page);

  await field.fill('০১৭০০-০০০০০২');
  await expect(page.getByText('০১৭০০-০০০০০২ · ১১ সংখ্যা')).toBeVisible();
  await page.getByRole('button', { name: 'খুঁজুন' }).click();
  await expect(page.getByRole('heading', { name: 'কার জন্য রিভিউ দিচ্ছেন?' })).toBeVisible();
  const kids = page.getByRole('radiogroup', { name: 'কার জন্য রিভিউ দিচ্ছেন?' }).getByRole('radio');
  await expect(kids).toHaveCount(2);
  await expect(page.getByRole('button', { name: /প্রশ্ন শুরু করুন/ })).toBeDisabled();
  await kids.filter({ hasText: 'Hamza Rahim' }).click();
  await page.getByLabel('আপনার নাম').fill('রহিম উদ্দিন');
  await page.getByRole('radio', { name: 'পিতা' }).click();
  await expect(page.getByLabel('আপনার মোবাইল নম্বর')).toHaveValue('০১৭০০-০০০০০২');
  await expect(page.getByText('যাচাইকৃত · স্কুলের রেকর্ডের সাথে মিলেছে')).toBeVisible();
  await expect(page.getByRole('button', { name: /প্রশ্ন শুরু করুন/ })).toBeEnabled();
  await expectAccessible(page);

  // Names and mobiles never go into the URL; a reload keeps the identity in this tab.
  expect(page.url()).not.toMatch(/01700|রহিম|fx100/);
  await page.reload();
  await expect(page.getByLabel('আপনার নাম')).toHaveValue('রহিম উদ্দিন');

  await page.getByLabel('আপনার মোবাইল নম্বর').fill('01811111111');
  await expect(page.getByText(/অযাচাইকৃত/)).toBeVisible();
  await page.getByRole('radio', { name: 'অন্যান্য' }).click();
  await expect(page.getByRole('button', { name: /প্রশ্ন শুরু করুন/ })).toBeDisabled();
  await page.getByLabel(/সম্পর্ক লিখুন/).fill('মামা');
  await expect(page.getByRole('button', { name: /প্রশ্ন শুরু করুন/ })).toBeEnabled();
});

test('a student ID only matches within the chosen class', async ({ page }) => {
  await toIdentify(page, G1);
  await page.getByRole('radio', { name: 'শিক্ষার্থী আইডি' }).click();
  const field = page.getByLabel('শিক্ষার্থী আইডি', { exact: true });
  // fx10037 is in KG A, not Nursery A.
  await field.fill('fx10037');
  await page.getByRole('button', { name: 'খুঁজুন' }).click();
  await expect(page.getByText('নার্সারি · শাখা A-তে এই আইডির কোনো শিক্ষার্থী পাওয়া যায়নি')).toBeVisible();
  await field.fill('fx10012');
  await page.getByRole('button', { name: 'খুঁজুন' }).click();
  await expect(page.getByRole('heading', { name: 'এটি কি আপনার সন্তান?' })).toBeVisible();
  await expect(page.getByRole('radio', { name: /Maryam Binte Rafiq/ })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByLabel('আপনার মোবাইল নম্বর')).toHaveValue('');
  await expectAccessible(page);
});
