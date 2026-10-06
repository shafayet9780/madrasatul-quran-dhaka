import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { and, eq, isNotNull, like } from 'drizzle-orm';
import { getDb } from './db';
import { submitGuardian } from './guardian';
import { guardianComments, guardianItems, resolveRounds, teachingCell, teachingQuality } from './guardian-reports';
import { students, submissions, surveyRounds } from './schema';
import { g1FixtureSnapshot } from './testing/guardian-fixture';
import { t1FixtureSnapshot } from './testing/t1-fixture';

const run = `test-greports-${Date.now()}`;
const hour = 60 * 60 * 1000;
const meta = { ip: null, userAgent: 'vitest' };
type Round = typeof surveyRounds.$inferSelect;
let g1: Round;

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
  await db.delete(submissions).where(and(eq(submissions.roundId, g1.id), isNotNull(submissions.supersededBy)));
  await db.delete(submissions).where(eq(submissions.roundId, g1.id));
  await db.delete(surveyRounds).where(eq(surveyRounds.id, g1.id));
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

describe('resolveRounds', () => {
  const at = (id: string, kind: Round['kind'], opens: number, closes: number) =>
    ({ ...g1, id, kind, snapshot: t1FixtureSnapshot(), opensAt: new Date(Date.UTC(2026, 9, opens)), closesAt: new Date(Date.UTC(2026, 9, closes)) }) as Round;
  const t1Old = at('t1-old', 'T1', 1, 10);
  const t1 = at('t1', 'T1', 20, 30);
  const g2 = at('g2', 'G2', 12, 18);

  it('pairs by date and never compares a guardian round with itself', () => {
    // One G2 round between two teacher rounds pairs with both: the comparison drops it.
    const resolved = resolveRounds(t1, [t1Old, g2, t1], {});
    expect(resolved.g2?.id).toBe('g2');
    expect(resolved.compareT1?.id).toBe('t1-old');
    expect(resolved.cg2).toBeUndefined();
  });

  it('honours "no comparison" and a picked guardian round', () => {
    const resolved = resolveRounds(t1, [t1Old, g2, t1], { compare: 'none', g2: 'g2' });
    expect(resolved.compareT1).toBeUndefined();
    expect(resolved.g2?.id).toBe('g2');
  });
});
