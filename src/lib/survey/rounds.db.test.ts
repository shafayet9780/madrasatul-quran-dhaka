import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq, like } from 'drizzle-orm';
import { getDb } from './db';
import { surveyRounds, submissions } from './schema';
import { roundSource } from './testing/fixtures';
import { roundStatus } from './round-status';

const { fetchRoundSource, fetchListsSource } = vi.hoisted(() => ({ fetchRoundSource: vi.fn(), fetchListsSource: vi.fn() }));
vi.mock('./sanity-source', () => ({ fetchRoundSource, fetchListsSource }));

import { closeRound, listRounds, openRound, refreshRoundLists, setClosesAt } from './rounds';

const run = `test-${Date.now()}`;
const hour = 60 * 60 * 1000;
const dates = () => ({ opensAt: new Date(Date.now() - hour), closesAt: new Date(Date.now() + 24 * hour) });

async function cleanup() {
  const db = getDb();
  const rounds = await db.select({ id: surveyRounds.id }).from(surveyRounds).where(like(surveyRounds.sanityRoundId, 'test-%'));
  for (const { id } of rounds) await db.delete(submissions).where(eq(submissions.roundId, id));
  await db.delete(surveyRounds).where(like(surveyRounds.sanityRoundId, 'test-%'));
}

beforeEach(() => {
  fetchRoundSource.mockImplementation(async (id: string) => roundSource(id, `${id}-link`));
});
afterAll(cleanup);

describe('openRound', () => {
  it('validates on a dry run without creating anything', async () => {
    const id = `${run}-dry`;
    const result = await openRound(id, { dates: dates(), dryRun: true });
    expect(result).toMatchObject({ ok: true, alreadyOpen: false, summary: { questions: 2, t1Pairs: 5 } });
    expect(await getDb().select().from(surveyRounds).where(eq(surveyRounds.sanityRoundId, id))).toHaveLength(0);
  });

  it('is idempotent, including when two opens race', async () => {
    const id = `${run}-race`;
    const [a, b] = await Promise.all([openRound(id, { dates: dates() }), openRound(id, { dates: dates() })]);
    const again = await openRound(id);
    if (!a.ok || !b.ok || !again.ok) throw new Error('open failed');
    expect(new Set([a.roundId, b.roundId, again.roundId]).size).toBe(1);
    expect(again).toMatchObject({ alreadyOpen: true, linkKey: a.linkKey });
    expect(a.linkKey).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect(await getDb().select().from(surveyRounds).where(eq(surveyRounds.sanityRoundId, id))).toHaveLength(1);
  });

  it('refuses a link name already used by another round', async () => {
    const first = `${run}-slug-a`;
    await openRound(first, { dates: dates() });
    fetchRoundSource.mockImplementation(async (id: string) => roundSource(id, `${first}-link`));
    const result = await openRound(`${run}-slug-b`, { dates: dates() });
    expect(result).toEqual({ ok: false, errors: [`লিংক নাম "${first}-link" আগের একটি রাউন্ডে ব্যবহার হয়েছে; Studio-তে বদলান।`] });
  });
});

describe('round lifecycle', () => {
  it('extends, closes and counts submissions', async () => {
    const opened = await openRound(`${run}-life`, { dates: dates() });
    if (!opened.ok || !opened.roundId) throw new Error('open failed');
    const roundId = opened.roundId;
    const db = getDb();

    expect(await setClosesAt(roundId, new Date(Date.now() - hour))).toBe('নতুন বন্ধের সময় এখনকার পরে হতে হবে।');
    const later = new Date(Date.now() + 48 * hour);
    expect(await setClosesAt(roundId, later)).toBeNull();

    const base = { roundId, kind: 'T1' as const, teacherKey: 'teacher-1', classKey: 'nursery', sectionKey: 'a' };
    await db.insert(submissions).values([
      { ...base, subjectKey: 'quran', status: 'submitted', submittedAt: new Date() },
      { ...base, subjectKey: 'arabic', status: 'submitted', submittedAt: new Date() },
      { ...base, subjectKey: 'quran', teacherKey: 'teacher-2', status: 'draft' },
    ]);
    const row = (await listRounds()).find((r) => r.id === roundId)!;
    expect(row).toMatchObject({ current: 2, coveredPairs: 2, drafts: 1 });
    expect(row.closesAt.getTime()).toBe(later.getTime());

    await closeRound(roundId);
    const [closed] = await db.select().from(surveyRounds).where(eq(surveyRounds.id, roundId));
    expect(closed.closesAt.getTime()).toBeLessThanOrEqual(Date.now());
    // Closing again keeps the original close time.
    await closeRound(roundId);
    const [still] = await db.select().from(surveyRounds).where(eq(surveyRounds.id, roundId));
    expect(still.closesAt.getTime()).toBe(closed.closesAt.getTime());
  });

  it('closes a scheduled round so it reads as closed', async () => {
    const opensAt = new Date(Date.now() + 24 * hour);
    const opened = await openRound(`${run}-scheduled`, { dates: { opensAt, closesAt: new Date(opensAt.getTime() + 24 * hour) } });
    if (!opened.ok || !opened.roundId) throw new Error('open failed');
    await closeRound(opened.roundId);
    const [row] = await getDb().select().from(surveyRounds).where(eq(surveyRounds.id, opened.roundId));
    expect(row.opensAt.getTime()).toBeLessThanOrEqual(row.closesAt.getTime());
    expect(roundStatus(row)).toBe('closed');
  });

  it('reports a missing round when extending', async () => {
    expect(await setClosesAt('00000000-0000-4000-8000-000000000000', new Date(Date.now() + hour))).toBe('রাউন্ডটি পাওয়া যায়নি।');
  });

  it('refreshes lists but keeps the questions', async () => {
    const opened = await openRound(`${run}-refresh`, { dates: dates() });
    if (!opened.ok || !opened.roundId) throw new Error('open failed');
    const lists = roundSource();
    fetchListsSource.mockResolvedValue({ ...lists, teachers: [...lists.teachers, { key: 'teacher-2', name: 'উস্তাদ হামযা' }] });
    expect(await refreshRoundLists(opened.roundId)).toMatchObject({ ok: true, summary: { teachers: 2, questions: 2 } });

    fetchListsSource.mockResolvedValue({ ...lists, teachers: [] });
    expect(await refreshRoundLists(opened.roundId)).toEqual({ ok: false, errors: ['কোনো সক্রিয় শিক্ষক নেই (Studio → Surveys → Teachers)।'] });
  });
});
