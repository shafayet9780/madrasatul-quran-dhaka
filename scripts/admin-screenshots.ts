/**
 * Screenshots of every admin page from a running local preview, for checking design work:
 * desktop and phone, plus the print pages as A4 PDFs (and PNGs per page when pdftoppm exists).
 *
 *   PORT=3300 ADMISSIONS_LOCAL=1 STUDIO_AUTH_ENABLED=true STUDIO_USERNAME=playwright-editor \
 *     STUDIO_PASSWORD=playwright-test-password pnpm start      # after pnpm build
 *   pnpm admin:screenshots [out-dir] [name-filter]
 *
 * ADMIN_BASE (default http://localhost:3300), ADMIN_USER / ADMIN_PASS (the Studio login above) and
 * PLAYWRIGHT_CHROMIUM_PATH (a preinstalled Chromium) can be set.
 */
import { chromium, devices, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const base = process.env.ADMIN_BASE ?? 'http://localhost:3300';
const out = resolve(process.argv[2] ?? 'admin-screenshots');
const only = process.argv[3];
// Sample student with all three reviews (dev-fixtures.ts: Nursery A, roll 7).
const STUDENT = '/admin/reports/student/fx10017';

type Shot = { name: string; path: string | ((page: Page) => Promise<string>); print?: boolean; prepare?: (page: Page) => Promise<void> };

const SHOTS: Shot[] = [
  { name: 'survey-overview', path: '/admin/reports/overview' },
  { name: 'survey-classes', path: '/admin/reports' },
  { name: 'survey-class', path: '/admin/reports/class?class=nursery&section=a' },
  { name: 'survey-student', path: STUDENT },
  { name: 'survey-internal-print', path: `${STUDENT}/print`, print: true },
  { name: 'survey-guardian-print', path: `${STUDENT}/guardian-print`, print: true },
  { name: 'survey-teaching', path: '/admin/reports/teaching' },
  { name: 'survey-questions', path: '/admin/reports/questions' },
  { name: 'survey-raters', path: '/admin/reports/raters' },
  { name: 'survey-tracker', path: '/admin/tracker' },
  {
    name: 'survey-tracker-guardian',
    path: '/admin/tracker',
    prepare: async (page) => {
      await page.getByRole('button', { name: /জরিপ ও রাউন্ড/ }).click();
      await page.getByRole('menuitemradio', { name: 'শিক্ষার্থী · অক্টোবর ২০২৬ · শিক্ষার্থী (নমুনা)' }).click();
      await page.waitForURL(/round=/);
      await page.waitForLoadState('networkidle');
    },
  },
  { name: 'survey-rounds', path: '/admin/rounds' },
  { name: 'survey-import', path: '/admin/import' },
  { name: 'admissions-overview', path: '/admin/admissions' },
  { name: 'admissions-applications', path: '/admin/admissions/applications' },
  { name: 'admissions-unpaid', path: '/admin/admissions/unpaid' },
  {
    name: 'admissions-application',
    path: async (page) => {
      await page.goto('/admin/admissions/applications');
      return (await page.locator('tbody td:nth-child(2) a').first().getAttribute('href')) ?? '/admin/admissions/applications';
    },
  },
  { name: 'admissions-evaluation-day', path: '/admin/admissions/evaluation-day' },
];

async function main() {
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
  const login = { username: process.env.ADMIN_USER ?? 'playwright-editor', password: process.env.ADMIN_PASS ?? 'playwright-test-password' };
  const views = {
    desktop: { viewport: { width: 1440, height: 900 } },
    phone: { ...devices['Pixel 7'] },
  };
  const contexts = Object.fromEntries(
    await Promise.all(Object.entries(views).map(async ([key, view]) => [key, await browser.newContext({ ...view, baseURL: base, httpCredentials: login })] as const))
  );

  // The admissions pages need applications; the local preview adds samples once.
  const setup = await contexts.desktop.newPage();
  if ((await setup.goto('/admin/admissions/applications')) && !(await setup.locator('tbody td:nth-child(2) a').count())) {
    await setup.request.post('/api/admissions/dev/seed?paid=8&unpaid=3&drafts=1');
  }
  await setup.close();

  for (const shot of SHOTS.filter((s) => !only || s.name.includes(only))) {
    for (const [view, context] of Object.entries(contexts)) {
      const page = await context.newPage();
      const path = typeof shot.path === 'string' ? shot.path : await shot.path(page);
      const res = await page.goto(path, { waitUntil: 'networkidle' });
      await shot.prepare?.(page);
      await page.screenshot({ path: join(out, `${shot.name}-${view}.png`), fullPage: true });
      console.log(`${res?.status()} ${shot.name}-${view}`);
      if (shot.print && view === 'desktop') {
        await page.emulateMedia({ media: 'print' });
        const pdf = join(out, `${shot.name}-print.pdf`);
        await page.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true });
        try {
          execFileSync('pdftoppm', ['-png', '-r', '60', pdf, join(out, `${shot.name}-print`)]);
        } catch {
          // No pdftoppm: the PDF is enough.
        }
        console.log(`    ${shot.name}-print.pdf`);
      }
      await page.close();
    }
  }
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
