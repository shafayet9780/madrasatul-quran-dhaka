import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { and, eq, isNotNull, like } from 'drizzle-orm';
import { getDb } from './db';
import { submitGuardian } from './guardian';
import { classGuardian, guardianComments, guardianItems, studentGuardian, teachingCell, teachingQuality } from './guardian-reports';
import { students, submissions, surveyRounds } from './schema';
import { g1FixtureSnapshot, g2FixtureSnapshot } from './testing/guardian-fixture';
import { t1FixtureSnapshot } from './testing/t1-fixture';

const run = `test-greports-${Date.now()}`;
const hour = 60 * 60 * 1000;
const meta = { ip: null, userAgent: 'vitest' };
type Round = typeof surveyRounds.$inferSelect;
let g1: Round;
let g2: Round;

const marks = (mark: number) => {
  const snapshot = g1FixtureSnapshot();
  const subjects = snapshot.classes.find((c) => c.key === 'nursery')!.subjects;
  return Object.fromEntries(snapshot.template.questions.map((q) => [q.key, Object.fromEntries(subjects.map((s) => [s.key, mark]))]));
};
const form = (child: string, mobile: string, mark: number, comment = '') => ({
  submissionId: randomUUID(),
  classKey: 'nursery',
  sectionKey: 'a',
  studentErpId: `${run}-${child}`,
  submitter: { name: `অভিভাবক ${child}`, relation: 'father' as const, relationOther: '', mobile },
  answers: marks(mark),
  comment,
});

beforeAll(async () => {
  const db = getDb();
  [g1] = await db
    .insert(surveyRounds)
    .values({ sanityRoundId: run, kind: 'G1', slug: run, label: 'পরীক্ষা', snapshot: g1FixtureSnapshot(), opensAt: new Date(Date.now() - hour), closesAt: new Date(Date.now() + hour), linkKey: 'k' })
    .returning();
  await db.insert(students).values(['1', '2', '3'].map((n) => ({ erpId: `${run}-${n}`, name: `Child ${n}`, classKey: 'nursery', sectionKey: 'a', roll: Number(n), fatherMobile: `880170000090${n}` })));
  [g2] = await db
    .insert(surveyRounds)
    .values({ sanityRoundId: `${run}-g2`, kind: 'G2', slug: `${run}-g2`, label: 'পরীক্ষা G2', snapshot: g2FixtureSnapshot(), opensAt: new Date(Date.now() - hour), closesAt: new Date(Date.now() + hour), linkKey: 'k' })
    .returning();
  const g2Form = (child: string, mobile: string, answers: Record<string, string>, comment = '') => ({ ...form(child, mobile, 0, comment), answers });
  const top = { attendance: 'above-90', 'study-at-home': '4h', devices: 'never', 'peer-complaints': 'never' };
  for (const input of [
    g2Form('1', '01700000901', { ...top, devices: '3-plus-weekly' }),
    g2Form('1', '01700000901', { ...top, 'study-at-home': 'na' }, 'শান্ত থাকে'),
    g2Form('2', '01855000000', { ...top, attendance: 'below-70' }),
  ]) {
    const result = await submitGuardian(g2, input, meta);
    if (!result.ok) throw new Error(JSON.stringify(result));
  }
  for (const input of [
    form('1', '01700000901', 10, 'ভালো'),
    form('2', '01855000000', 4, 'আগের মন্তব্য'),
    form('2', '01855000000', 6, 'নতুন মন্তব্য'),
    form('3', '01855000001', 8),
  ]) {
    const result = await submitGuardian(g1, input, meta);
    if (!result.ok) throw new Error(JSON.stringify(result));
  }
});

afterAll(async () => {
  const db = getDb();
  for (const round of [g1, g2]) {
    await db.delete(submissions).where(and(eq(submissions.roundId, round.id), isNotNull(submissions.supersededBy)));
    await db.delete(submissions).where(eq(submissions.roundId, round.id));
    await db.delete(surveyRounds).where(eq(surveyRounds.id, round.id));
  }
  await db.delete(students).where(like(students.erpId, `${run}%`));
});

describe('guardian report queries', () => {
  it('reads current forms only, and only verified ones when asked', async () => {
    const all = await guardianItems([g1.id], { verifiedOnly: false });
    expect(new Set(all.map((i) => i.studentErpId)).size).toBe(3);
    // Child 2's replaced form (all ৪) is gone; the current one has ৬.
    expect(all.filter((i) => i.studentErpId === `${run}-2`).every((i) => i.mark === 6)).toBe(true);
    const verified = await guardianItems([g1.id], { verifiedOnly: true });
    expect([...new Set(verified.map((i) => i.studentErpId))]).toEqual([`${run}-1`]);
  });

  it('builds the heatmap cell and its detail from those forms', async () => {
    const report = await teachingQuality(g1, undefined, { verifiedOnly: false });
    const cell = report.rows.find((r) => r.classKey === 'nursery' && r.sectionKey === 'a')!.cells.find((c) => c?.subjectKey === 'quran')!;
    expect(cell).toMatchObject({ respondents: 3, reliable: true, mean: 8, delta: null });
    const detail = await teachingCell(g1, undefined, { classKey: 'nursery', sectionKey: 'a', subjectKey: 'quran' }, { verifiedOnly: true });
    expect(detail).toMatchObject({ respondents: 1, reliable: false });
  });

  it('lists the comments of current forms only, verified ones when asked', async () => {
    const all = await guardianComments(g1.id, { classKey: 'nursery', sectionKey: 'a' }, { verifiedOnly: false });
    expect(all.map((c) => c.text)).toEqual(['ভালো', 'নতুন মন্তব্য']);
    const verified = await guardianComments(g1.id, { classKey: 'nursery', sectionKey: 'a' }, { verifiedOnly: true });
    expect(verified.map((c) => c.text)).toEqual(['ভালো']);
  });
});

describe('guardian parts of the class and student reports', () => {
  // A teacher round running at the same time pairs with both guardian rounds by date.
  const t1 = () => ({ ...g1, id: `${run}-t1`, kind: 'T1' as const, snapshot: t1FixtureSnapshot() });
  const place = { classKey: 'nursery', sectionKey: 'a' };

  it('gives each child the current form\'s average and status', async () => {
    const report = await classGuardian(t1(), [g1, g2, t1()], place, { verifiedOnly: false });
    expect(report.g2.round?.id).toBe(g2.id);
    // Child 1's newer form: ১০ for attendance, devices and complaints; study at home is N/A.
    expect(report.means.get(`${run}-1`)).toBe(10);
    expect(report.means.get(`${run}-2`)).toBe(8.5);
    expect(Object.fromEntries(report.status)).toEqual({ [`${run}-1`]: 'verified', [`${run}-2`]: 'unverified' });
    const verified = await classGuardian(t1(), [g1, g2, t1()], place, { verifiedOnly: true });
    expect([...verified.means.keys()]).toEqual([`${run}-1`]);
  });

  it('shows one child\'s answers, N/A label and every form', async () => {
    const report = await studentGuardian(t1(), [g1, g2, t1()], `${run}-1`, place, { verifiedOnly: false });
    expect(report.answers.map((a) => a.answer)).toEqual(['উপস্থিতি > ৯০%', 'প্রযোজ্য নয় (ডে কেয়ার)', 'দেখে না', 'আসে না']);
    expect(report.form?.comment).toBe('শান্ত থাকে');
    // Oldest first, like the teachers' history: the replaced G2 form, the current one, then G1.
    expect(report.log.map((l) => [l.kind, Boolean(l.supersededBy)])).toEqual([
      ['G2', true],
      ['G2', false],
      ['G1', false],
    ]);
  });
});
