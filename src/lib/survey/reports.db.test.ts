import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { and, eq, isNotNull, like } from 'drizzle-orm';
import { getDb } from './db';
import { classReport, raterReport, studentReport } from './reports';
import { students, submissions, surveyRounds } from './schema';
import { saveDraft, submitBatch } from './t1';
import { t1FixtureSnapshot } from './testing/t1-fixture';

const run = `test-reports-${Date.now()}`;
const DAY = 24 * 60 * 60 * 1000;
const meta = { ip: null, userAgent: 'vitest' };
type Round = typeof surveyRounds.$inferSelect;
let sept: Round;
let oct: Round;
const id = (n: number) => `${run}-${n}`;
const CLASS = 'reports-class';

function snapshot() {
  const s = t1FixtureSnapshot();
  s.classes.push({ key: CLASS, name: 'রিপোর্ট', sections: [], subjects: [{ key: 'quran', name: 'কুরআন' }, { key: 'math', name: 'গণিত' }] });
  return s;
}
const all = (mark: number) => Object.fromEntries(t1FixtureSnapshot().template.questions.map((q) => [q.key, mark]));

async function rate(round: Round, teacherKey: string, subjectKey: string, marks: Record<string, number>, note?: string) {
  const key = { teacherKey, classKey: CLASS, sectionKey: '', subjectKey };
  await saveDraft(round, key, Object.entries(marks).map(([erp, mark]) => ({ studentErpId: erp, answers: all(mark), ...(note && erp === id(1) ? { note } : {}) })), meta);
  const result = await submitBatch(round, key, [], meta);
  if (!result.ok) throw new Error(JSON.stringify(result));
}

beforeAll(async () => {
  const db = getDb();
  const now = Date.now();
  [sept, oct] = await db
    .insert(surveyRounds)
    .values([
      { sanityRoundId: `${run}-sept`, kind: 'T1', slug: `${run}-sept`, label: 'সেপ্টে', snapshot: snapshot(), opensAt: new Date(now - 60 * DAY), closesAt: new Date(now + DAY), linkKey: 'k' },
      { sanityRoundId: `${run}-oct`, kind: 'T1', slug: `${run}-oct`, label: 'অক্টো', snapshot: snapshot(), opensAt: new Date(now - 30 * DAY), closesAt: new Date(now + DAY), linkKey: 'k' },
    ])
    .returning();
  await db.insert(students).values([1, 2, 3, 4].map((n) => ({ erpId: id(n), name: `STUDENT ${n}`, classKey: CLASS, sectionKey: '', roll: n })));
  // September: everyone 10. October: student 1 drops and gets ৪ from two teachers.
  await rate(sept, 'ustad-abdullah', 'quran', { [id(1)]: 10, [id(2)]: 10, [id(3)]: 10, [id(4)]: 10 });
  await rate(oct, 'ustad-abdullah', 'quran', { [id(1)]: 4, [id(2)]: 10, [id(3)]: 8, [id(4)]: 8 }, 'খুব অমনোযোগী');
  await rate(oct, 'ustad-hamza', 'math', { [id(1)]: 4, [id(2)]: 6, [id(3)]: 6, [id(4)]: 6 });
});

afterAll(async () => {
  const db = getDb();
  for (const round of [sept, oct]) {
    await db.delete(submissions).where(and(eq(submissions.roundId, round.id), isNotNull(submissions.supersededBy)));
    await db.delete(submissions).where(eq(submissions.roundId, round.id));
    await db.delete(surveyRounds).where(eq(surveyRounds.id, round.id));
  }
  await db.delete(students).where(like(students.erpId, `${run}%`));
});

describe('classReport', () => {
  it('averages teacher marks per student, flags drops and lowest marks, and shows trends', async () => {
    const report = await classReport(oct, CLASS, '');
    const s1 = report!.rows.find((r) => r.erpId === id(1))!;
    expect(s1).toMatchObject({ name: 'Student 1', mean: 4, teachers: 2 });
    expect(s1.flags.map((f) => f.kind)).toEqual(['drop', 'low-teachers']);
    expect(s1.trend.map((p) => p.mean)).toEqual([10, 4]);
    expect(report!.kpis).toMatchObject({ ratedStudents: 4, flagged: expect.any(Number), subjectsCovered: 2, subjectsTotal: 2 });
    expect(report!.areas.find((a) => a.areaKey === 'attendance')).toMatchObject({ students: 4, reliable: true });
    expect(await classReport(oct, CLASS, 'a')).toBeNull();
  });
});

describe('studentReport', () => {
  it('builds the subject × question grid, notes and history', async () => {
    const report = await studentReport(oct, id(1));
    expect(report!.student).toMatchObject({ name: 'Student 1', label: 'রিপোর্ট', roll: 1 });
    expect(report!.grid.map((g) => [g.subject, g.teacher, g.marks?.[0]])).toEqual([
      ['কুরআন', 'উস্তাদ আব্দুল্লাহ', 4],
      ['গণিত', 'উস্তাদ হামযা', 4],
    ]);
    expect(report!.notes.map((n) => n.note)).toEqual(['খুব অমনোযোগী']);
    expect(report!.log.map((l) => l.roundLabel)).toEqual(['সেপ্টে', 'অক্টো', 'অক্টো']);
    expect(report!.trend.map((p) => p.mean)).toEqual([10, 4]);
    expect(report!.classMean).toBeCloseTo((4 + 10 + 8 + 8 + 4 + 6 + 6 + 6) / 8, 5);
  });
});

describe('raterReport', () => {
  it('shows distribution and leniency against colleagues on the same students', async () => {
    const rows = await raterReport(oct);
    const abdullah = rows.find((r) => r.teacherKey === 'ustad-abdullah')!;
    const hamza = rows.find((r) => r.teacherKey === 'ustad-hamza')!;
    expect(abdullah).toMatchObject({ batches: 1, students: 4, mean: 7.5 });
    expect(abdullah.distribution.find((d) => d.mark === 8)!.count).toBe(14);
    // Quran is 2 marks kinder than Maths on the same students on average: (0 + 4 + 2 + 2) / 4.
    expect(abdullah.leniency!.delta).toBeCloseTo(2, 5);
    expect(hamza.leniency!.delta).toBeCloseTo(-2, 5);
    expect(abdullah.flatBatches).toEqual([]); // fewer than 10 students
  });
});
