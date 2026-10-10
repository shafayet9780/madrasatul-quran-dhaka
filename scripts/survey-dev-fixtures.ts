/**
 * Loads sample survey data (src/lib/survey/testing/dev-fixtures.ts) into the database in .env.local
 * (the Neon dev branch) for local work and end-to-end tests.
 *
 *   pnpm survey:fixtures           # (re)load fixtures
 *   pnpm survey:fixtures --remove  # remove them
 *   pnpm survey:fixtures --rate-limits  # only clear the request counters
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '.env.local') });
// Fixtures delete and insert rows: only ever against the dev branch, marked in .env.local.
if (process.env.SURVEY_DEV_DB !== '1') {
  console.error('Refusing to load fixtures: set SURVEY_DEV_DB=1 in .env.local only when DATABASE_URL is the Neon dev branch.');
  process.exit(1);
}

async function main() {
  // Imported after dotenv so the database URL is set.
  const { loadSurveyFixtures } = await import('../src/lib/survey/testing/dev-fixtures');
  console.log(await loadSurveyFixtures(process.argv.includes('--rate-limits') ? 'rate-limits' : process.argv.includes('--remove') ? 'remove' : 'load'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
