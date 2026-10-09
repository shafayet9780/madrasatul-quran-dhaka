import { defineConfig, devices } from '@playwright/test';

const DB_SPECS = /(admin-rounds|admin-import|admin-tracker|admin-reports|survey-t1|survey-guardian)\.spec\.ts/;

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  webServer: {
    // Port 3100 avoids colliding with anything already on the default 3000.
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3100',
    env: {
      PORT: '3100',
      STUDIO_AUTH_ENABLED: 'true',
      STUDIO_USERNAME: 'playwright-editor',
      STUDIO_PASSWORD: 'playwright-test-password',
      // Never copy test submissions to the real "Survey Responses" sheet (Next keeps an empty value).
      SURVEY_SHEET_ID: '',
    },
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
  projects: [
    // The pre-admission flow runs against the local preview: pnpm test:e2e:admissions.
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: [DB_SPECS, /pre-admission.*\.spec\.ts/] },
    // These specs reload shared fixtures in the Neon dev database, so they run one at a time.
    { name: 'survey-db', use: { ...devices['Desktop Chrome'] }, testMatch: DB_SPECS, workers: 1 },
  ],
});
