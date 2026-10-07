import { chromium, defineConfig, devices } from '@playwright/test';

const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH || chromium.executablePath();

// The pre-admission flow against the local preview (ADMISSIONS_LOCAL=1): in-memory Postgres, the
// converted live form, no Sanity, Neon or Blob. Separate from playwright.config.ts because the
// preview renders the rest of the site without Sanity content.
export default defineConfig({
  testDir: 'e2e',
  testMatch: /pre-admission.*\.spec\.ts/,
  timeout: 90_000,
  use: {
    baseURL: 'http://localhost:3300',
    trace: 'on-first-retry',
    // Optional: a preinstalled Chromium when the pinned browser build is not downloaded.
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined },
  },
  webServer: {
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3300/bengali/pre-admission',
    // The server prints application PDFs with the same Chromium.
    env: { PORT: '3300', ADMISSIONS_LOCAL: '1', CHROMIUM_EXECUTABLE_PATH: chromiumPath },
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
});
