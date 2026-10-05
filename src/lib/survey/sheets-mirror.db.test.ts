import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { and, eq, isNotNull, like } from 'drizzle-orm';

const { get, batchUpdate, update, append } = vi.hoisted(() => ({ get: vi.fn(), batchUpdate: vi.fn(), update: vi.fn(), append: vi.fn() }));
vi.mock('@/lib/google-sheets-server', () => ({
  sheetsConfigured: () => true,
  getSheetsClient: () => ({ spreadsheets: { get, batchUpdate, values: { update, append } } }),
}));

import { getDb } from './db';
import { students, submissions, surveyRounds } from './schema';
import { mirrorPending } from './sheets-mirror';
import { submitGuardian } from './guardian';
import { saveDraft, submitBatch } from './t1';
import { g2FixtureSnapshot } from './testing/guardian-fixture';
import { t1FixtureSnapshot } from './testing/t1-fixture';

const run = `test-mirror-${Date.now()}`;
const hour = 60 * 60 * 1000;
const meta = { ip: null, userAgent: 'vitest' };
let roundId = '';

beforeAll(async () => {
  vi.stubEnv('SURVEY_SHEET_ID', 'sheet-id');
  const db = getDb();
  const snapshot = t1FixtureSnapshot();
  snapshot.classes.push({ key: 'mirror-class', name: 'পরীক্ষা', sections: [], subjects: [{ key: 'quran', name: 'কুরআন' }] });
  const [round] = await db
    .insert(surveyRounds)
    .values({ sanityRoundId: run, kind: 'T1', slug: run, label: 'পরীক্ষা', snapshot, opensAt: new Date(Date.now() - hour), closesAt: new Date(Date.now() + hour), linkKey: 'k' })
    .returning();
  roundId = round.id;
  await db.insert(students).values([{ erpId: `${run}-1`, name: 'ZAINAB AKTER', classKey: 'mirror-class', sectionKey: '', roll: 1 }]);
  const key = { teacherKey: '90001', classKey: 'mirror-class', sectionKey: '', subjectKey: 'quran' };
  const answers = Object.fromEntries(snapshot.template.questions.map((q) => [q.key, 8]));
  await saveDraft(round, key, [{ studentErpId: `${run}-1`, answers }], meta);
  const result = await submitBatch(round, key, [], meta);
  if (!result.ok) throw new Error(JSON.stringify(result));
});

afterAll(async () => {
  const db = getDb();
  await db.delete(submissions).where(and(eq(submissions.roundId, roundId), isNotNull(submissions.supersededBy)));
  await db.delete(submissions).where(eq(submissions.roundId, roundId));
  await db.delete(surveyRounds).where(eq(surveyRounds.id, roundId));
  await db.delete(students).where(like(students.erpId, `${run}%`));
  vi.unstubAllEnvs();
});

beforeEach(() => vi.clearAllMocks());

const mirroredAt = async () =>
  (await getDb().select({ m: submissions.mirroredAt }).from(submissions).where(eq(submissions.roundId, roundId)))[0].m;

describe('mirrorPending', () => {
  it('releases the claim when the append fails, so the daily job retries', async () => {
    get.mockResolvedValue({ data: { sheets: [{ properties: { title: run } }] } });
    append.mockRejectedValue(new Error('quota'));
    expect(await mirrorPending({ roundId })).toEqual({ mirrored: 0, failed: 1 });
    expect(await mirroredAt()).toBeNull();
  });

  it('creates the round tab with a header, appends one row per student and marks it copied', async () => {
    get.mockResolvedValue({ data: { sheets: [{ properties: { title: 'Sheet1' } }] } });
    append.mockResolvedValue({});
    expect(await mirrorPending({ roundId })).toEqual({ mirrored: 1, failed: 0 });
    expect(batchUpdate).toHaveBeenCalledWith(expect.objectContaining({ requestBody: { requests: [{ addSheet: expect.objectContaining({ properties: expect.objectContaining({ title: run }) }) }] } }));
    expect(update.mock.calls[0][0].requestBody.values[0][0]).toBe('জমার সময়');
    const rows = append.mock.calls[0][0].requestBody.values;
    expect(rows).toHaveLength(1);
    expect(rows[0].slice(2, 10)).toEqual(['বর্তমান', 'উস্তাদ আব্দুল্লাহ', 'পরীক্ষা', '', 'কুরআন', 1, `${run}-1`, 'Zainab Akter']);
    expect(await mirroredAt()).not.toBeNull();
  });

  it('leaves a fresh claim alone and takes over an abandoned one', async () => {
    const db = getDb();
    await db.update(submissions).set({ mirroredAt: null, mirrorClaimedAt: new Date() }).where(eq(submissions.roundId, roundId));
    expect(await mirrorPending({ roundId })).toEqual({ mirrored: 0, failed: 0 });
    await db.update(submissions).set({ mirrorClaimedAt: new Date(Date.now() - 20 * 60 * 1000) }).where(eq(submissions.roundId, roundId));
    get.mockResolvedValue({ data: { sheets: [{ properties: { title: run } }] } });
    append.mockResolvedValue({});
    expect(await mirrorPending({ roundId })).toEqual({ mirrored: 1, failed: 0 });
    const [row] = await db.select().from(submissions).where(eq(submissions.roundId, roundId));
    expect(row.mirroredAt).not.toBeNull();
    expect(row.mirrorClaimedAt).toBeNull();
  });

  it('does nothing when everything is already copied', async () => {
    expect(await mirrorPending({ roundId })).toEqual({ mirrored: 0, failed: 0 });
    expect(append).not.toHaveBeenCalled();
  });
});

describe('mirrorPending for a guardian round', () => {
  const gRun = `${run}-g`;
  let gRoundId = '';
  const form = (mobile: string) => ({
    submissionId: crypto.randomUUID(),
    classKey: 'kg',
    sectionKey: 'a',
    studentErpId: `${gRun}-1`,
    submitter: { name: 'করিম', relation: 'father' as const, relationOther: '', mobile },
    answers: { attendance: 'above-90', 'study-at-home': 'na', devices: 'never', 'peer-complaints': 'never' },
    comment: '',
  });

  beforeAll(async () => {
    const db = getDb();
    const [round] = await db
      .insert(surveyRounds)
      .values({ sanityRoundId: gRun, kind: 'G2', slug: gRun, label: 'পরীক্ষা', snapshot: g2FixtureSnapshot(), opensAt: new Date(Date.now() - hour), closesAt: new Date(Date.now() + hour), linkKey: 'k' })
      .returning();
    gRoundId = round.id;
    await db.insert(students).values([{ erpId: `${gRun}-1`, name: 'HASAN', classKey: 'kg', sectionKey: 'a', roll: 3, fatherMobile: '8801700000009' }]);
    for (const mobile of ['01700000009', '01855000001']) {
      const result = await submitGuardian(round, form(mobile), meta);
      if (!result.ok) throw new Error(JSON.stringify(result));
    }
  });

  afterAll(async () => {
    const db = getDb();
    await db.delete(submissions).where(and(eq(submissions.roundId, gRoundId), isNotNull(submissions.supersededBy)));
    await db.delete(submissions).where(eq(submissions.roundId, gRoundId));
    await db.delete(surveyRounds).where(eq(surveyRounds.id, gRoundId));
  });

  it('copies each form with the guardian columns, the earlier one marked as replaced', async () => {
    get.mockResolvedValue({ data: { sheets: [{ properties: { title: 'Sheet1' } }] } });
    append.mockResolvedValue({});
    expect(await mirrorPending({ roundId: gRoundId })).toEqual({ mirrored: 2, failed: 0 });
    expect(update.mock.calls[0][0].requestBody.values[0].slice(8, 12)).toEqual(['প্রদানকারী', 'সম্পর্ক', 'মোবাইল', 'যাচাই']);
    const rows = append.mock.calls.map((call) => call[0].requestBody.values[0]);
    expect(rows.map((r) => [r[2], r[10], r[11], r[13]])).toEqual([
      ['পুরনো (সংশোধিত)', '+8801700000009', 'যাচাইকৃত', 'প্রযোজ্য নয় (ডে কেয়ার)'],
      ['বর্তমান', '+8801855000001', 'অযাচাইকৃত', 'প্রযোজ্য নয় (ডে কেয়ার)'],
    ]);
  });
});
