import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Runs against the local preview (pnpm test:e2e:admissions): the converted live form, open now.

const BASE = '/bengali/pre-admission';
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
const PDF = Buffer.from('%PDF-1.4\n%%EOF\n');

async function noSeriousA11yIssues(page: Page) {
  // After a client navigation the title can land a moment after the content.
  await expect(page).toHaveTitle(/\S/);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

async function dismissConsent(page: Page) {
  await page.getByRole('button', { name: 'সব গ্রহণ করুন' }).click({ timeout: 3000 }).catch(() => {});
}

async function start(page: Page, mobile = '০১৭১২-৩৪৫৬৭৮') {
  await page.goto(`${BASE}/start`);
  await dismissConsent(page);
  await page.getByLabel(/অভিভাবকের মোবাইল নম্বর/).fill(mobile);
  await page.getByLabel(/^ইমেইল/).fill('rafiq@gmail.com');
  await page.getByRole('button', { name: 'শুরু করুন' }).click();
  await expect(page).toHaveURL(/\/pre-admission\/form$/);
}

/** Answers every visible field of the current chapter (twice, so show-when fields get filled too). */
async function fillChapter(page: Page) {
  for (let pass = 0; pass < 2; pass++) {
    const groups = page.locator('main [id^="f-"][id$="-group"]');
    for (let i = 0; i < (await groups.count()); i++) {
      const g = groups.nth(i);
      if (!(await g.isVisible())) continue;
      const radios = g.getByRole('radio');
      if ((await radios.count()) > 0) {
        if ((await g.locator('[role=radio][aria-checked=true]').count()) === 0) await radios.first().click();
        continue;
      }
      const boxes = g.getByRole('checkbox');
      if ((await boxes.count()) > 0) {
        if ((await g.locator('[role=checkbox][aria-checked=true]').count()) === 0) await boxes.first().click();
        continue;
      }
      const file = g.locator('input[type=file]').first();
      if ((await file.count()) > 0) {
        if ((await g.getByText('যুক্ত হয়েছে').count()) === 0) {
          const photo = (await file.getAttribute('accept'))?.includes('pdf') === false;
          await file.setInputFiles({ name: photo ? 'photo.jpg' : 'certificate.pdf', mimeType: photo ? 'image/jpeg' : 'application/pdf', buffer: photo ? JPEG : PDF });
          await expect(g.getByText('যুক্ত হয়েছে')).toBeVisible();
        }
        continue;
      }
      const selects = g.locator('select');
      if ((await selects.count()) === 3) {
        await selects.nth(0).selectOption('12');
        await selects.nth(1).selectOption('3');
        await selects.nth(2).selectOption('2021');
        continue;
      }
      if ((await selects.count()) === 1) {
        if (!(await selects.first().inputValue())) await selects.first().selectOption({ index: 1 });
        continue;
      }
      const input = g.locator('input:not([type=file]), textarea').first();
      if ((await input.count()) === 0 || (await input.inputValue())) continue;
      const mode = await input.getAttribute('inputmode');
      await input.fill(mode === 'tel' ? '01812345678' : mode === 'email' ? 'family@gmail.com' : mode === 'numeric' ? '2' : 'পরীক্ষামূলক উত্তর');
      await input.blur();
    }
  }
}

test('a guardian fills in every chapter, reviews, declares, pays after a failed attempt, gets an ID, the PDF and the emails', async ({ page, browser }) => {
  await page.goto(BASE);
  await dismissConsent(page);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('প্রি-অ্যাডমিশন আবেদন');
  await noSeriousA11yIssues(page);
  await page.getByRole('link', { name: /আবেদন শুরু করুন/ }).click();

  await expect(page.getByRole('heading', { name: 'আবেদন শুরু করুন' })).toBeVisible();
  await noSeriousA11yIssues(page);
  await page.getByLabel(/অভিভাবকের মোবাইল নম্বর/).fill('১৭১২ ৩৪৫৬৭৮');
  await page.getByLabel(/^ইমেইল/).fill('rafiq@gmial.com');
  await page.getByLabel(/^ইমেইল/).blur();
  await page.getByRole('button', { name: 'ঠিক করুন' }).click();
  await expect(page.getByLabel(/^ইমেইল/)).toHaveValue('rafiq@gmail.com');
  await page.getByRole('button', { name: 'শুরু করুন' }).click();

  await expect(page.getByRole('heading', { name: 'আপনার আবেদন' })).toBeVisible();
  await expect(page.getByText('সব অধ্যায় শেষ হলে খুলবে')).toBeVisible();
  await noSeriousA11yIssues(page);
  await page.getByRole('link', { name: /দিয়ে শুরু করুন/ }).last().click();

  let a11yChecked = false;
  for (let chapter = 0; chapter < 10 && !page.url().endsWith('/review'); chapter++) {
    await expect(page).toHaveURL(/\/form\/[a-z_]+$/);
    await fillChapter(page);
    if (!a11yChecked) {
      await noSeriousA11yIssues(page);
      a11yChecked = true;
    }
    const before = page.url();
    await page.getByRole('button', { name: /^(পরবর্তী|পর্যালোচনা)/ }).filter({ visible: true }).click();
    await page.waitForURL((url) => url.toString() !== before);
  }

  await expect(page.getByRole('heading', { name: 'জমা দেওয়ার আগে দেখে নিন' })).toBeVisible();
  await expect(page.getByText('আব্দুল্লাহ আল-মাহমুদ').or(page.getByText('পরীক্ষামূলক উত্তর')).first()).toBeVisible();
  await expect(page.getByText('০১৭১২-৩৪৫৬৭৮')).toBeVisible();
  await noSeriousA11yIssues(page);
  const pay = page.getByRole('button', { name: /৳৫০০ পরিশোধ করুন/ });
  await expect(pay).toBeDisabled();
  await page.getByRole('checkbox').check();
  await pay.click();

  // The stand-in checkout page (local preview); first attempt fails.
  await expect(page).toHaveURL(/\/api\/admissions\/sslcommerz\/mock\?tran_id=MQ27-/);
  await page.getByRole('button', { name: 'Fail' }).click();
  await expect(page).toHaveURL(/\/pre-admission\/status$/);
  await expect(page.getByRole('heading', { name: 'পেমেন্ট সম্পন্ন হয়নি' })).toBeVisible();
  await noSeriousA11yIssues(page);

  await page.getByRole('button', { name: 'আবার চেষ্টা করুন' }).click();
  await page.getByRole('button', { name: 'Pay', exact: true }).click();
  await expect(page).toHaveURL(/\/pre-admission\/status$/);
  await expect(page.getByRole('heading', { name: 'আলহামদুলিল্লাহ, আবেদন জমা হয়েছে' })).toBeVisible();
  await expect(page.getByText(/^[A-Z][A-Z0-9]{0,3}-\d{3}$/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'গ্রুপে যোগ দিন' })).toHaveAttribute('href', 'https://chat.whatsapp.com/LocalPreviewGroup');
  await expect(page.getByRole('img', { name: 'হোয়াটসঅ্যাপ গ্রুপের QR কোড' })).toBeVisible();
  await expect(page.getByText('পেমেন্টের রসিদ')).toBeVisible();
  await noSeriousA11yIssues(page);

  const publicRef = (await page.getByText(/^[A-Z][A-Z0-9]{0,3}-\d{3}$/).textContent())!;
  // mqd_pre_admission_application_KG-001_2026-10-09_12-54.pdf
  const pdfName = new RegExp(`^mqd_pre_admission_application_${publicRef}_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.pdf$`);

  // The application PDF.
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'আবেদনপত্র ডাউনলোড' }).click()]);
  expect(download.suggestedFilename()).toMatch(pdfName);
  const pdf = await (await download.createReadStream()).toArray();
  expect(Buffer.concat(pdf).subarray(0, 5).toString()).toBe('%PDF-');
  await expect(page.getByText('১ / ২ সম্পন্ন')).toBeVisible();

  // Emails (collected by the local preview): the resume link and the confirmation with the PDF.
  await expect
    .poll(async () => (await (await page.request.get('/api/admissions/dev/outbox')).json()).map((m: { subject: string }) => m.subject).join('|'))
    .toContain(`আবেদন সম্পন্ন: ${publicRef}`);
  const outbox = await (await page.request.get('/api/admissions/dev/outbox')).json();
  const confirmation = outbox.find((m: { subject: string }) => m.subject.includes(publicRef));
  expect(confirmation.attachments).toEqual([{ filename: expect.stringMatching(pdfName), bytes: expect.any(Number) }]);
  expect(outbox.some((m: { subject: string; to: string }) => m.subject.includes('ফিরে আসার লিংক') && m.to === 'rafiq@gmail.com')).toBe(true);

  // Paid: the form is closed for editing.
  await page.goto(`${BASE}/form/student`);
  await expect(page).toHaveURL(/\/pre-admission\/status$/);

  // Find my application on another device: the date of birth must match.
  const other = await browser.newContext();
  const phone = await other.newPage();
  await phone.goto(`${BASE}/find`);
  await dismissConsent(phone);
  await phone.getByLabel(/আবেদন আইডি বা মোবাইল নম্বর/).fill(publicRef.toLowerCase().replace('-', ' '));
  await phone.getByLabel('দিন').selectOption('12');
  await phone.getByLabel('মাস').selectOption('4');
  await phone.getByLabel('বছর').selectOption('2021');
  await phone.getByRole('button', { name: 'খুঁজুন' }).click();
  await expect(phone.getByText('এই তথ্যের সাথে মিলে এমন কোনো আবেদন পাওয়া যায়নি')).toBeVisible();
  await phone.getByLabel('মাস').selectOption('3');
  await phone.getByRole('button', { name: 'খুঁজুন' }).click();
  await expect(phone.getByText('ফি পরিশোধিত')).toBeVisible();
  await noSeriousA11yIssues(phone);
  const [again] = await Promise.all([phone.waitForEvent('download'), phone.getByRole('button', { name: 'আবেদনপত্র ডাউনলোড' }).click()]);
  expect(again.suggestedFilename()).toMatch(pdfName);
  await phone.goto(`${BASE}/status`);
  await expect(phone.getByText(publicRef, { exact: true })).toBeVisible();
  await other.close();
});

test('next shows what is missing; answers survive a reload and the resume link', async ({ page, browser }) => {
  await start(page);
  await page.goto(`${BASE}/form/student`);
  await page.getByRole('button', { name: /^পরবর্তী/ }).filter({ visible: true }).click();
  const summary = page.getByRole('alert').filter({ hasText: 'ঠিক করা দরকার' });
  await expect(summary).toBeVisible();
  await expect(summary.getByRole('link')).not.toHaveCount(0);

  await page.locator('#f-student_name_bengali').fill('আব্দুল্লাহ');
  await page.locator('#f-student_name_bengali').blur();
  await expect(page.getByRole('status').filter({ hasText: 'সংরক্ষিত' }).first()).toBeVisible();
  await page.reload();
  await expect(page.locator('#f-student_name_bengali')).toHaveValue('আব্দুল্লাহ');

  // Another device: the resume link restores the application.
  const token = (await page.context().cookies()).find((c) => c.name === 'mq_admission')!.value;
  const other = await browser.newContext();
  const phone = await other.newPage();
  await phone.goto(`${BASE}/resume?t=${token}`);
  await expect(phone).toHaveURL(/\/pre-admission\/form$/);
  await expect(phone.getByText('আব্দুল্লাহ')).toBeVisible();
  await phone.goto(`${BASE}/form/student`);
  await expect(phone.locator('#f-student_name_bengali')).toHaveValue('আব্দুল্লাহ');
  await other.close();
});

test('a broken resume link does not open anything', async ({ page }) => {
  await page.goto(`${BASE}/resume?t=${'x'.repeat(43)}`);
  await expect(page).toHaveURL(/\/pre-admission\/find\?link=invalid$/);
  await page.goto(`${BASE}/form`);
  await expect(page).toHaveURL(/\/pre-admission\/start$/);
});
