import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq, like } from 'drizzle-orm';
import { getDb } from './db';
import { lookupChildren, pruneLookups, verifyMobile } from './guardian';
import { responses, students, submissions, surveyLookups, surveyRounds } from './schema';
import { t1FixtureSnapshot } from './testing/t1-fixture';

const run = `test-guardian-${Date.now()}`;
const hour = 60 * 60 * 1000;
const FATHER = '8801915000111';
const MOTHER = '447911000222';
type Round = typeof surveyRounds.$inferSelect;
let round: Round;
const submittedAt = new Date('2026-10-12T15:00:00Z');

beforeAll(async () => {
  const db = getDb();
  const snapshot = t1FixtureSnapshot();
  snapshot.template.kind = 'G2';
  [round] = await db
    .insert(surveyRounds)
    .values({ sanityRoundId: run, kind: 'G2', slug: run, label: 'পরীক্ষা', snapshot, opensAt: new Date(Date.now() - hour), closesAt: new Date(Date.now() + hour), linkKey: 'k' })
    .returning();
  await db.insert(students).values([
    { erpId: `${run}-b`, name: 'HUSAIN IBN KARIM', classKey: 'kg', sectionKey: 'a', roll: 20, fatherMobile: FATHER, motherMobile: MOTHER },
    { erpId: `${run}-a`, name: 'Hasan Ibn Karim', classKey: 'kg', sectionKey: 'a', roll: 19, fatherMobile: FATHER, motherMobile: MOTHER },
    { erpId: `${run}-c`, name: 'Older Sibling', classKey: 'six', sectionKey: '', roll: 3, fatherMobile: FATHER },
    { erpId: `${run}-d`, name: 'Left School', classKey: 'kg', sectionKey: 'a', roll: 21, fatherMobile: FATHER, active: false },
  ]);
  const [submission] = await db
    .insert(submissions)
    .values({ roundId: round.id, kind: 'G2', status: 'submitted', classKey: 'kg', sectionKey: 'a', submittedAt, submitterName: 'Test' })
    .returning();
  await db.insert(responses).values({ submissionId: submission.id, roundId: round.id, kind: 'G2', studentErpId: `${run}-a`, studentName: 'Hasan Ibn Karim', classKey: 'kg', sectionKey: 'a', isCurrent: true });
});

afterAll(async () => {
  const db = getDb();
  await db.delete(submissions).where(eq(submissions.roundId, round.id));
  await db.delete(surveyRounds).where(eq(surveyRounds.id, round.id));
  await db.delete(students).where(like(students.erpId, `${run}%`));
});

describe('lookupChildren', () => {
  it('finds twins on a parent mobile within the chosen class only, with an earlier submission date', async () => {
    const children = await lookupChildren(round, { classKey: 'kg', sectionKey: 'a', by: 'mobile', value: MOTHER }, '203.0.113.9');
    expect(children).toEqual([
      { erpId: `${run}-a`, name: 'Hasan Ibn Karim', roll: 19, submittedAt: submittedAt.toISOString() },
      { erpId: `${run}-b`, name: 'Husain Ibn Karim', roll: 20, submittedAt: null },
    ]);
  });

  it('does not find a student of another class, or one who left', async () => {
    expect(await lookupChildren(round, { classKey: 'kg', sectionKey: 'a', by: 'id', value: `${run}-c` }, null)).toEqual([]);
    expect(await lookupChildren(round, { classKey: 'kg', sectionKey: 'a', by: 'id', value: `${run}-d` }, null)).toEqual([]);
    expect(await lookupChildren(round, { classKey: 'six', sectionKey: '', by: 'id', value: `${run}-c` }, null)).toHaveLength(1);
  });

  it('logs each lookup with the last 4 characters only', async () => {
    const rows = await getDb().select().from(surveyLookups).where(eq(surveyLookups.roundId, round.id));
    expect(rows).toHaveLength(4);
    const byMobile = rows.find((r) => r.by === 'mobile')!;
    expect(byMobile).toMatchObject({ classKey: 'kg', sectionKey: 'a', inputTail: '0222', ip: '203.0.113.9', matched: [`${run}-a`, `${run}-b`] });
    expect(JSON.stringify(rows)).not.toContain(MOTHER);
  });
});

describe('verifyMobile', () => {
  it('checks a typed mobile against the father and mother numbers', async () => {
    expect(await verifyMobile(`${run}-a`, '01915 000 111')).toBe(true);
    expect(await verifyMobile(`${run}-a`, '+44 7911 000222')).toBe(true);
    expect(await verifyMobile(`${run}-a`, '01855203941')).toBe(false);
    expect(await verifyMobile(`${run}-d`, '01915000111')).toBe(false);
  });
});

describe('pruneLookups', () => {
  it('removes lookups older than 90 days', async () => {
    const old = new Date(Date.now() - 91 * 24 * hour);
    await getDb().insert(surveyLookups).values({ roundId: round.id, classKey: 'kg', sectionKey: 'a', by: 'id', inputTail: '0001', createdAt: old });
    expect(await pruneLookups()).toBeGreaterThanOrEqual(1);
    const left = await getDb().select().from(surveyLookups).where(eq(surveyLookups.roundId, round.id));
    expect(left.every((r) => r.createdAt > old)).toBe(true);
  });
});
