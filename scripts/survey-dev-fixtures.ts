/**
 * Loads sample survey data into the database in .env.local (the Neon dev branch) for local work
 * and end-to-end tests: two T1 rounds, students, two submitted batches and one draft.
 * Every row it writes is marked "fixture"/"fx-" and is removed by --remove.
 *
 *   pnpm survey:fixtures           # (re)load fixtures
 *   pnpm survey:fixtures --remove  # remove them
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '.env.local') });

const DAY = 24 * 60 * 60 * 1000;
export const FIXTURE_LINK = '/survey/fixture-t1?k=fixture-open-link-key-000';

// [roll, name] per class-section; null roll = not yet assigned in the ERP.
const ROSTERS: Record<string, [number | null, string][]> = {
  'nursery|a': [
    [1, 'AHMAD SHAFIN ISLAM'], [2, 'Maryam Binte Rafiq'], [3, 'Abdullah Al Noman'], [4, 'Safiya Rahman'], [5, 'Yahya Hasan'],
    [6, 'Humaira Jannat'], [7, 'ZAYAN MAHMUD'], [8, 'Aisha Siddika Noor'], [9, 'Musa Ibn Khalid'], [10, 'Rumaisa Akter'],
    [11, 'Talha Zubair'], [12, 'Khadija Tul Kubra'], [14, 'Ibrahim Hossain'], [15, 'Nusaiba Karim'], [16, 'Omar Faruk Tamim'],
    [17, 'Sumaya Binte Salam'], [18, 'HAMZA RAHIM'], [null, 'Tasnia Islam'], [null, 'Abdur Rahman Fahim'], [null, 'Zainab Akter'],
  ],
  'nursery|b': [[1, 'Arafat Hossain'], [2, 'Fatima Zahra'], [3, 'Imran Kabir'], [4, 'Labiba Noor'], [5, 'Rayan Ahmed'], [6, 'Tasfia Haque']],
  'kg|a': [[1, 'Ayaan Chowdhury'], [2, 'Hafsa Akter'], [3, 'Junaid Islam'], [4, 'Mariam Sultana'], [5, 'Sami Rahman']],
  'play|': [[1, 'Adiba Rahman'], [2, 'Nabil Hasan'], [3, 'Raisa Islam'], [4, 'Umar Faruq']],
};

async function main() {
  // Imported after dotenv so the database URL is set.
  const { and, inArray, isNotNull, like } = await import('drizzle-orm');
  const { getDb } = await import('../src/lib/survey/db');
  const { students, submissions, surveyRounds } = await import('../src/lib/survey/schema');
  const { saveDraft, submitBatch } = await import('../src/lib/survey/t1');
  const { t1FixtureSnapshot } = await import('../src/lib/survey/testing/t1-fixture');
  const db = getDb();

  const rounds = await db.select({ id: surveyRounds.id }).from(surveyRounds).where(like(surveyRounds.sanityRoundId, 'fixture-%'));
  const ids = rounds.map((r) => r.id);
  if (ids.length) {
    // Replaced batches reference their replacement, so they go first.
    await db.delete(submissions).where(and(inArray(submissions.roundId, ids), isNotNull(submissions.supersededBy)));
    await db.delete(submissions).where(inArray(submissions.roundId, ids));
    await db.delete(surveyRounds).where(inArray(surveyRounds.id, ids));
  }
  await db.delete(students).where(like(students.erpId, 'fx-%'));
  if (process.argv.includes('--remove')) {
    console.log(`Removed ${ids.length} fixture rounds and their students.`);
    return;
  }

  let id = 10011;
  const rows = Object.entries(ROSTERS).flatMap(([place, list]) => {
    const [classKey, sectionKey] = place.split('|');
    return list.map(([roll, name]) => ({ erpId: `fx-${id++}`, name, classKey, sectionKey, roll }));
  });
  await db.insert(students).values(rows);

  const now = Date.now();
  const snapshot = t1FixtureSnapshot();
  const [open] = await db
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
    .returning();

  const meta = { ip: null, userAgent: 'fixtures' };
  const marks = [10, 8, 10, 6, 10, 8, 4, 10, 8, 10, 6, 8];
  const answersFor = (i: number) => Object.fromEntries(snapshot.template.questions.map((q, n) => [q.key, marks[(i * 5 + n * 3 + (i % 3)) % marks.length]]));
  const teacher = 'ustad-abdullah';
  for (const sectionKey of ['a', 'b']) {
    const key = { teacherKey: teacher, classKey: 'nursery', sectionKey, subjectKey: 'quran' };
    const roster = rows.filter((s) => s.classKey === 'nursery' && s.sectionKey === sectionKey);
    await saveDraft(open, key, roster.map((s, i) => ({ studentErpId: s.erpId, answers: answersFor(i), ...(i === 6 ? { note: 'ক্লাসে মনোযোগ ভালো, তবে সহপাঠীদের সাথে মাঝে মাঝে ঝগড়া করে।' } : {}) })), meta);
    const result = await submitBatch(open, key, [], meta);
    if (!result.ok) throw new Error(`fixture submit failed: ${JSON.stringify(result)}`);
  }
  const kg = rows.filter((s) => s.classKey === 'kg');
  await saveDraft(open, { teacherKey: 'ustad-hamza', classKey: 'kg', sectionKey: 'a', subjectKey: 'arabic' }, kg.slice(0, 3).map((s, i) => ({ studentErpId: s.erpId, answers: answersFor(i) })), meta);

  console.log(`Loaded fixtures: ${rows.length} students, 2 rounds, 2 submitted batches, 1 draft. Open link: ${FIXTURE_LINK}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
