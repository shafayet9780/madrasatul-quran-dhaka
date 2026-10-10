import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { loadFixtures } from './survey-fixtures';

// Guardian identity (G1/G2) against the Neon dev database; fixtures are reloaded before and after.
const G2 = '/survey/fixture-g2?k=fixture-g2-link-key-00000';
const G1 = '/survey/fixture-g1?k=fixture-g1-link-key-00000';
const G1Q = '/survey/fixture-g1-q?k=fixture-g1q-link-key-0000';

test.describe.configure({ mode: 'serial' });
test.beforeAll(() => loadFixtures());
test.afterAll(() => loadFixtures());
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
  await expect(page.getByRole('button', { name: /শুরু করুন/ })).toBeDisabled();
  await kids.filter({ hasText: 'Hamza Rahim' }).click();
  // The sample data already has a form for Hamza: the guardian is told before starting.
  await expect(page.getByText('এই শিক্ষার্থীর রিভিউ আগেই জমা হয়েছে')).toBeVisible();
  await page.getByLabel('আপনার নাম').fill('রহিম উদ্দিন');
  await page.getByRole('radio', { name: 'পিতা' }).click();
  await expect(page.getByLabel('আপনার মোবাইল নম্বর')).toHaveValue('০১৭০০-০০০০০২');
  await expect(page.getByText('যাচাইকৃত · স্কুলের রেকর্ডের সাথে মিলেছে')).toBeVisible();
  await expect(page.getByRole('button', { name: /শুরু করুন/ })).toBeEnabled();
  await expectAccessible(page);

  // Names and mobiles never go into the URL; a reload keeps the identity in this tab.
  expect(page.url()).not.toMatch(/01700|রহিম|fx100/);
  await page.reload();
  await expect(page.getByLabel('আপনার নাম')).toHaveValue('রহিম উদ্দিন');

  await page.getByLabel('আপনার মোবাইল নম্বর').fill('01811111111');
  await expect(page.getByText(/অযাচাইকৃত/)).toBeVisible();
  await page.getByRole('radio', { name: 'অন্যান্য' }).click();
  await expect(page.getByRole('button', { name: /শুরু করুন/ })).toBeDisabled();
  await page.getByLabel(/সম্পর্ক লিখুন/).fill('মামা');
  await expect(page.getByRole('button', { name: /শুরু করুন/ })).toBeEnabled();
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

test('a link straight to a later step without an identity in this tab starts at the class', async ({ page }) => {
  await page.goto(`${G2}&step=match`);
  await expect(page.getByRole('heading', { name: 'আপনার সন্তান কোন শ্রেণিতে পড়ে?' })).toBeVisible();
});

test('the back button returns to the search with the number kept, and a new search replaces the prefilled mobile', async ({ page }) => {
  await toIdentify(page);
  const field = page.getByLabel('বাবা বা মায়ের মোবাইল নম্বর');
  await field.fill('01700000001');
  await page.getByRole('button', { name: 'খুঁজুন' }).click();
  await expect(page.getByRole('heading', { name: 'এটি কি আপনার সন্তান?' })).toBeVisible();
  await expect(page.getByLabel('আপনার মোবাইল নম্বর')).toHaveValue('01700000001');
  await page.goBack();
  await expect(field).toHaveValue('01700000001');
  await field.fill('+44 7700 900123');
  await page.getByRole('button', { name: 'খুঁজুন' }).click();
  await expect(page.getByRole('heading', { name: 'কার জন্য রিভিউ দিচ্ছেন?' })).toBeVisible();
  await expect(page.getByLabel('আপনার মোবাইল নম্বর')).toHaveValue('+44 7700 900123');
  await page.getByRole('radio', { name: /Yahya Hasan/ }).click();
  // A parent abroad is verified too.
  await expect(page.getByText('যাচাইকৃত · স্কুলের রেকর্ডের সাথে মিলেছে')).toBeVisible();
});

test.describe('G2 questions', () => {
  async function toQuestions(page: Page) {
    await toIdentify(page);
    await page.getByLabel('বাবা বা মায়ের মোবাইল নম্বর').fill('01700000001');
    await page.getByRole('button', { name: 'খুঁজুন' }).click();
    await page.getByLabel('আপনার নাম').fill('রফিকুল ইসলাম');
    await page.getByRole('radio', { name: 'পিতা' }).click();
    await page.getByRole('button', { name: /রিভিউ শুরু করুন|প্রশ্ন শুরু করুন/ }).click();
  }

  test('a guardian answers, reviews, submits and gets a receipt; a second form replaces the first', async ({ page }) => {
    await toQuestions(page);
    await expect(page.getByRole('heading', { name: 'নিয়মিত ক্লাস করে কি না?' })).toBeVisible();
    await expect(page.getByText('প্রশ্ন ১/৪')).toBeVisible();
    await expectAccessible(page);
    await page.getByRole('radio', { name: 'উপস্থিতি > ৯০%' }).click();
    await page.getByRole('button', { name: 'পরের প্রশ্ন' }).click();

    await expect(page.getByText('নন ডে কেয়ার শিক্ষার্থীদের জন্য প্রযোজ্য')).toBeVisible();
    await page.getByRole('radio', { name: /প্রযোজ্য নয় \(ডে কেয়ার\)/ }).click();
    await expectAccessible(page);
    // A reload keeps the answers on this phone.
    await page.reload();
    await expect(page.getByRole('radio', { name: /প্রযোজ্য নয় \(ডে কেয়ার\)/ })).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('button', { name: 'পরের প্রশ্ন' }).click();
    await page.getByRole('radio', { name: 'দেখে না' }).click();
    await page.getByRole('button', { name: 'পরের প্রশ্ন' }).click();
    // Skip the last question: review blocks the submit.
    await page.getByRole('button', { name: 'দেখে নিয়ে জমা দিন' }).click();
    await expect(page.getByRole('heading', { name: 'দেখে নিয়ে জমা দিন' })).toBeVisible();
    await expect(page.getByText('উত্তর দেওয়া হয়নি')).toBeVisible();
    await expect(page.getByRole('button', { name: 'জমা দিন' })).toBeDisabled();
    await expectAccessible(page);
    await page.getByRole('button', { name: 'প্রশ্ন ৪ বদলান' }).click();
    await page.getByRole('radio', { name: 'আসে না' }).click();
    await page.getByRole('button', { name: 'দেখে নিয়ে জমা দিন' }).click();
    await page.getByLabel(/কোন পরামর্শ ও মন্তব্য/).fill('আলহামদুলিল্লাহ, ভালো লাগছে।');
    await page.getByRole('button', { name: 'জমা দিন' }).click();

    await expect(page).toHaveURL(/\/survey\/receipt\//);
    await expect(page.getByRole('heading', { name: 'জমা হয়েছে' })).toBeVisible();
    await expect(page.getByText('Maryam Binte Rafiq · নার্সারি A')).toBeVisible();
    await expect(page.getByText('রফিকুল ইসলাম (পিতা)')).toBeVisible();
    await expect(page.getByText('যাচাইকৃত', { exact: true })).toBeVisible();
    await expect(page.getByText('প্রযোজ্য নয় (ডে কেয়ার)')).toBeVisible();
    await expect(page.getByText('আলহামদুলিল্লাহ, ভালো লাগছে।')).toBeVisible();
    await expectAccessible(page);
    const firstReceipt = page.url();

    // Another form for the same child: the guardian is warned first, and the new one counts.
    await page.getByRole('link', { name: 'অন্য সন্তানের জন্য রিভিউ দিন' }).click();
    await expect(page.getByRole('heading', { name: 'আপনার সন্তান কোন শ্রেণিতে পড়ে?' })).toBeVisible();
    await page.getByRole('button', { name: 'নার্সারি · শাখা A · চালিয়ে যান' }).click();
    await page.getByLabel('বাবা বা মায়ের মোবাইল নম্বর').fill('01700000001');
    await page.getByRole('button', { name: 'খুঁজুন' }).click();
    await expect(page.getByText('এই শিক্ষার্থীর রিভিউ আগেই জমা হয়েছে')).toBeVisible();
    await expect(page.getByLabel('আপনার নাম')).toHaveValue('রফিকুল ইসলাম');
    await page.getByRole('button', { name: 'নতুন রিভিউ শুরু করুন' }).click();
    await expect(page.getByRole('radio', { name: 'উপস্থিতি > ৯০%' })).toHaveAttribute('aria-checked', 'false');
    for (const answer of ['উপস্থিতি ৮০–৯০%', '২ ঘন্টা +', 'দেখে না', 'আসে না']) {
      await page.getByRole('radio', { name: answer }).click();
      await page.getByRole('button', { name: /পরের প্রশ্ন|দেখে নিয়ে জমা দিন/ }).click();
    }
    await page.getByRole('button', { name: 'জমা দিন' }).click();
    await expect(page).toHaveURL(/\/survey\/receipt\//);
    await page.goto(firstReceipt);
    await expect(page.getByText('এই রিভিউ পরে সংশোধন করা হয়েছে।')).toBeVisible();
  });

  test('desktop shows the questions beside their list', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await toQuestions(page);
    await expect(page.getByRole('navigation', { name: 'প্রশ্নসমূহ' })).toBeVisible();
    // The verified answer from the match screen stays with the guardian on the questions.
    await expect(page.locator('header').getByText('যাচাইকৃত', { exact: true })).toBeVisible();
    await expectAccessible(page);
  });
});

test.describe('G1 teaching review', () => {
  // The earlier groups look 01700000001 up about 7 times; the per-number lookup limit is 10 in 10
  // minutes (guardianValue), so this group starts with fresh counters.
  test.beforeAll(() => loadFixtures('rate-limits'));

  async function toRating(page: Page, link: string, mobile = '01700000001', place: [RegExp, string | null] = [/^নার্সারি/, 'শাখা A']) {
    await page.goto(link);
    await page.getByRole('button', { name: 'শুরু করুন' }).click();
    await page.getByRole('radio', { name: place[0] }).click();
    if (place[1]) await page.getByRole('radio', { name: place[1] }).click();
    await page.getByRole('button', { name: /চালিয়ে যান/ }).click();
    await page.getByLabel('বাবা বা মায়ের মোবাইল নম্বর').fill(mobile);
    await page.getByRole('button', { name: 'খুঁজুন' }).click();
    await page.getByLabel('আপনার নাম').fill('রফিকুল ইসলাম');
    await page.getByRole('radio', { name: 'পিতা' }).click();
    await page.getByRole('button', { name: /শুরু করুন/ }).click();
  }

  /** Marks every row on the screen with the first mark (১০). */
  async function markAll(page: Page) {
    for (const group of await page.getByRole('radiogroup').all()) await group.getByRole('radio').first().click();
  }

  test('one subject per screen: every question per subject, review by subject, receipt table', async ({ page }) => {
    await toRating(page, G1);
    await expect(page.getByRole('heading', { name: 'কুরআন' })).toBeVisible();
    await expect(page.getByText('বিষয় ১/৫')).toBeVisible();
    await expect(page.getByText('১০ = পরিমাণ ঠিক আছে, ৪ = অনেক বেশি')).toBeVisible();
    await expectAccessible(page);
    for (let subject = 0; subject < 5; subject++) {
      await markAll(page);
      if (subject === 0) {
        await expectAccessible(page);
        await expect(page.getByRole('button', { name: 'পরের বিষয়: আরবি' })).toBeVisible();
      }
      if (subject === 3) {
        // A reload keeps the subject and its marks.
        await page.reload();
        await expect(page.getByRole('heading', { name: 'ইংরেজি' })).toBeVisible();
        await expect(page.getByText('বিষয় ৪/৫')).toBeVisible();
      }
      await page.getByRole('button', { name: subject === 4 ? 'দেখে নিয়ে জমা দিন' : /পরের বিষয়/ }).click();
    }
    await expect(page.getByRole('heading', { name: 'দেখে নিয়ে জমা দিন' })).toBeVisible();
    await expect(page.getByText('৫টি বিষয় × ৩টি প্রশ্ন', { exact: false })).toBeVisible();
    await expectAccessible(page);
    await page.getByRole('button', { name: 'গণিত বদলান' }).click();
    await page.getByRole('radiogroup').nth(1).getByRole('radio', { name: '৬ মার্ক' }).click();
    await page.getByRole('button', { name: 'দেখে নিয়ে জমা দিন' }).click();
    await page.getByRole('button', { name: 'জমা দিন' }).click();
    await expect(page).toHaveURL(/\/survey\/receipt\//);
    await expect(page.getByRole('heading', { name: 'জমা হয়েছে' })).toBeVisible();
    const row = page.getByRole('row', { name: /অতিরিক্ত হোমওয়ার্ক/ });
    await expect(row.getByRole('cell').nth(4)).toHaveText('৬');
    await expectAccessible(page);
  });

  test('one question per screen: every subject per question, a missing mark blocks submit', async ({ page }) => {
    await toRating(page, G1Q);
    await expect(page.getByRole('heading', { name: 'পড়ানো লেসন আপনার সন্তান শিখেছে কি না?' })).toBeVisible();
    await expect(page.getByText('প্রশ্ন ১/৩')).toBeVisible();
    await expect(page.getByRole('radiogroup')).toHaveCount(5);
    for (let question = 0; question < 3; question++) {
      if (question < 2) await markAll(page);
      else await page.getByRole('radiogroup').first().getByRole('radio').first().click();
      await page.getByRole('button', { name: question === 2 ? 'দেখে নিয়ে জমা দিন' : /পরের প্রশ্ন/ }).click();
    }
    await expect(page.getByText('৩টি প্রশ্ন × ৫টি বিষয়', { exact: false })).toBeVisible();
    await expect(page.getByText('৪টি মার্ক বাকি', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'জমা দিন' })).toBeDisabled();
    await expectAccessible(page);
    await page.getByRole('button', { name: 'প্রশ্ন ৩ বদলান' }).click();
    await markAll(page);
    await page.getByRole('button', { name: 'দেখে নিয়ে জমা দিন' }).click();
    await page.getByRole('button', { name: 'জমা দিন' }).click();
    await expect(page.getByRole('heading', { name: 'জমা হয়েছে' })).toBeVisible();
  });

  test('a class with one subject (Play) rates on one screen', async ({ page }) => {
    await toRating(page, G1Q, '01700000003', [/^প্লে/, null]);
    await expect(page.getByRole('heading', { name: 'সব বিষয়' })).toBeVisible();
    await expect(page.getByText('বিষয় ১/১')).toBeVisible();
    await markAll(page);
    await page.getByRole('button', { name: 'দেখে নিয়ে জমা দিন' }).click();
    await expect(page.getByRole('button', { name: 'জমা দিন' })).toBeEnabled();
  });

  test('desktop shows one table of marks beside the list', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await toRating(page, G1);
    await expect(page.getByRole('navigation', { name: 'বিষয়সমূহ' })).toBeVisible();
    await markAll(page);
    await expectAccessible(page);
    await toRating(page, G1Q);
    await expect(page.getByRole('navigation', { name: 'প্রশ্নসমূহ' })).toBeVisible();
  });
});
