import 'server-only';
import { randomBytes } from 'node:crypto';
import { and, desc, eq, gt, sql } from 'drizzle-orm';
import { buildLists, buildRound, listProblems, summarise, type RoundSummary } from './build-round';
import { getDb } from './db';
import { surveyRounds, submissions } from './schema';
import { roundSnapshotSchema } from './snapshot';
import { fetchListsSource, fetchRoundSource } from './sanity-source';

export type OpenRoundResult =
  | { ok: true; alreadyOpen: boolean; dryRun: boolean; roundId?: string; slug: string; linkKey?: string; summary: RoundSummary }
  | { ok: false; errors: string[] };

export function surveyPath(slug: string, linkKey: string): string {
  return `/survey/${slug}?k=${linkKey}`;
}

async function findBySanityId(sanityRoundId: string) {
  const [row] = await getDb().select().from(surveyRounds).where(eq(surveyRounds.sanityRoundId, sanityRoundId)).limit(1);
  return row;
}

/**
 * Opens a published Sanity round: validates it, snapshots template + lists and creates the
 * survey_rounds row. Opening again returns the existing round unchanged.
 */
export async function openRound(
  sanityRoundId: string,
  { dates, dryRun = false }: { dates?: { opensAt: Date; closesAt: Date }; dryRun?: boolean } = {}
): Promise<OpenRoundResult> {
  const existing = await findBySanityId(sanityRoundId);
  if (existing) {
    return {
      ok: true,
      alreadyOpen: true,
      dryRun,
      roundId: existing.id,
      slug: existing.slug,
      linkKey: existing.linkKey,
      summary: summarise(existing.snapshot),
    };
  }

  const built = buildRound(await fetchRoundSource(sanityRoundId), { dates });
  if (!built.ok) return built;
  const { round } = built;
  if (dryRun) return { ok: true, alreadyOpen: false, dryRun, slug: round.slug, summary: round.summary };

  const [inserted] = await getDb()
    .insert(surveyRounds)
    .values({
      sanityRoundId,
      kind: round.kind,
      slug: round.slug,
      label: round.label,
      snapshot: round.snapshot,
      opensAt: round.opensAt,
      closesAt: round.closesAt,
      linkKey: randomBytes(18).toString('base64url'),
    })
    .onConflictDoNothing()
    .returning();
  if (inserted) {
    return { ok: true, alreadyOpen: false, dryRun, roundId: inserted.id, slug: inserted.slug, linkKey: inserted.linkKey, summary: round.summary };
  }

  // Lost a race with another open of the same round, or the link name is taken.
  if (await findBySanityId(sanityRoundId)) return openRound(sanityRoundId);
  return { ok: false, errors: [`লিংক নাম "${round.slug}" আগের একটি রাউন্ডে ব্যবহার হয়েছে; Studio-তে বদলান।`] };
}

export type RoundListItem = typeof surveyRounds.$inferSelect & {
  current: number;
  coveredPairs: number;
  drafts: number;
};

/** Opened rounds, newest first, with submission counts. */
export async function listRounds(): Promise<RoundListItem[]> {
  const db = getDb();
  const isCurrent = sql`${submissions.status} = 'submitted' AND ${submissions.supersededBy} IS NULL`;
  const counts = db
    .select({
      roundId: submissions.roundId,
      current: sql<number>`count(*) FILTER (WHERE ${isCurrent})`.mapWith(Number).as('current'),
      coveredPairs: sql<number>`count(DISTINCT (${submissions.classKey}, ${submissions.sectionKey}, ${submissions.subjectKey})) FILTER (WHERE ${isCurrent})`
        .mapWith(Number)
        .as('covered_pairs'),
      drafts: sql<number>`count(*) FILTER (WHERE ${submissions.status} = 'draft')`.mapWith(Number).as('drafts'),
    })
    .from(submissions)
    .groupBy(submissions.roundId)
    .as('counts');

  const rows = await db
    .select({ round: surveyRounds, current: counts.current, coveredPairs: counts.coveredPairs, drafts: counts.drafts })
    .from(surveyRounds)
    .leftJoin(counts, eq(counts.roundId, surveyRounds.id))
    .orderBy(desc(surveyRounds.opensAt));
  return rows.map((r) => ({ ...r.round, current: r.current ?? 0, coveredPairs: r.coveredPairs ?? 0, drafts: r.drafts ?? 0 }));
}

export async function setClosesAt(roundId: string, closesAt: Date, now = new Date()): Promise<string | null> {
  if (closesAt <= now) return 'নতুন বন্ধের সময় এখনকার পরে হতে হবে।';
  const [row] = await getDb()
    .update(surveyRounds)
    .set({ closesAt, updatedAt: now })
    .where(and(eq(surveyRounds.id, roundId), sql`${surveyRounds.opensAt} < ${closesAt}`))
    .returning({ id: surveyRounds.id });
  return row ? null : 'বন্ধের সময় খোলার সময়ের পরে হতে হবে।';
}

/** Closes an open or scheduled round now; no-op when already closed. */
export async function closeRound(roundId: string, now = new Date()): Promise<void> {
  await getDb()
    .update(surveyRounds)
    .set({ closesAt: now, updatedAt: now })
    .where(and(eq(surveyRounds.id, roundId), gt(surveyRounds.closesAt, now)));
}

/** Re-copies classes, subjects and teachers from Studio into an opened round; questions stay as they were. */
export async function refreshRoundLists(roundId: string): Promise<{ ok: true; summary: RoundSummary } | { ok: false; errors: string[] }> {
  const db = getDb();
  const [round] = await db.select().from(surveyRounds).where(eq(surveyRounds.id, roundId)).limit(1);
  if (!round) return { ok: false, errors: ['রাউন্ডটি পাওয়া যায়নি।'] };
  const lists = buildLists(await fetchListsSource());
  const errors = listProblems(round.kind, lists);
  if (errors.length) return { ok: false, errors };
  const parsed = roundSnapshotSchema.safeParse({ ...round.snapshot, ...lists });
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((i) => `Studio-র তথ্যে সমস্যা: ${i.path.join(' › ')} (${i.message})`) };
  }
  const snapshot = parsed.data;
  await db.update(surveyRounds).set({ snapshot, updatedAt: new Date() }).where(eq(surveyRounds.id, roundId));
  return { ok: true, summary: summarise(snapshot) };
}
