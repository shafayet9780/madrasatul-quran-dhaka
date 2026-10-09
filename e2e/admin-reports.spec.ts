import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { loadFixtures } from './survey-fixtures';

// T1 reports against the Neon dev database fixtures (October round open, September closed).

test.describe.configure({ mode: 'serial' });
test.beforeAll(() => loadFixtures());
test.use({ httpCredentials: { username: 'playwright-editor', password: 'playwright-test-password' } });

async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

test('finds a student and opens the profile', async ({ page }) => {
  await page.goto('/admin/reports');
  await expect(page.getByRole('heading', { name: 'ক্লাস ও শিক্ষার্থী', level: 1 })).toBeVisible();
  await expectAccessible(page);
  await page.getByLabel('নাম, আইডি বা রোল').fill('zayan');
  await page.getByRole('link', { name: /Zayan Mahmud/ }).click();
  await expect(page.getByRole('heading', { name: 'Zayan Mahmud', level: 1 })).toBeVisible();
  // An October G2 form beside the teachers → the comparison; the teacher tab is open first.
  await expect(page.getByRole('heading', { name: 'তুলনা · শিক্ষক বনাম অভিভাবক' })).toBeVisible();
  await expect(page.getByRole('row', { name: /^গড়/ }).first()).toBeVisible();
  await expect(page.getByText('ক্লাসে মনোযোগ ভালো, তবে সহপাঠীদের সাথে মাঝে মাঝে ঝগড়া করে।')).toBeVisible();
  await expectAccessible(page);
});

test('class page lists every student, sorts and exports', async ({ page }) => {
  await page.goto('/admin/reports');
  await page.getByRole('link', { name: /নার্সারি A/ }).click();
  await expect(page.getByRole('heading', { name: 'নার্সারি A', level: 1 })).toBeVisible();
  await expect(page.getByText('২০/২০')).toBeVisible();
  const table = page.getByRole('table', { name: 'শিক্ষার্থী তালিকা' });
  await expect(table.getByRole('row')).toHaveCount(21);
  await table.getByRole('button', { name: /শিক্ষকদের গড়/ }).click();
  await expect(table.getByRole('columnheader', { name: /শিক্ষকদের গড়/ })).toHaveAttribute('aria-sort', 'descending');
  await expectAccessible(page);
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Excel' }).click();
  expect((await download).suggestedFilename()).toMatch(/^নার্সারি A - অক্টোবর ২০২৬ \(নমুনা\)\.xlsx$/);
});

test('class page sets guardians beside teachers', async ({ page }) => {
  await page.goto('/admin/reports');
  await page.getByRole('link', { name: /নার্সারি A/ }).click();
  await expect(page.getByText(/অভিভাবকের সাড়া ৫\/২০/)).toBeVisible();
  const table = page.getByRole('table', { name: 'শিক্ষার্থী তালিকা' });
  await expect(table.getByRole('columnheader', { name: /অভিভাবক \(\/১০\)/ })).toBeVisible();
  const zayan = table.getByRole('row', { name: /Zayan Mahmud/ });
  await expect(zayan.getByText('১০.০')).toBeVisible();
  await expect(zayan.getByText('যাচাইকৃত')).toBeVisible();
  await expect(table.getByRole('row', { name: /Maryam Binte Rafiq/ }).getByText('সাড়া নেই')).toBeVisible();
  // Attendance: guardians 10.0, teachers 8.3, at least 1 mark apart.
  const areas = page.getByRole('table', { name: 'ক্ষেত্রভিত্তিক তুলনা' });
  await expect(areas.getByRole('row', { name: /^উপস্থিতি/ })).toContainText('⚠');
  await expect(areas.getByRole('row', { name: /^গড়/ })).toBeVisible();
  await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/r3.png` : undefined, fullPage: true });
  await expectAccessible(page);
  // Verified only: Hamza's current form (his uncle, a number not on record) drops out; 4 guardians remain.
  await expect(page.getByText(/৫\/২০ জনের অভিভাবক/)).toBeVisible();
  await page.getByLabel('শুধু যাচাইকৃত').check();
  await expect(page.getByText('· শুধু যাচাইকৃত অভিভাবক')).toBeVisible();
  await expect(page.getByText(/৪\/২০ জনের অভিভাবক/)).toBeVisible();
});

test('student profile shows all three answer sets and prints a page for the guardian', async ({ page }) => {
  await page.goto('/admin/reports');
  await page.getByLabel('নাম, আইডি বা রোল').fill('zayan');
  await page.getByRole('link', { name: /Zayan Mahmud/ }).click();
  await page.getByRole('tab', { name: /অভিভাবক · শিক্ষার্থী/ }).click();
  await expect(page.getByText('উপস্থিতি > ৯০%')).toBeVisible();
  await expect(page.getByText('বাসায় খুব শান্ত থাকে, মাদরাসা থেকে কোনো অভিযোগ আসেনি।')).toBeVisible();
  await expect(page.getByText(/মো\. মাহমুদুল করিম \(পিতা\)/).first()).toBeVisible();
  await expectAccessible(page);
  // The class-management form: question × subject marks and the comment.
  await page.getByRole('tab', { name: /অভিভাবক · ক্লাস পরিচালনা/ }).click();
  await expect(page.getByRole('tabpanel').getByRole('columnheader', { name: 'বাংলা' })).toBeVisible();
  await expect(page.getByText('আলহামদুলিল্লাহ, শিক্ষকরা খুব যত্নশীল।')).toBeVisible();
  await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/r4.png` : undefined, fullPage: true });
  await expectAccessible(page);

  await page.getByRole('link', { name: 'অভিভাবকের জন্য প্রিন্ট' }).click();
  const sheet = page.getByRole('article', { name: 'অভিভাবকের জন্য প্রতিবেদন' });
  await expect(sheet.getByRole('heading', { name: 'Zayan Mahmud', level: 1 })).toBeVisible();
  await expect(sheet.getByRole('row', { name: /উপস্থিতি/ })).toBeVisible();
  await expect(sheet.getByRole('heading', { name: 'শক্তির দিক' })).toBeVisible();
  // The class-management review as the guardian's own average per subject.
  await expect(sheet.getByRole('heading', { name: 'ক্লাস পরিচালনা · আপনার মূল্যায়ন' })).toBeVisible();
  await expect(sheet.getByRole('columnheader', { name: 'বাংলা' })).toBeVisible();
  // No teacher names or notes on the guardian's copy (every fixture teacher and the fixture note).
  for (const text of ['উস্তাদ আব্দুল্লাহ', 'উস্তাদ হামযা', 'উস্তাযা মারইয়াম', 'উস্তাযা সুমাইয়া', 'উস্তাদ ইউসুফ', 'ক্লাসে মনোযোগ ভালো']) {
    await expect(sheet.getByText(text, { exact: false })).toHaveCount(0);
  }
  await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/r4-print.png` : undefined, fullPage: true });
  // All 7 student areas and the class-management marks fit on one A4 page.
  const pdf = (await page.pdf({ preferCSSPageSize: true, printBackground: true, path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/print.pdf` : undefined })).toString('latin1');
  expect(pdf.match(/\/Type\s*\/Page[^s]/g)).toHaveLength(1);
  await expectAccessible(page);
});

test('the internal print has all three reviews, the notes and the history, within the page width', async ({ page }) => {
  await page.goto('/admin/reports');
  await page.getByLabel('নাম, আইডি বা রোল').fill('zayan');
  await page.getByRole('link', { name: /Zayan Mahmud/ }).click();
  await page.getByRole('link', { name: 'অভ্যন্তরীণ প্রিন্ট' }).click();
  const sheet = page.getByRole('article', { name: 'অভ্যন্তরীণ প্রতিবেদন' });
  for (const name of ['শিক্ষকদের উত্তর', 'অভিভাবকের উত্তর · শিক্ষার্থী সম্পর্কে', 'অভিভাবকের উত্তর · ক্লাস পরিচালনা', 'সব জমা · ইতিহাস']) {
    await expect(sheet.getByRole('heading', { name, exact: true })).toBeVisible();
  }
  await expect(sheet.getByText('ক্লাসে মনোযোগ ভালো, তবে সহপাঠীদের সাথে মাঝে মাঝে ঝগড়া করে।')).toBeVisible();
  await expect(sheet.getByText('আলহামদুলিল্লাহ, শিক্ষকরা খুব যত্নশীল।')).toBeVisible();
  await expect(sheet.getByText('বর্তমান').first()).toBeVisible();
  await expectAccessible(page);
  // On paper (A4 less the margins, about 690px) nothing runs past the sheet.
  await page.setViewportSize({ width: 690, height: 1000 });
  await page.emulateMedia({ media: 'print' });
  const outside = await sheet.evaluate((el) => {
    const right = el.getBoundingClientRect().right;
    return [...el.querySelectorAll('*')].filter((n) => n.getBoundingClientRect().right > right + 1).length;
  });
  expect(outside).toBe(0);
});

test('a "not applicable" answer shows its label', async ({ page }) => {
  await page.goto('/admin/reports');
  await page.getByLabel('নাম, আইডি বা রোল').fill('safiya');
  await page.getByRole('link', { name: /Safiya Rahman/ }).click();
  await page.getByRole('tab', { name: /অভিভাবক · শিক্ষার্থী/ }).click();
  await expect(page.getByText('প্রযোজ্য নয় (ডে কেয়ার)')).toBeVisible();
});

test('report pages handle unknown students, classes and bad parameters', async ({ page }) => {
  for (const url of ['/admin/reports/student/nobody', '/admin/reports/student/nobody/guardian-print']) {
    await page.goto(url);
    await expect(page.getByText('শিক্ষার্থী পাওয়া যায়নি।')).toBeVisible();
  }
  await page.goto('/admin/reports/class?class=nope');
  await expect(page.getByText('শ্রেণিটি এই রাউন্ডে নেই।')).toBeVisible();
  // Unknown ids fall back to the defaults instead of failing.
  await page.goto('/admin/reports/teaching?round=bad&compare=bad&area=bad&cell=x|y|z');
  await expect(page.getByRole('heading', { name: 'নির্বাচিত ঘর' })).toBeVisible();
  await page.goto('/admin/reports/overview?round=bad&g1=bad&g2=bad&compare=bad');
  await expect(page.getByRole('heading', { name: 'মনোযোগ প্রয়োজন' })).toBeVisible();
  await page.goto('/admin/reports/class?class=nursery&section=a&round=bad&verified=1');
  await expect(page.getByRole('heading', { name: 'শিক্ষার্থী তালিকা' })).toBeVisible();
  const response = await page.request.get('/admin/reports/export?kind=class&round=bad&class=nursery&section=a');
  expect(response.status()).toBe(404);
});

test('question results show every question, answer counts and comments', async ({ page }) => {
  await page.goto('/admin/reports');
  await page.getByRole('link', { name: 'প্রশ্নভিত্তিক ফলাফল' }).click();
  await expect(page.getByRole('heading', { name: 'প্রশ্নভিত্তিক ফলাফল', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'শিক্ষার্থী · শিক্ষকদের মার্ক' })).toBeVisible();
  await expect(page.getByText('গণিতের হোমওয়ার্ক একটু কমালে ভালো হয়।')).toBeVisible();
  await expect(page.getByText('মার্ক নেই').first()).toBeVisible();
  await expectAccessible(page);
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Excel' }).click();
  expect((await download).suggestedFilename()).toContain('প্রশ্নভিত্তিক ফলাফল');
});

test('rater patterns compare teachers', async ({ page }) => {
  await page.goto('/admin/reports/raters');
  await expect(page.getByRole('heading', { name: 'শিক্ষকদের রেটিং প্যাটার্ন', level: 1 })).toBeVisible();
  await expect(page.getByRole('row', { name: /উস্তাদ আব্দুল্লাহ/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /উস্তাযা সুমাইয়া/ })).toBeVisible();
  await expectAccessible(page);
});

test('the overview pairs guardian rounds with the teacher round and lists children needing attention', async ({ page }) => {
  await page.goto('/admin/reports/overview');
  await expect(page.getByRole('heading', { name: 'ওভারভিউ', level: 1 })).toBeVisible();
  // The guardian rounds that ran with the October teacher round were picked by date.
  await page.getByRole('button', { name: /আরও বিকল্প/ }).click();
  await expect(page.getByRole('menuitemradio', { name: 'স্বয়ংক্রিয় (অক্টোবর ২০২৬ · ক্লাস পরিচালনা (নমুনা))' })).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByText('শিক্ষার মান · শ্রেণি × বিষয় (অভিভাবকদের গড় মার্ক)')).toBeVisible();
  await expect(page.getByRole('link', { name: /নার্সারি A · কুরআন: গড়/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'মনোযোগ প্রয়োজন' })).toBeVisible();
  await expectAccessible(page);
});

test('teaching quality shows the class × subject heatmap with details, verified-only and Excel', async ({ page }) => {
  await page.goto('/admin/reports/teaching');
  await expect(page.getByRole('heading', { name: 'শিক্ষার মান', level: 1 })).toBeVisible();
  const cell = page.getByRole('link', { name: /নার্সারি A · কুরআন: গড় .*, ৭ জন উত্তরদাতা/ });
  await expect(cell).toBeVisible();
  // Fewer than 3 guardians elsewhere: hidden.
  await expect(page.getByRole('link', { name: /কেজি A · কুরআন: ০ জন উত্তরদাতা, ফলাফল লুকানো/ })).toBeVisible();
  await expectAccessible(page);

  await cell.click();
  const detail = page.getByRole('region', { name: 'নার্সারি A · কুরআন' });
  await expect(detail.getByText('প্রশ্নভিত্তিক মার্কের বণ্টন')).toBeVisible();
  await expect(detail.getByText('৭', { exact: true })).toBeVisible();
  await expect(detail.getByText('গণিতের হোমওয়ার্ক একটু কমালে ভালো হয়।')).toBeVisible();
  await expectAccessible(page);

  // Only one Nursery A form is verified: with "শুধু যাচাইকৃত" the cell is hidden.
  await page.getByLabel('শুধু যাচাইকৃত').check();
  await expect(page.getByRole('link', { name: /নার্সারি A · কুরআন: ১ জন উত্তরদাতা, ফলাফল লুকানো/ })).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Excel' }).click();
  expect((await download).suggestedFilename()).toContain('শিক্ষার মান');
});
