/**
 * Loads sample survey data into the database in .env.local (the Neon dev branch) for local work
 * and end-to-end tests: two T1 rounds, one G1 and one G2 round, students (a few with made-up parent
 * mobiles, two siblings sharing one), three submitted batches (one duplicate) and one draft.
 * Every row it writes is marked "fixture"/"fx" and is removed by --remove.
 *
 *   pnpm survey:fixtures           # (re)load fixtures
 *   pnpm survey:fixtures --remove  # remove them
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '.env.local') });
// Fixtures delete and insert rows: only ever against the dev branch, marked in .env.local.
if (process.env.SURVEY_DEV_DB !== '1') {
  console.error('Refusing to load fixtures: set SURVEY_DEV_DB=1 in .env.local only when DATABASE_URL is the Neon dev branch.');
  process.exit(1);
}

const DAY = 24 * 60 * 60 * 1000;
export const FIXTURE_LINK = '/survey/fixture-t1?k=fixture-open-link-key-000';
export const FIXTURE_G1_LINK = '/survey/fixture-g1?k=fixture-g1-link-key-00000';
export const FIXTURE_G2_LINK = '/survey/fixture-g2?k=fixture-g2-link-key-00000';
export const FIXTURE_G1Q_LINK = '/survey/fixture-g1-q?k=fixture-g1q-link-key-0000';

// Made-up parent mobiles (stored form). Yahya and Hamza are siblings in Nursery A on one number.
const MOBILES: Record<string, { fatherMobile?: string; motherMobile?: string }> = {
  'Maryam Binte Rafiq': { fatherMobile: '8801700000001' },
  'Yahya Hasan': { fatherMobile: '8801700000002', motherMobile: '447700900123' },
  'HAMZA RAHIM': { fatherMobile: '8801700000002', motherMobile: '447700900123' },
  'Adiba Rahman': { fatherMobile: '8801700000003' },
  'ZAYAN MAHMUD': { fatherMobile: '8801700000004' },
  'Abdullah Al Noman': { motherMobile: '8801700000005' },
  'Safiya Rahman': { fatherMobile: '8801700000006' },
};

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
  const { and, eq, inArray, isNotNull, like } = await import('drizzle-orm');
  const { getDb } = await import('../src/lib/survey/db');
  const { rateLimits, students, submissions, surveyRounds } = await import('../src/lib/survey/schema');
  const { saveDraft, submitBatch } = await import('../src/lib/survey/t1');
  const { submitGuardian } = await import('../src/lib/survey/guardian');
  const { t1FixtureSnapshot } = await import('../src/lib/survey/testing/t1-fixture');
  const { g1FixtureSnapshot, g2FixtureSnapshot } = await import('../src/lib/survey/testing/guardian-fixture');
  const db = getDb();

  const previous = await db.select({ id: surveyRounds.id }).from(surveyRounds).where(like(surveyRounds.sanityRoundId, 'fixture-%'));
  const ids = previous.map((r) => r.id);
  if (ids.length) {
    // Replaced batches reference their replacement, so they go first.
    await db.delete(submissions).where(and(inArray(submissions.roundId, ids), isNotNull(submissions.supersededBy)));
    await db.delete(submissions).where(inArray(submissions.roundId, ids));
    await db.delete(surveyRounds).where(inArray(surveyRounds.id, ids));
  }
  // Also covers IDs from the import e2e file (fx20001…: the import strips dashes).
  await db.delete(students).where(like(students.erpId, 'fx%'));
  // Repeated test runs look the same sample numbers up many times: start each run with fresh limits.
  await db.delete(rateLimits);
  if (process.argv.includes('--remove')) {
    console.log(`Removed ${ids.length} fixture rounds and their students.`);
    return;
  }

  let id = 10011;
  const rows = Object.entries(ROSTERS).flatMap(([place, list]) => {
    const [classKey, sectionKey] = place.split('|');
    // IDs follow the import's normal form (no dashes), so an imported list matches them.
    return list.map(([roll, name]) => ({ erpId: `fx${id++}`, name, classKey, sectionKey, roll, ...MOBILES[name] }));
  });
  await db.insert(students).values(rows);

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
        sanityRoundId: 'fixture-g1-open',
        kind: 'G1',
        slug: 'fixture-g1',
        label: 'অক্টোবর ২০২৬ · ক্লাস পরিচালনা (নমুনা)',
        snapshot: g1FixtureSnapshot(),
        opensAt: new Date(now - 4 * DAY),
        closesAt: new Date(now + 14 * DAY),
        linkKey: 'fixture-g1-link-key-00000',
      },
      {
        sanityRoundId: 'fixture-g1q-open',
        kind: 'G1',
        slug: 'fixture-g1-q',
        label: 'অক্টোবর ২০২৬ · প্রশ্নভিত্তিক (নমুনা)',
        snapshot: g1FixtureSnapshot(new Date(), 'by-question'),
        opensAt: new Date(now - 5 * DAY), // older, so reports pick the by-subject G1 round
        closesAt: new Date(now + 14 * DAY),
        linkKey: 'fixture-g1q-link-key-0000',
      },
      {
        sanityRoundId: 'fixture-g2-open',
        kind: 'G2',
        slug: 'fixture-g2',
        label: 'অক্টোবর ২০২৬ · শিক্ষার্থী (নমুনা)',
        snapshot: g2FixtureSnapshot(),
        opensAt: new Date(now - 4 * DAY),
        closesAt: new Date(now + 14 * DAY),
        linkKey: 'fixture-g2-link-key-00000',
      },
      {
        sanityRoundId: 'fixture-t1-closed',
        kind: 'T1',
        slug: 'fixture-t1-old',
        label: 'সেপ্টেম্বর ২০২৬ (নমুনা)',
        snapshot,
        // Opened now so the September marks below can be submitted, then moved into the past.
        opensAt: new Date(now - 40 * DAY),
        closesAt: new Date(now + DAY),
        linkKey: 'fixture-closed-link-key-0',
      },
    ])
    .returning();
  const open = rounds.find((r) => r.sanityRoundId === 'fixture-t1-open')!;

  const meta = { ip: null, userAgent: 'fixtures' };
  const old = rounds.find((r) => r.sanityRoundId === 'fixture-t1-closed')!;
  const marks = [10, 8, 10, 6, 10, 8, 4, 10, 8, 10, 6, 8];
  const answersFor = (i: number) => Object.fromEntries(snapshot.template.questions.map((q, n) => [q.key, marks[(i * 7 + n * 5 + (i % 3)) % marks.length]]));
  const teacher = '90001';
  for (const sectionKey of ['a', 'b']) {
    const key = { teacherKey: teacher, classKey: 'nursery', sectionKey, subjectKey: 'quran' };
    const roster = rows.filter((s) => s.classKey === 'nursery' && s.sectionKey === sectionKey);
    await saveDraft(open, key, roster.map((s, i) => ({ studentErpId: s.erpId, answers: answersFor(i), ...(i === 6 ? { note: 'ক্লাসে মনোযোগ ভালো, তবে সহপাঠীদের সাথে মাঝে মাঝে ঝগড়া করে।' } : {}) })), meta);
    const result = await submitBatch(open, key, [], meta);
    if (!result.ok) throw new Error(`fixture submit failed: ${JSON.stringify(result)}`);
  }
  // A second teacher also submits Nursery B Quran: a duplicate for the tracker to resolve.
  const nurseryB = rows.filter((s) => s.classKey === 'nursery' && s.sectionKey === 'b');
  const dupKey = { teacherKey: '90004', classKey: 'nursery', sectionKey: 'b', subjectKey: 'quran' };
  await saveDraft(open, dupKey, nurseryB.map((s, i) => ({ studentErpId: s.erpId, answers: answersFor(i + 3) })), meta);
  const others = await db.select({ id: submissions.id }).from(submissions).where(and(eq(submissions.roundId, open.id), eq(submissions.status, 'submitted')));
  const dup = await submitBatch(open, dupKey, others.map((o) => o.id), meta);
  if (!dup.ok) throw new Error(`fixture duplicate failed: ${JSON.stringify(dup)}`);

  // September: Nursery A Quran with higher marks, so trends and "dropped since last round" show.
  const nurseryA = rows.filter((s) => s.classKey === 'nursery' && s.sectionKey === 'a');
  const septKey = { teacherKey: teacher, classKey: 'nursery', sectionKey: 'a', subjectKey: 'quran' };
  await saveDraft(old, septKey, nurseryA.map((s, i) => ({ studentErpId: s.erpId, answers: Object.fromEntries(snapshot.template.questions.map((q) => [q.key, i % 4 === 0 ? 10 : 8])) })), meta);
  const sept = await submitBatch(old, septKey, [], meta);
  if (!sept.ok) throw new Error(`fixture September submit failed: ${JSON.stringify(sept)}`);
  await db.update(surveyRounds).set({ opensAt: new Date(now - 40 * DAY), closesAt: new Date(now - 20 * DAY) }).where(eq(surveyRounds.id, old.id));

  const kg = rows.filter((s) => s.classKey === 'kg');
  await saveDraft(open, { teacherKey: '90002', classKey: 'kg', sectionKey: 'a', subjectKey: 'arabic' }, kg.slice(0, 3).map((s, i) => ({ studentErpId: s.erpId, answers: answersFor(i) })), meta);

  // Guardian forms for the tracker (Maryam stays free for the end-to-end tests).
  const g2 = rounds.find((r) => r.sanityRoundId === 'fixture-g2-open')!;
  const g1 = rounds.find((r) => r.sanityRoundId === 'fixture-g1-open')!;
  const byName = (name: string) => rows.find((s) => s.name === name)!;
  const g2Answers = { attendance: 'above-90', 'study-at-home': '2h', devices: '1-2-weekly', 'peer-complaints': 'never' };
  const guardianForm = (round: typeof g2, name: string, submitter: { name: string; relation: 'father' | 'mother' | 'other'; relationOther?: string; mobile: string }, answers: Parameters<typeof submitGuardian>[1]['answers'], comment = '') =>
    submitGuardian(
      round,
      { submissionId: crypto.randomUUID(), classKey: byName(name).classKey, sectionKey: byName(name).sectionKey, studentErpId: byName(name).erpId, submitter: { relationOther: '', ...submitter }, answers, comment },
      meta
    );
  for (const result of [
    await guardianForm(g2, 'Yahya Hasan', { name: 'নাসরিন আক্তার', relation: 'mother', mobile: '+447700900123' }, g2Answers),
    await guardianForm(g2, 'HAMZA RAHIM', { name: 'আব্দুর রহিম', relation: 'father', mobile: '01700000002' }, g2Answers),
    await guardianForm(g2, 'HAMZA RAHIM', { name: 'রাশেদ কবির', relation: 'other', relationOther: 'মামা', mobile: '01855000000' }, { ...g2Answers, devices: 'never' }),
    // Three verified Nursery A forms for the class and student reports (Zayan: guardian and teachers far apart).
    await guardianForm(g2, 'ZAYAN MAHMUD', { name: 'মো. মাহমুদুল করিম', relation: 'father', mobile: '01700000004' }, { attendance: 'above-90', 'study-at-home': '4h', devices: 'never', 'peer-complaints': 'never' }, 'বাসায় খুব শান্ত থাকে, মাদরাসা থেকে কোনো অভিযোগ আসেনি।'),
    await guardianForm(g2, 'Abdullah Al Noman', { name: 'ফারজানা ইয়াসমিন', relation: 'mother', mobile: '01700000005' }, g2Answers),
    await guardianForm(g2, 'Safiya Rahman', { name: 'আব্দুস সালাম', relation: 'father', mobile: '01700000006' }, { ...g2Answers, 'study-at-home': 'na', 'peer-complaints': 'sometimes' }),
    await guardianForm(g1, 'Yahya Hasan', { name: 'আব্দুর রহিম', relation: 'father', mobile: '01700000002' }, Object.fromEntries(g1.snapshot.template.questions.map((q) => [q.key, Object.fromEntries((g1.snapshot.classes.find((c) => c.key === 'nursery')?.subjects ?? []).map((sub) => [sub.key, 8]))]))),
  ]) {
    if (!result.ok) throw new Error(`fixture guardian form failed: ${JSON.stringify(result)}`);
  }
  // More G1 forms in Nursery A (numbers not on record: unverified), so the teaching-quality
  // heatmap has cells with at least 3 guardians.
  const nurserySubjects = g1.snapshot.classes.find((c) => c.key === 'nursery')?.subjects ?? [];
  const g1Marks = [10, 8, 10, 6, 8, 10, 4, 8];
  const g1Children = ['AHMAD SHAFIN ISLAM', 'Abdullah Al Noman', 'Safiya Rahman', 'Humaira Jannat', 'ZAYAN MAHMUD', 'Aisha Siddika Noor'];
  for (const [i, name] of g1Children.entries()) {
    const answers = Object.fromEntries(
      g1.snapshot.template.questions.map((q, qi) => [q.key, Object.fromEntries(nurserySubjects.map((sub, si) => [sub.key, g1Marks[(i + qi * 3 + si * 2) % g1Marks.length]]))])
    );
    const form = {
      submissionId: crypto.randomUUID(),
      classKey: 'nursery',
      sectionKey: 'a',
      studentErpId: byName(name).erpId,
      submitter: { name: `অভিভাবক ${i + 1}`, relation: (i % 2 ? 'mother' : 'father') as 'father' | 'mother', relationOther: '', mobile: `0181100000${i}` },
      answers,
      comment: i === 1 ? 'গণিতের হোমওয়ার্ক একটু কমালে ভালো হয়।' : i === 4 ? 'আলহামদুলিল্লাহ, শিক্ষকরা খুব যত্নশীল।' : '',
    };
    const result = await submitGuardian(g1, form, meta);
    if (!result.ok) throw new Error(`fixture G1 form failed: ${JSON.stringify(result)}`);
  }

  console.log(`Loaded fixtures: ${rows.length} students, 5 rounds, 3 submitted batches (one duplicate), 1 draft. Links: T1 ${FIXTURE_LINK} · G1 ${FIXTURE_G1_LINK} · G1 by question ${FIXTURE_G1Q_LINK} · G2 ${FIXTURE_G2_LINK}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
