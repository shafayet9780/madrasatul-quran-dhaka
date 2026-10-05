import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { and, eq, isNotNull, like } from 'drizzle-orm';
import { getDb } from './db';
import { answerItems, students, submissions, surveyRounds } from './schema';
import { loadBatch, loadReceipt, saveDraft, submitBatch } from './t1';
import { loadTracker, resolveDuplicate } from './tracker';
import { t1FixtureSnapshot } from './testing/t1-fixture';

const run = `test-tracker-${Date.now()}`;
const hour = 60 * 60 * 1000;
const meta = { ip: null, userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/120 Mobile Safari/537.36' };
type Round = typeof surveyRounds.$inferSelect;
let round: Round;
const tokens: Record<string, string> = {};

async function submitAs(teacherKey: string, subjectKey = 'quran') {
  const key = { teacherKey, classKey: 'tracker-class', sectionKey: '', subjectKey };
  const answers = Object.fromEntries(round.snapshot.template.questions.map((q) => [q.key, 8]));
  await saveDraft(round, key, [{ studentErpId: `${run}-1`, answers }], meta);
  const before = await loadTracker(round.id);
  const acknowledged = before!.duplicates.flatMap((d) => d.batches.map((b) => b.id));
  const all = await getDb().select({ id: submissions.id }).from(submissions).where(and(eq(submissions.roundId, round.id), eq(submissions.status, 'submitted')));
  const result = await submitBatch(round, key, [...acknowledged, ...all.map((s) => s.id)], meta);
  if (!result.ok) throw new Error(JSON.stringify(result));
  tokens[`${teacherKey}:${subjectKey}`] = result.receiptToken;
}

beforeAll(async () => {
  const snapshot = t1FixtureSnapshot();
  snapshot.classes.push({ key: 'tracker-class', name: 'পরীক্ষা', sections: [], subjects: [{ key: 'quran', name: 'কুরআন' }, { key: 'arabic', name: 'আরবি' }, { key: 'math', name: 'গণিত' }] });
  [round] = await getDb()
    .insert(surveyRounds)
    .values({ sanityRoundId: run, kind: 'T1', slug: run, label: 'পরীক্ষা', snapshot, opensAt: new Date(Date.now() - hour), closesAt: new Date(Date.now() + hour), linkKey: 'k' })
    .returning();
  await getDb().insert(students).values([{ erpId: `${run}-1`, name: 'Zainab', classKey: 'tracker-class', sectionKey: '', roll: 1 }]);
  await submitAs('90001');
  await submitAs('90002');
  await submitAs('90001', 'arabic');
  await submitAs('90002', 'arabic');
  await saveDraft(round, { teacherKey: '90005', classKey: 'tracker-class', sectionKey: '', subjectKey: 'math' }, [{ studentErpId: `${run}-1`, answers: { attendance: 10 } }], meta);
});

afterAll(async () => {
  const db = getDb();
  await db.delete(submissions).where(and(eq(submissions.roundId, round.id), isNotNull(submissions.supersededBy)));
  await db.delete(submissions).where(eq(submissions.roundId, round.id));
  await db.delete(surveyRounds).where(eq(surveyRounds.id, round.id));
  await db.delete(students).where(like(students.erpId, `${run}%`));
});

const group = (data: NonNullable<Awaited<ReturnType<typeof loadTracker>>>, subject: string) => data.duplicates.find((d) => d.title.endsWith(subject))!;

describe('tracker', () => {
  it('shows coverage, drafts with device, and the duplicate', async () => {
    const data = await loadTracker(round.id);
    const row = data!.coverage.rows.find((r) => r.classKey === 'tracker-class')!;
    expect(row.cells.map((c) => c.state)).toEqual(['dup', 'dup', 'na', 'na', 'draft']);
    expect(data!.drafts).toEqual([expect.objectContaining({ title: 'পরীক্ষা · গণিত', teacherName: 'উস্তাদ ইউসুফ', done: 0, total: 1, device: 'Android · Chrome' })]);
    expect(data!.duplicates.map((d) => d.title).sort()).toEqual(['পরীক্ষা · আরবি', 'পরীক্ষা · কুরআন']);
    expect(group(data!, 'কুরআন').batches.map((b) => b.teacherName).sort()).toEqual(['উস্তাদ আব্দুল্লাহ', 'উস্তাদ হামযা']);
  });

  it('refuses a stale list', async () => {
    const data = await loadTracker(round.id);
    const ids = group(data!, 'কুরআন').batches.map((b) => b.id);
    expect(await resolveDuplicate(round.id, [ids[0]], ids[0])).toBe('তালিকাটি বদলে গেছে; পাতাটি আবার লোড করুন।');
  });

  it('keeps both batches: the decision sticks and the cell reads as submitted', async () => {
    const data = await loadTracker(round.id);
    const arabic = group(data!, 'আরবি').batches;
    expect(await resolveDuplicate(round.id, arabic.map((b) => b.id), null)).toBeNull();
    const after = await loadTracker(round.id);
    expect(after!.duplicates.map((d) => d.title)).toEqual(['পরীক্ষা · কুরআন']);
    expect(after!.coverage.rows.find((r) => r.classKey === 'tracker-class')!.cells[1]).toMatchObject({ state: 'done', teachers: ['উস্তাদ আব্দুল্লাহ', 'উস্তাদ হামযা'] });
  });

  it('keeps both resolved when one of the teachers edits later', async () => {
    await saveDraft(round, { teacherKey: '90001', classKey: 'tracker-class', sectionKey: '', subjectKey: 'arabic' }, [{ studentErpId: `${run}-1`, answers: { attendance: 6 } }], meta);
    // No acknowledgement needed and no new duplicate flag.
    const result = await submitBatch(round, { teacherKey: '90001', classKey: 'tracker-class', sectionKey: '', subjectKey: 'arabic' }, [], meta);
    expect(result.ok).toBe(true);
    const after = await loadTracker(round.id);
    expect(after!.duplicates.map((d) => d.title)).toEqual(['পরীক্ষা · কুরআন']);
  });

  it('keeps one batch: the other stops counting and its receipt says so', async () => {
    const data = await loadTracker(round.id);
    const batches = group(data!, 'কুরআন').batches;
    const keep = batches.find((b) => b.teacherName === 'উস্তাদ আব্দুল্লাহ')!;
    const drop = batches.find((b) => b.teacherName === 'উস্তাদ হামযা')!;
    expect(await resolveDuplicate(round.id, batches.map((b) => b.id), keep.id)).toBeNull();

    const after = await loadTracker(round.id);
    expect(after!.duplicates).toEqual([]);
    // The set-aside teacher reopening the class starts from their own marks.
    const reopened = await loadBatch(round, { teacherKey: '90002', classKey: 'tracker-class', sectionKey: '', subjectKey: 'quran' });
    expect(reopened).toMatchObject({ status: 'new' });
    expect(Object.keys(reopened!.answers[`${run}-1`])).toHaveLength(round.snapshot.template.questions.length);
    expect(after!.coverage.rows.find((r) => r.classKey === 'tracker-class')!.cells[0].state).toBe('done');
    expect(await getDb().select().from(answerItems).where(eq(answerItems.submissionId, drop.id))).toEqual([]);
    const [kept] = await getDb().select().from(submissions).where(eq(submissions.id, keep.id));
    expect(kept).toMatchObject({ duplicateFlag: false, mirroredAt: null });

    const dropped = await loadReceipt(tokens['90002:quran']);
    expect(dropped).toMatchObject({ setAside: true, replacedBy: null });
    expect(await loadReceipt(tokens['90001:quran'])).toMatchObject({ setAside: false });
  });
});
