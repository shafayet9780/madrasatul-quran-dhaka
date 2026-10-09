import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { and, eq, inArray, isNotNull, like } from 'drizzle-orm';
import { getDb } from './db';
import { answerItems, responses, students, submissions, surveyRounds } from './schema';
import { loadBatch, loadReceipt, saveDraft, submitBatch, teacherOverview } from './t1';
import { t1FixtureSnapshot } from './testing/t1-fixture';

const run = `test-t1-${Date.now()}`;
const hour = 60 * 60 * 1000;
const meta = { ip: '203.0.113.7', userAgent: 'vitest' };
const QUESTIONS = t1FixtureSnapshot().template.questions.map((q) => q.key);
const full = (mark = 8) => Object.fromEntries(QUESTIONS.map((q) => [q, mark]));

type Round = typeof surveyRounds.$inferSelect;
let round: Round;
let closedRound: Round;
const ids = { s1: `${run}-s1`, s2: `${run}-s2`, s3: `${run}-s3` };
// A class of its own, so dev fixture students never mix into these rosters.
const CLASS = 'test-class';
const keyA = { teacherKey: '90001', classKey: CLASS, sectionKey: 'a', subjectKey: 'quran' };

function testSnapshot() {
  const snapshot = t1FixtureSnapshot();
  const nursery = snapshot.classes.find((c) => c.key === 'nursery')!;
  // English is taught by level here: each teacher rates only their own students.
  const subjects = nursery.subjects.map((sub) => (sub.key === 'english' ? { ...sub, byLevel: true } : sub));
  snapshot.classes.push({ ...nursery, key: CLASS, name: 'পরীক্ষা শ্রেণি', subjects });
  return snapshot;
}
const keyB = { ...keyA, teacherKey: '90002' };

async function insertRound(suffix: string, opensAt: Date, closesAt: Date) {
  const [row] = await getDb()
    .insert(surveyRounds)
    .values({
      sanityRoundId: `${run}-${suffix}`,
      kind: 'T1',
      slug: `${run}-${suffix}`,
      label: 'পরীক্ষা',
      snapshot: testSnapshot(),
      opensAt,
      closesAt,
      linkKey: 'k',
    })
    .returning();
  return row;
}

beforeAll(async () => {
  const now = Date.now();
  round = await insertRound('open', new Date(now - hour), new Date(now + 24 * hour));
  closedRound = await insertRound('closed', new Date(now - 48 * hour), new Date(now - 24 * hour));
  await getDb()
    .insert(students)
    .values([
      { erpId: ids.s1, name: 'MARYAM BINTE RAFIQ', classKey: CLASS, sectionKey: 'a', roll: 2 },
      { erpId: ids.s2, name: 'ahmad shafin', classKey: CLASS, sectionKey: 'a', roll: 1 },
      { erpId: ids.s3, name: 'Zainab Akter', classKey: CLASS, sectionKey: 'a', roll: null },
    ]);
});

afterAll(async () => {
  const db = getDb();
  const rounds = await db.select({ id: surveyRounds.id }).from(surveyRounds).where(like(surveyRounds.sanityRoundId, `${run}%`));
  const roundIds = rounds.map((r) => r.id);
  if (roundIds.length) {
    await db.delete(answerItems).where(inArray(answerItems.roundId, roundIds));
    // Replaced batches reference their replacement, so they go first.
    await db.delete(submissions).where(and(inArray(submissions.roundId, roundIds), isNotNull(submissions.supersededBy)));
    await db.delete(submissions).where(inArray(submissions.roundId, roundIds));
    await db.delete(surveyRounds).where(inArray(surveyRounds.id, roundIds));
  }
  await db.delete(students).where(like(students.erpId, `${run}%`));
});

const currentItems = (submissionId: string) => getDb().select().from(answerItems).where(eq(answerItems.submissionId, submissionId));

describe('T1 draft and submit', () => {
  let firstToken = '';

  it('loads the roster in roll order with display names', async () => {
    const batch = await loadBatch(round, keyA);
    expect(batch?.students.map((s) => [s.erpId, s.name])).toEqual([
      [ids.s2, 'Ahmad Shafin'],
      [ids.s1, 'Maryam Binte Rafiq'],
      [ids.s3, 'Zainab Akter'],
    ]);
    expect(batch).toMatchObject({ status: 'new', submitted: null, duplicates: [] });
    expect(await loadBatch(round, { ...keyA, sectionKey: '' })).toBeNull();
  });

  it('autosaves by merging marks and keeps notes unless sent', async () => {
    expect(await saveDraft(round, keyA, [{ studentErpId: ids.s1, answers: { attendance: 10 }, note: 'ভালো করছে' }], meta)).toMatchObject({ ok: true });
    expect(await saveDraft(round, keyA, [{ studentErpId: ids.s1, answers: { attention: 6 } }], meta)).toMatchObject({ ok: true });
    const batch = await loadBatch(round, keyA);
    expect(batch?.status).toBe('draft');
    expect(batch?.answers[ids.s1]).toEqual({ attendance: 10, attention: 6 });
    expect(batch?.notes[ids.s1]).toBe('ভালো করছে');

    await saveDraft(round, keyA, [{ studentErpId: ids.s1, note: '' }], meta);
    expect((await loadBatch(round, keyA))?.notes[ids.s1]).toBeUndefined();
  });

  it('withdraws a mark sent as null and keeps the others', async () => {
    expect(await saveDraft(round, keyA, [{ studentErpId: ids.s1, answers: { attention: null } }], meta)).toMatchObject({ ok: true });
    expect((await loadBatch(round, keyA))?.answers[ids.s1]).toEqual({ attendance: 10 });
    await saveDraft(round, keyA, [{ studentErpId: ids.s1, answers: { attention: 6 } }], meta);
    expect((await loadBatch(round, keyA))?.answers[ids.s1]).toEqual({ attendance: 10, attention: 6 });
  });

  it('rejects off-scale marks, unknown students and closed rounds', async () => {
    expect(await saveDraft(round, keyA, [{ studentErpId: ids.s1, answers: { attendance: 7 } }], meta)).toEqual({ ok: false, reason: 'invalid' });
    expect(await saveDraft(round, keyA, [{ studentErpId: 'someone-else', answers: { attendance: 8 } }], meta)).toMatchObject({ ok: true, rejected: ['someone-else'] });
    expect(await saveDraft(closedRound, keyA, [{ studentErpId: ids.s1, answers: { attendance: 8 } }], meta)).toEqual({ ok: false, reason: 'closed' });
  });

  it('refuses an incomplete batch and lists the gaps', async () => {
    const result = await submitBatch(round, keyA, [], meta);
    expect(result).toMatchObject({ ok: false, reason: 'incomplete' });
    if (result.ok || result.reason !== 'incomplete') return;
    expect(result.missing.map((m) => m.questionKey)).toEqual(QUESTIONS);
    expect(result.missing[0].students.map((s) => s.erpId)).toEqual([ids.s2, ids.s3]);
  });

  it('submits a complete batch and writes report rows', async () => {
    await saveDraft(round, keyA, [ids.s1, ids.s2, ids.s3].map((id) => ({ studentErpId: id, answers: full(8) })), meta);
    const result = await submitBatch(round, keyA, [], meta);
    if (!result.ok) throw new Error(JSON.stringify(result));
    firstToken = result.receiptToken;
    const receipt = await loadReceipt(firstToken);
    expect(receipt?.submission).toMatchObject({ status: 'submitted', teacherName: 'উস্তাদ আব্দুল্লাহ', subjectName: 'কুরআন', duplicateFlag: false });
    expect(receipt?.rows.map((r) => r.erpId)).toEqual([ids.s2, ids.s1, ids.s3]);
    expect(await currentItems(receipt!.submission.id)).toHaveLength(3 * QUESTIONS.length);
    expect(await loadBatch(round, keyA)).toMatchObject({ status: 'submitted', submitted: { receiptToken: firstToken } });
    // Submitting again with nothing changed returns the same receipt.
    expect(await submitBatch(round, keyA, [], meta)).toEqual({ ok: true, receiptToken: firstToken });
  });

  it('edits after submit: the draft starts from the submitted marks and supersedes on submit', async () => {
    await saveDraft(round, keyA, [{ studentErpId: ids.s3, answers: { attendance: 4 } }], meta);
    const draft = await loadBatch(round, keyA);
    expect(draft?.status).toBe('draft');
    expect(draft?.answers[ids.s3]).toEqual({ ...full(8), attendance: 4 });

    const result = await submitBatch(round, keyA, [], meta);
    if (!result.ok) throw new Error(JSON.stringify(result));
    const old = await loadReceipt(firstToken);
    const fresh = await loadReceipt(result.receiptToken);
    expect(old?.replacedBy).toBe(result.receiptToken);
    expect(await currentItems(old!.submission.id)).toHaveLength(0);
    const items = await currentItems(fresh!.submission.id);
    expect(items).toHaveLength(3 * QUESTIONS.length);
    expect(items.find((i) => i.studentErpId === ids.s3 && i.questionKey === 'attendance')?.mark).toBe(4);
  });

  it('warns about another teacher’s batch at submit and flags both when confirmed', async () => {
    const before = await loadBatch(round, keyB);
    expect(before?.duplicates).toHaveLength(1);
    expect(before?.duplicates[0]).toMatchObject({ teacherName: 'উস্তাদ আব্দুল্লাহ', students: 3 });

    await saveDraft(round, keyB, [ids.s1, ids.s2, ids.s3].map((id) => ({ studentErpId: id, answers: full(10) })), meta);
    const refused = await submitBatch(round, keyB, [], meta);
    expect(refused).toMatchObject({ ok: false, reason: 'duplicate' });
    const result = await submitBatch(round, keyB, [before!.duplicates[0].submissionId], meta);
    if (!result.ok) throw new Error(JSON.stringify(result));
    const flagged = await getDb()
      .select({ teacherKey: submissions.teacherKey, duplicateFlag: submissions.duplicateFlag })
      .from(submissions)
      .where(and(eq(submissions.roundId, round.id), eq(submissions.status, 'submitted')));
    expect(flagged.filter((s) => s.duplicateFlag).map((s) => s.teacherKey).sort()).toEqual(['90001', '90002']);
  });

  it('handles a student who moved section mid-round', async () => {
    await getDb().update(students).set({ sectionKey: 'b' }).where(eq(students.erpId, ids.s3));
    const keyAB = { ...keyA, sectionKey: 'b' };
    await saveDraft(round, keyAB, [{ studentErpId: ids.s3, answers: full(6) }], meta);
    const result = await submitBatch(round, keyAB, [], meta);
    if (!result.ok) throw new Error(JSON.stringify(result));
    const current = await getDb()
      .select({ submissionId: responses.submissionId })
      .from(responses)
      .where(and(eq(responses.roundId, round.id), eq(responses.teacherKey, '90001'), eq(responses.studentErpId, ids.s3), eq(responses.isCurrent, true)));
    expect(current).toHaveLength(1);
    const items = await getDb()
      .select()
      .from(answerItems)
      .where(and(eq(answerItems.roundId, round.id), eq(answerItems.teacherKey, '90001'), eq(answerItems.studentErpId, ids.s3)));
    expect(items.every((i) => i.sectionKey === 'b' && i.mark === 6)).toBe(true);
    expect(items).toHaveLength(QUESTIONS.length);
  });

  it('two submits racing end with one receipt that stays valid', async () => {
    const keyR = { ...keyA, subjectKey: 'bangla' };
    await saveDraft(round, keyR, [ids.s1, ids.s2].map((id) => ({ studentErpId: id, answers: full(8) })), meta);
    const [a, b] = await Promise.all([submitBatch(round, keyR, [], meta), submitBatch(round, keyR, [], meta)]);
    if (!a.ok || !b.ok) throw new Error(JSON.stringify([a, b]));
    expect(a.receiptToken).toBe(b.receiptToken);
    const receipt = await loadReceipt(a.receiptToken);
    expect(receipt?.rows).toHaveLength(2);
    expect(await currentItems(receipt!.submission.id)).toHaveLength(2 * QUESTIONS.length);
  });

  it('saves the other rows when a student has left the class', async () => {
    const keyM = { ...keyA, subjectKey: 'math' };
    const result = await saveDraft(round, keyM, [
      { studentErpId: ids.s1, answers: { attendance: 10 } },
      { studentErpId: ids.s3, answers: { attendance: 8 } }, // moved to section B earlier
    ], meta);
    expect(result).toMatchObject({ ok: true, rejected: [ids.s3] });
    expect((await loadBatch(round, keyM))?.answers).toEqual({ [ids.s1]: { attendance: 10 } });
  });

  it('summarises the teacher’s batches for the class picker', async () => {
    await saveDraft(round, { ...keyA, subjectKey: 'arabic' }, [{ studentErpId: ids.s1, answers: full(10) }], meta);
    const overview = await teacherOverview(round, '90001');
    expect(overview.find((o) => o.subjectKey === 'arabic')).toMatchObject({ status: 'draft', done: 1, total: 2 });
    // The student who moved to section B no longer counts towards section A.
    expect(overview.find((o) => o.subjectKey === 'quran' && o.sectionKey === 'a')).toMatchObject({ status: 'submitted', done: 2, total: 2 });
  });
});

describe('T1 subject taught by level', () => {
  // By now section A holds s1 and s2 (s3 moved to B above).
  const keyL = { ...keyA, subjectKey: 'english' };
  const keyLB = { ...keyL, teacherKey: '90002' };
  const englishSubmissions = () =>
    getDb()
      .select({ teacherKey: submissions.teacherKey, duplicateFlag: submissions.duplicateFlag })
      .from(submissions)
      .where(and(eq(submissions.roundId, round.id), eq(submissions.subjectKey, 'english'), eq(submissions.status, 'submitted')));

  it('submits only the students the teacher marked, complete', async () => {
    await saveDraft(round, keyL, [{ studentErpId: ids.s1, answers: { attendance: 10 } }], meta);
    expect(await submitBatch(round, keyL, [], meta)).toMatchObject({ ok: false, reason: 'incomplete' });
    await saveDraft(round, keyL, [{ studentErpId: ids.s1, answers: full(10) }], meta);
    const result = await submitBatch(round, keyL, [], meta);
    if (!result.ok) throw new Error(JSON.stringify(result));
    expect((await loadReceipt(result.receiptToken))?.rows.map((r) => r.erpId)).toEqual([ids.s1]);
    expect(await currentItems((await loadReceipt(result.receiptToken))!.submission.id)).toHaveLength(QUESTIONS.length);
  });

  it('lets a second teacher rate the rest without a duplicate warning', async () => {
    const batch = await loadBatch(round, keyLB);
    expect(batch?.duplicates).toEqual([]);
    expect(batch?.taken).toEqual({ [ids.s1]: 'উস্তাদ আব্দুল্লাহ' });
    await saveDraft(round, keyLB, [{ studentErpId: ids.s2, answers: full(6) }], meta);
    const result = await submitBatch(round, keyLB, [], meta);
    if (!result.ok) throw new Error(JSON.stringify(result));
    expect((await englishSubmissions()).map((s) => [s.teacherKey, s.duplicateFlag]).sort()).toEqual([
      ['90001', false],
      ['90002', false],
    ]);
  });

  it('refuses a student another teacher already rated until the marks are cleared', async () => {
    await saveDraft(round, keyLB, [{ studentErpId: ids.s1, answers: full(4), note: 'ভুল' }], meta);
    expect(await submitBatch(round, keyLB, [], meta)).toMatchObject({
      ok: false,
      reason: 'taken',
      students: [{ erpId: ids.s1, teacherName: 'উস্তাদ আব্দুল্লাহ' }],
    });
    await saveDraft(round, keyLB, [{ studentErpId: ids.s1, clear: true }], meta);
    const batch = await loadBatch(round, keyLB);
    expect(batch?.answers).toEqual({ [ids.s2]: full(6) });
    expect(batch?.notes).toEqual({});
    const result = await submitBatch(round, keyLB, [], meta);
    if (!result.ok) throw new Error(JSON.stringify(result));
    expect(await teacherOverview(round, '90002')).toContainEqual(expect.objectContaining({ subjectKey: 'english', done: 1, total: 1 }));
  });

  it('a cleared student stops counting once the teacher resubmits', async () => {
    await saveDraft(round, keyL, [{ studentErpId: ids.s2, answers: full(8) }], meta);
    await saveDraft(round, keyL, [{ studentErpId: ids.s2, clear: true }, { studentErpId: ids.s1, answers: { attendance: 4 } }], meta);
    const result = await submitBatch(round, keyL, [], meta);
    if (!result.ok) throw new Error(JSON.stringify(result));
    const current = await getDb()
      .select({ teacherKey: responses.teacherKey, erpId: responses.studentErpId })
      .from(responses)
      .where(and(eq(responses.roundId, round.id), eq(responses.subjectKey, 'english'), eq(responses.isCurrent, true)));
    expect(current.map((r) => `${r.teacherKey}:${r.erpId}`).sort()).toEqual([`90001:${ids.s1}`, `90002:${ids.s2}`]);
  });

  it('withdraws a submitted batch when the teacher clears everyone, but refuses an empty first submit', async () => {
    const keyNew = { ...keyL, teacherKey: '90003' };
    await saveDraft(round, keyNew, [{ studentErpId: ids.s2, clear: true }], meta);
    expect(await submitBatch(round, keyNew, [], meta)).toMatchObject({ ok: false, reason: 'empty' });

    await saveDraft(round, keyLB, [{ studentErpId: ids.s2, clear: true }], meta);
    const result = await submitBatch(round, keyLB, [], meta);
    if (!result.ok) throw new Error(JSON.stringify(result));
    expect((await loadReceipt(result.receiptToken))?.rows).toEqual([]);
    const current = await getDb()
      .select({ teacherKey: responses.teacherKey, erpId: responses.studentErpId })
      .from(responses)
      .where(and(eq(responses.roundId, round.id), eq(responses.subjectKey, 'english'), eq(responses.isCurrent, true)));
    expect(current.map((r) => `${r.teacherKey}:${r.erpId}`)).toEqual([`90001:${ids.s1}`]);
    expect((await loadBatch(round, keyL))?.taken).toEqual({});
  });
});
