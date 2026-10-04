/**
 * Loads sample survey data into the database in .env.local (the Neon dev branch) for local work.
 * Every row it writes is marked "fixture-" and is removed by --remove.
 *
 *   pnpm exec tsx scripts/survey-dev-fixtures.ts           # (re)load fixtures
 *   pnpm exec tsx scripts/survey-dev-fixtures.ts --remove  # remove them
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { inArray, like } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/survey/schema';
import { t1FixtureSnapshot } from '../src/lib/survey/testing/t1-fixture';

config({ path: resolve(process.cwd(), '.env.local') });
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
const db = drizzle(neon(process.env.DATABASE_URL), { schema });
const { surveyRounds, submissions } = schema;

const DAY = 24 * 60 * 60 * 1000;

async function remove() {
  const rounds = await db.select({ id: surveyRounds.id }).from(surveyRounds).where(like(surveyRounds.sanityRoundId, 'fixture-%'));
  const ids = rounds.map((r) => r.id);
  if (ids.length) {
    await db.delete(submissions).where(inArray(submissions.roundId, ids));
    await db.delete(surveyRounds).where(inArray(surveyRounds.id, ids));
  }
  return ids.length;
}

async function main() {
  const removed = await remove();
  if (process.argv.includes('--remove')) {
    console.log(`Removed ${removed} fixture rounds.`);
    return;
  }
  const now = Date.now();
  const snapshot = t1FixtureSnapshot();
  const rounds = await db
    .insert(surveyRounds)
    .values([
      {
        sanityRoundId: 'fixture-t1-open',
        kind: 'T1',
        slug: 'fixture-t1',
        label: 'অক্টোবর ২০২৬ (নমুনা)',
        snapshot,
        opensAt: new Date(now - 3 * DAY),
        closesAt: new Date(now + 14 * DAY),
        linkKey: 'fixture-open-link-key-000',
      },
      {
        sanityRoundId: 'fixture-t1-closed',
        kind: 'T1',
        slug: 'fixture-t1-old',
        label: 'সেপ্টেম্বর ২০২৬ (নমুনা)',
        snapshot,
        opensAt: new Date(now - 40 * DAY),
        closesAt: new Date(now - 20 * DAY),
        linkKey: 'fixture-closed-link-key-0',
      },
    ])
    .returning({ id: surveyRounds.id, sanityRoundId: surveyRounds.sanityRoundId });

  const open = rounds.find((r) => r.sanityRoundId === 'fixture-t1-open')!;
  const base = { roundId: open.id, kind: 'T1' as const, teacherKey: 'ustad-abdullah', teacherName: 'উস্তাদ আব্দুল্লাহ' };
  await db.insert(submissions).values([
    { ...base, classKey: 'nursery', sectionKey: 'a', subjectKey: 'quran', subjectName: 'কুরআন', status: 'submitted', submittedAt: new Date(now - DAY) },
    { ...base, classKey: 'nursery', sectionKey: 'b', subjectKey: 'quran', subjectName: 'কুরআন', status: 'submitted', submittedAt: new Date(now - DAY) },
    { ...base, classKey: 'kg', sectionKey: 'a', subjectKey: 'arabic', subjectName: 'আরবি', status: 'draft' },
  ]);
  console.log(`Loaded ${rounds.length} fixture rounds (open link: /survey/fixture-t1?k=fixture-open-link-key-000).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
