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
/** Sidebar folded to icons (read on the server, so the page does not jump on load). */
export const SIDE_COOKIE = 'sv-side';

const dayMonth = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short' });

/** "চলমান · ২০ অক্টো বন্ধ": made on the server so the page and the browser show the same text. */
function statusOf(round: { opensAt: Date; closesAt: Date }, now: Date) {
  if (now < round.opensAt) return { open: false, text: `${dayMonth.format(round.opensAt)} খুলবে` };
  if (now <= round.closesAt) return { open: true, text: `চলমান · ${dayMonth.format(round.closesAt)} বন্ধ` };
  return { open: false, text: `বন্ধ · ${dayMonth.format(round.closesAt)}` };
}

const EMPTY = { rounds: [] as { id: string; label: string; status: { open: boolean; text: string } }[], chosenId: null as string | null, pending: null as number | null, collapsed: false };

/** The teacher round a page should show: its ?round=, else the one chosen in the sidebar. */
export async function chosenRoundId(requested?: string): Promise<string | undefined> {
  return requested || (await cookies()).get(ROUND_COOKIE)?.value || undefined;
}

/**
 * Round list for the sidebar (no snapshots), the chosen teacher round and the guardians still to
 * answer. A database failure gives an empty sidebar, so the page's own error message shows.
 */
export async function shellData(): Promise<typeof EMPTY> {
  const collapsed = (await cookies()).get(SIDE_COOKIE)?.value === '1';
  try {
    return { ...(await loadShell()), collapsed };
  } catch (error) {
    console.error('Admin sidebar data failed', error);
    return { ...EMPTY, collapsed };
  }
}

async function loadShell() {
  const db = getDb();
  const now = new Date();
  const rounds = await db
    .select({ id: surveyRounds.id, kind: surveyRounds.kind, label: surveyRounds.label, opensAt: surveyRounds.opensAt, closesAt: surveyRounds.closesAt })
    .from(surveyRounds)
    .orderBy(asc(surveyRounds.opensAt));
  const t1Rounds = rounds.filter((r) => r.kind === 'T1');
  const chosen = pickRound(t1Rounds, await chosenRoundId());
  // Tracker badge: active children without a current form in the guardian round paired with it,
  // while that round is open.
  const g2 = chosen ? pairedRound(chosen, rounds, 'G2') : undefined;
  let pending: number | null = null;
  if (g2 && statusOf(g2, now).open) {
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
    rounds: [...t1Rounds].reverse().map((r) => ({ id: r.id, label: r.label, status: statusOf(r, now) })),
    chosenId: chosen?.id ?? null,
    pending,
  };
}

export type ShellData = Awaited<ReturnType<typeof shellData>>;
