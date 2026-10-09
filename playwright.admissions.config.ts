import { chromium, defineConfig, devices } from '@playwright/test';

const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH || chromium.executablePath();

// The pre-admission flow against the local preview (ADMISSIONS_LOCAL=1): in-memory Postgres, the
// converted live form, no Sanity, Neon or Blob. Separate from playwright.config.ts because the
// preview renders the rest of the site without Sanity content. The survey specs that need only the
// database run here too, on the preview's sample survey data (the import spec needs the Studio, so
// it stays with playwright.config.ts).
process.env.SURVEY_E2E_LOCAL ??= 'http://localhost:3300';
// Chromium names downloads "download" when the locale cannot spell their Bengali file names.
process.env.LANG ||= 'C.UTF-8';
const SURVEY_SPECS = /(admin-reports|admin-tracker|admin-rounds|survey-t1|survey-guardian)\.spec\.ts/;

export default defineConfig({
  testDir: 'e2e',
  testMatch: /pre-admission.*\.spec\.ts/,
  timeout: 90_000,
  use: {
    baseURL: 'http://localhost:3300',
    trace: 'on-first-retry',
    // The admin pages sit behind the Studio login (production server, so the proxy asks for it).
    httpCredentials: { username: 'playwright-editor', password: 'playwright-test-password' },
    // Optional: a preinstalled Chromium when the pinned browser build is not downloaded.
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined },
  },
  webServer: {
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3300/bengali/pre-admission',
    // The server prints application PDFs with the same Chromium.
    env: {
      PORT: '3300',
      ADMISSIONS_LOCAL: '1',
      CHROMIUM_EXECUTABLE_PATH: chromiumPath,
      STUDIO_AUTH_ENABLED: 'true',
      STUDIO_USERNAME: 'playwright-editor',
      STUDIO_PASSWORD: 'playwright-test-password',
      SURVEY_SHEET_ID: '',
    },
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    // They reload shared sample data, so one at a time.
    { name: 'survey', use: { ...devices['Desktop Chrome'] }, testMatch: SURVEY_SPECS, workers: 1 },
  ],
});
