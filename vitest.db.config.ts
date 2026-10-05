import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config({ path: '.env.local' });
// These tests write to the database: only ever the dev branch, marked in .env.local.
if (process.env.SURVEY_DEV_DB !== '1') {
  throw new Error('Refusing to run database tests: set SURVEY_DEV_DB=1 in .env.local only when DATABASE_URL is the Neon dev branch.');
}

// Database tests run against the Neon dev branch (DATABASE_URL in .env.local) and clean up after themselves.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'server-only': fileURLToPath(new URL('./src/lib/survey/testing/server-only-stub.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.db.test.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
