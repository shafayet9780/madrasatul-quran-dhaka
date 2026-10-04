import { execFileSync } from 'node:child_process';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Teacher survey (T1) against the Neon dev database; fixtures are reloaded before and after.
const loadFixtures = () => execFileSync('pnpm', ['survey:fixtures'], { stdio: 'ignore' });
const LINK = '/survey/fixture-t1?k=fixture-open-link-key-000';

test.describe.configure({ mode: 'serial' });
test.beforeAll(loadFixtures);
test.afterAll(loadFixtures);

async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

async function pickBatch(page: Page, teacher: string, cls: string, section: string | null, subject: string) {
  await page.goto(LINK);
  await page.getByRole('button', { name: 'শুরু করুন' }).click();
  await page.getByRole('button', { name: teacher }).click();
  await page.getByRole('button', { name: 'পরবর্তী ধাপ' }).click();
  await page.getByRole('radio', { name: cls, exact: true }).click();
  if (section) await page.getByRole('radio', { name: section }).click();
  await page.getByRole('radio', { name: new RegExp(`^${subject}`) }).click();
}

/** Marks every student on every question with the first mark (১০), question by question. */
async function markAll(page: Page, questions = 7) {
  for (let q = 0; q < questions; q++) {
    await expect(page.getByText(`প্রশ্ন ${'১২৩৪৫৬৭'[q]} / ৭`).first()).toBeVisible();
    for (const group of await page.getByRole('radiogroup').all()) {
      if (await group.isVisible()) await group.getByRole('radio').first().click();
    }
    await page.getByRole('button', { name: q === questions - 1 ? 'দেখে নিয়ে জমা দিন' : 'পরের প্রশ্ন' }).filter({ visible: true }).first().click();
  }
}

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('a teacher rates a class, submits and gets a receipt', async ({ page }) => {
    await page.goto(LINK);
    await expect(page.getByRole('heading', { name: 'স্টুডেন্ট সম্পর্কে শিক্ষকের রিভিউ' })).toBeVisible();
    await expectAccessible(page);

    await page.getByRole('button', { name: 'শুরু করুন' }).click();
    await expect(page.getByRole('heading', { name: 'আপনার নাম বাছাই করুন' })).toBeVisible();
    await page.getByLabel('শিক্ষকের নাম খুঁজুন').fill('মারইয়াম');
    await expect(page.getByRole('button', { name: /উস্তাদ/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'উস্তাযা মারইয়াম' }).click();
    await expectAccessible(page);
    await page.getByRole('button', { name: 'পরবর্তী ধাপ' }).click();

    await page.getByRole('radio', { name: 'কেজি', exact: true }).click();
    await page.getByRole('radio', { name: 'শাখা A' }).click();
    await page.getByRole('radio', { name: 'বাংলা' }).click();
    await expect(page.getByText('কেজি · শাখা A · বাংলা')).toBeVisible();
    await expectAccessible(page);
    await page.getByRole('button', { name: 'শুরু করুন' }).click();

    await expect(page.getByText('৫ জন বাকি')).toBeVisible();
    await expectAccessible(page);
    await markAll(page);

    await expect(page.getByRole('heading', { name: 'দেখে নিয়ে জমা দিন' })).toBeVisible();
    await expect(page.getByText('৫ জন · ৭টি প্রশ্ন · সব পূর্ণ')).toBeVisible();
    await expectAccessible(page);

    await page.getByRole('button', { name: 'নোট যোগ করুন: Hafsa Akter' }).click();
    await page.getByRole('textbox', { name: 'নোট', exact: true }).fill('আরবি পড়ায় খুব আগ্রহী।');
    await page.getByRole('button', { name: 'সংরক্ষণ' }).click();
    await expect(page.getByText('১টি নোট')).toBeVisible();

    await page.getByRole('button', { name: 'জমা দিন' }).click();
    await expect(page).toHaveURL(/\/survey\/receipt\//);
    await expect(page.getByRole('heading', { name: 'রিভিউ জমা হয়েছে' })).toBeVisible();
    await expect(page.getByText('উস্তাযা মারইয়াম')).toBeVisible();
    await expect(page.getByText('আরবি পড়ায় খুব আগ্রহী।')).toBeVisible();
    await expectAccessible(page);
  });

  test('marks survive a reload and the draft can be resumed', async ({ page }) => {
    await pickBatch(page, 'উস্তাদ ইউসুফ', 'প্লে', null, 'গণিত');
    await page.getByRole('button', { name: 'শুরু করুন' }).click();
    const first = page.getByRole('radiogroup').first();
    await first.getByRole('radio', { name: '৮ মার্ক' }).click();
    await expect(page.getByText('● সংরক্ষিত')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('radiogroup').first().getByRole('radio', { name: '৮ মার্ক' })).toHaveAttribute('aria-checked', 'true');

    await page.goto(`${LINK}&step=class&t=ustad-yusuf`);
    await expect(page.getByText('অসমাপ্ত রিভিউ')).toBeVisible();
    await expect(page.getByText('৪ জনের মধ্যে ০ জন সম্পন্ন')).toBeVisible();
  });

  test('blocks an incomplete submit and lists the gaps', async ({ page }) => {
    await page.goto(`${LINK}&step=review&t=ustad-yusuf&c=play&sub=math`);
    await expect(page.getByRole('heading', { name: 'আর একটু বাকি' })).toBeVisible();
    await expect(page.getByRole('button', { name: /জমা দিন \(.+টি বাকি\)/ })).toBeDisabled();
    await expectAccessible(page);
    await page.getByRole('button', { name: 'প্রথম বাকি মার্কে যান' }).click();
    await expect(page.getByText('প্রশ্ন ১ / ৭').first()).toBeVisible();
  });

  test('warns when another teacher already submitted the class and subject', async ({ page }) => {
    await pickBatch(page, 'উস্তাদ হামযা', 'নার্সারি', 'শাখা A', 'কুরআন');
    await page.getByRole('button', { name: 'শুরু করুন' }).click();
    const sheet = page.getByRole('dialog', { name: 'এই ক্লাস ও বিষয়ের রিভিউ আগেই জমা হয়েছে' });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText('উস্তাদ আব্দুল্লাহ')).toBeVisible();
    await expectAccessible(page);
    await sheet.getByRole('button', { name: 'তবুও চালিয়ে যান' }).click();
    await expect(page.getByText('২০ জন বাকি')).toBeVisible();
  });

  test('edits a submitted batch from the receipt', async ({ page }) => {
    await page.goto(`${LINK}&step=review&t=ustad-abdullah&c=nursery&s=a&sub=quran`);
    await page.getByRole('button', { name: 'Ahmad Shafin Islam, প্রশ্ন ১: ১০। বদলাতে চাপ দিন' }).click();
    const sheet = page.getByRole('dialog', { name: /Ahmad Shafin Islam · প্রশ্ন ১/ });
    await sheet.getByRole('radio', { name: '৬ মার্ক' }).click();
    await sheet.getByRole('button', { name: 'সম্পন্ন' }).click();
    await expect(page.getByRole('button', { name: 'Ahmad Shafin Islam, প্রশ্ন ১: ৬। বদলাতে চাপ দিন' })).toBeVisible();
    await page.getByRole('button', { name: 'জমা দিন' }).first().click();
    await expect(page).toHaveURL(/\/survey\/receipt\//);
    await expect(page.getByRole('heading', { name: 'রিভিউ জমা হয়েছে' })).toBeVisible();
    await expect(page.getByRole('link', { name: /সংশোধন করুন/ })).toBeVisible();
  });
});

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test('rates in two columns and reviews in a table', async ({ page }) => {
    await page.goto(`${LINK}&step=rate&t=ustad-abdullah&c=nursery&s=b&sub=quran&q=1`);
    await expect(page.getByRole('navigation', { name: 'প্রশ্নসমূহ' })).toBeVisible();
    await expectAccessible(page);
    await page.goto(`${LINK}&step=review&t=ustad-abdullah&c=nursery&s=b&sub=quran`);
    await expect(page.getByRole('columnheader', { name: /মনোযোগ/ })).toBeVisible();
    await expectAccessible(page);
  });
});

test.describe('link states', () => {
  test('a wrong key shows the invalid-link page', async ({ page }) => {
    await page.goto('/survey/fixture-t1?k=wrong');
    await expect(page.getByRole('heading', { name: 'লিংকটি সঠিক নয়' })).toBeVisible();
  });

  test('a closed round shows the closed page', async ({ page }) => {
    await page.goto('/survey/fixture-t1-old?k=fixture-closed-link-key-0');
    await expect(page.getByRole('heading', { name: 'এই রাউন্ডের সময় শেষ হয়েছে' })).toBeVisible();
    await expectAccessible(page);
  });

  test('survey pages are not indexed', async ({ page }) => {
    await page.goto(LINK);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});
