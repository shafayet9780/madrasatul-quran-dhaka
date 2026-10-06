import 'server-only';
import { and, asc, eq, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { getDb } from './db';
import { pairedRound } from './guardian-report-math';
import { pickRound } from './reports';
import { responses, students, surveyRounds } from './schema';

// The admin shell (sidebar): one teacher round chosen for every report page, kept in a cookie;
// a page's own ?round= still wins (links carry it).

export const ROUND_COOKIE = 'sv-round';

/** The teacher round a page should show: its ?round=, else the one chosen in the sidebar. */
export async function chosenRoundId(requested?: string): Promise<string | undefined> {
  return requested || (await cookies()).get(ROUND_COOKIE)?.value || undefined;
}

/** Round list for the sidebar (no snapshots), the chosen teacher round and the guardians still to answer. */
export async function shellData() {
  const db = getDb();
  const rounds = await db
    .select({ id: surveyRounds.id, kind: surveyRounds.kind, label: surveyRounds.label, opensAt: surveyRounds.opensAt, closesAt: surveyRounds.closesAt })
    .from(surveyRounds)
    .orderBy(asc(surveyRounds.opensAt));
  const t1Rounds = rounds.filter((r) => r.kind === 'T1');
  const chosen = pickRound(t1Rounds, await chosenRoundId());
  // Tracker badge: active children without a current form in the guardian round paired with it.
  const g2 = chosen ? pairedRound(chosen, rounds, 'G2') : undefined;
  let pending: number | null = null;
  if (g2) {
    const [[roster], [answered]] = await Promise.all([
      db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(students).where(eq(students.active, true)),
      db
        .select({ n: sql<number>`count(DISTINCT ${responses.studentErpId})`.mapWith(Number) })
        .from(responses)
        .innerJoin(students, and(eq(students.erpId, responses.studentErpId), eq(students.active, true)))
        .where(and(eq(responses.roundId, g2.id), eq(responses.isCurrent, true))),
    ]);
    pending = Math.max(0, roster.n - answered.n);
  }
  return {
    rounds: [...t1Rounds].reverse().map((r) => ({ id: r.id, label: r.label, opensAt: r.opensAt.toISOString(), closesAt: r.closesAt.toISOString() })),
    chosenId: chosen?.id ?? null,
    pending,
  };
}

export type ShellData = Awaited<ReturnType<typeof shellData>>;
