import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';

// ERP import against the Neon dev database and the Studio class mapping; fixtures are reloaded after.
const loadFixtures = () => execFileSync('pnpm', ['survey:fixtures'], { stdio: 'ignore' });

test.describe.configure({ mode: 'serial' });
test.beforeAll(loadFixtures);
test.afterAll(loadFixtures);
test.use({ httpCredentials: { username: 'playwright-editor', password: 'playwright-test-password' } });

const CSV = [
  'ID,Roll,Photo,Name,Class,Section,Father Name,Father Contact,Mother Contact',
  'fx-20001,1,a.jpg,NUSRAT JAHAN,Nursery,Section A,Abdul Jalil,+8801712345678,',
  'fx-20002,,b.jpg,Rafid Hasan,Play,,Kamal,+88017123,',
  'fx-20003,3,,Nafisa Anjum,Seven,,X,,',
  'fx-20004,4,,,KG,Section A,Y,,',
].join('\n');

test('previews an ERP file, lists problems and imports the valid rows', async ({ page }) => {
  await page.goto('/admin/import');
  await expect(page.getByRole('heading', { name: 'ERP থেকে শিক্ষার্থী ইমপোর্ট' })).toBeVisible();
  await page.getByLabel('ফাইল').setInputFiles({ name: 'students.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV) });
  await page.getByRole('button', { name: 'যাচাই করুন' }).click();

  await expect(page.getByText('students.csv')).toBeVisible();
  await expect(page.getByText(/Photo উপেক্ষিত/)).toBeVisible();
  const problems = page.getByRole('region', { name: /সারিতে সমস্যা/ });
  await expect(problems.getByText('Class “Seven” · কোনো শ্রেণির সাথে ম্যাপ করা নেই')).toBeVisible();
  await expect(problems.getByText('Name ফাঁকা')).toBeVisible();
  await expect(problems.getByText('Father Contact “+88017123” · নম্বর সঠিক নয়')).toBeVisible();
  await expect(page.getByRole('region', { name: 'শ্রেণি ম্যাপিং' }).getByText('নার্সারি A')).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'সমস্যার তালিকা ডাউনলোড (Excel)' }).click();
  expect((await download).suggestedFilename()).toBe('students-problems.xlsx');

  await page.getByRole('button', { name: /ইমপোর্ট করুন \(২টি সারি বাদ\)/ }).click();
  await expect(page.getByRole('status')).toContainText('ইমপোর্ট সম্পন্ন: ২ জন নতুন');
});
