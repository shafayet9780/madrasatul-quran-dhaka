import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { and, eq, isNotNull, like } from 'drizzle-orm';
import { getDb } from './db';
import { lookupChildren, pruneLookups, submitGuardian, verifyMobile } from './guardian';
import { loadReceipt } from './t1';
import { answerItems, responses, students, submissions, surveyLookups, surveyRounds } from './schema';
import { g2FixtureSnapshot } from './testing/guardian-fixture';

const run = `test-guardian-${Date.now()}`;
const hour = 60 * 60 * 1000;
const FATHER = '8801915000111';
const MOTHER = '447911000222';
type Round = typeof surveyRounds.$inferSelect;
let round: Round;
const submittedAt = new Date('2026-10-12T15:00:00Z');

beforeAll(async () => {
  const db = getDb();
  const snapshot = g2FixtureSnapshot();
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
  await db.delete(submissions).where(and(eq(submissions.roundId, round.id), isNotNull(submissions.supersededBy)));
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
    expect(await verifyMobile(`${run}-a`, FATHER)).toBe(true);
    expect(await verifyMobile(`${run}-a`, MOTHER)).toBe(true);
    expect(await verifyMobile(`${run}-a`, '8801855203941')).toBe(false);
    expect(await verifyMobile(`${run}-d`, FATHER)).toBe(false);
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

describe('submitGuardian', () => {
  const meta = { ip: '203.0.113.9', userAgent: 'test' };
  const answers = { attendance: 'above-90', 'study-at-home': 'na', devices: '1-2-weekly', 'peer-complaints': 'never' };
  const form = (patch: Record<string, unknown> = {}) => ({
    submissionId: randomUUID(),
    classKey: 'kg',
    sectionKey: 'a',
    studentErpId: `${run}-b`,
    submitter: { name: ' করিম ', relation: 'father' as const, relationOther: '', mobile: '01915 000 111' },
    answers,
    comment: '  আলহামদুলিল্লাহ ',
    ...patch,
  });
  const current = async (erpId: string) =>
    getDb()
      .select({ submissionId: responses.submissionId })
      .from(responses)
      .where(and(eq(responses.roundId, round.id), eq(responses.studentErpId, erpId), eq(responses.isCurrent, true)));

  it('stores a verified form with hidden marks, N/A kept out of the marks', async () => {
    const input = form();
    const result = await submitGuardian(round, input, meta);
    expect(result.ok).toBe(true);
    const [saved] = await getDb().select().from(submissions).where(eq(submissions.id, input.submissionId));
    expect(saved).toMatchObject({ status: 'submitted', kind: 'G2', submitterName: 'করিম', submitterRelation: 'পিতা', submitterMobile: FATHER, verified: true, comment: 'আলহামদুলিল্লাহ', mirroredAt: null });
    const items = await getDb().select().from(answerItems).where(eq(answerItems.submissionId, input.submissionId));
    expect(items.map((i) => [i.questionKey, i.mark, i.isNa, i.optionKey, i.verified]).sort()).toEqual([
      ['attendance', 10, false, 'above-90', true],
      ['devices', 7, false, '1-2-weekly', true],
      ['peer-complaints', 10, false, 'never', true],
      ['study-at-home', null, true, null, true],
    ]);
  });

  it('returns the same receipt for a repeated submit of the same form', async () => {
    const input = form();
    const first = await submitGuardian(round, input, meta);
    const again = await submitGuardian(round, input, meta);
    expect(again).toEqual(first);
  });

  it('lets the newest form count, keeping the earlier one superseded', async () => {
    const before = await current(`${run}-b`);
    const input = form({ submitter: { name: 'অন্য কেউ', relation: 'other', relationOther: 'মামা', mobile: '01855203941' } });
    expect((await submitGuardian(round, input, meta)).ok).toBe(true);
    expect(await current(`${run}-b`)).toEqual([{ submissionId: input.submissionId }]);
    const [old] = await getDb().select().from(submissions).where(eq(submissions.id, before[0].submissionId));
    expect(old.supersededBy).toBe(input.submissionId);
    expect(await getDb().select().from(answerItems).where(eq(answerItems.submissionId, old.id))).toEqual([]);
    const [saved] = await getDb().select().from(submissions).where(eq(submissions.id, input.submissionId));
    expect(saved).toMatchObject({ submitterRelation: 'মামা', verified: false });
  });

  it('refuses incomplete answers, a child of another class and a missing relation', async () => {
    expect(await submitGuardian(round, form({ answers: { attendance: 'above-90' } }), meta)).toEqual({ ok: false, reason: 'incomplete', missing: ['study-at-home', 'devices', 'peer-complaints'] });
    expect(await submitGuardian(round, form({ studentErpId: `${run}-c` }), meta)).toEqual({ ok: false, reason: 'invalid' });
    expect(await submitGuardian(round, form({ studentErpId: `${run}-d` }), meta)).toEqual({ ok: false, reason: 'invalid' });
    expect(await submitGuardian(round, form({ submitter: { name: 'ক', relation: 'other', relationOther: ' ', mobile: '01915000111' } }), meta)).toEqual({ ok: false, reason: 'submitter' });
  });

  it('sends a receipt again only to the same sender of the same form', async () => {
    const input = form({ studentErpId: `${run}-a` });
    expect((await submitGuardian(round, input, meta)).ok).toBe(true);
    expect(await submitGuardian(round, { ...input, submitter: { ...input.submitter, mobile: '01855203941' } }, meta)).toEqual({ ok: false, reason: 'invalid' });
    expect(await submitGuardian(round, { ...input, studentErpId: `${run}-b` }, meta)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('links a replaced receipt to the newer one only for the same mobile', async () => {
    const first = await submitGuardian(round, form({ studentErpId: `${run}-a` }), meta);
    const sameParent = await submitGuardian(round, form({ studentErpId: `${run}-a` }), meta);
    const otherPerson = await submitGuardian(round, form({ studentErpId: `${run}-a`, submitter: { name: 'অন্য', relation: 'mother', relationOther: '', mobile: '+44 7911 000222' } }), meta);
    if (!first.ok || !sameParent.ok || !otherPerson.ok) throw new Error('submit failed');
    const firstReceipt = await loadReceipt(first.receiptToken);
    expect(firstReceipt).toMatchObject({ replacedBy: sameParent.receiptToken, setAside: false });
    const secondReceipt = await loadReceipt(sameParent.receiptToken);
    expect(secondReceipt).toMatchObject({ replacedBy: null, setAside: true });
  });

  it('keeps exactly one current form when two arrive at once', async () => {
    const results = await Promise.all([submitGuardian(round, form({ studentErpId: `${run}-a` }), meta), submitGuardian(round, form({ studentErpId: `${run}-a` }), meta)]);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(await current(`${run}-a`)).toHaveLength(1);
  });

  it('refuses after the grace period', async () => {
    const closed = { ...round, closesAt: new Date(Date.now() - 20 * 60 * 1000) };
    expect(await submitGuardian(closed, form(), meta)).toEqual({ ok: false, reason: 'closed' });
  });
});
