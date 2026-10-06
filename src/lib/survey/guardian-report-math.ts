import { FLAGS, type Flag } from './report-math';
import { MIN_N, summarise, type Summary } from './stats';

// Pure maths for the guardian reports (R1–R4 and the guardian print), from answer_items rows.

export type GuardianItem = {
  roundId: string;
  studentErpId: string;
  classKey: string;
  sectionKey: string;
  subjectKey: string;
  questionKey: string;
  areaKey: string;
  /** null for "not applicable" (left out of every mean). */
  mark: number | null;
  /** G2 only: the chosen option (null for N/A). */
  optionKey?: string | null;
};

type Marked = { studentErpId: string; mark: number | null };

type Window = { id: string; kind: string; opensAt: Date; closesAt: Date };

const DAY = 24 * 60 * 60 * 1000;

function overlap(a: Window, b: Window): number {
  return Math.max(0, Math.min(a.closesAt.getTime(), b.closesAt.getTime()) - Math.max(a.opensAt.getTime(), b.opensAt.getTime()));
}

/**
 * The guardian round of `kind` that goes with a teacher round (owner decision 2026-10-06): the one
 * whose open period overlaps it most (ties: the nearest opening); without any overlap, the one
 * opening nearest within 30 days; else none.
 */
export function pairedRound<R extends Window>(t1: Window, rounds: R[], kind: 'G1' | 'G2'): R | undefined {
  const candidates = rounds.filter((r) => r.kind === kind);
  const gap = (r: R) => Math.abs(r.opensAt.getTime() - t1.opensAt.getTime());
  const byFit = [...candidates].sort((a, b) => overlap(b, t1) - overlap(a, t1) || gap(a) - gap(b));
  const best = byFit[0];
  if (!best) return undefined;
  if (overlap(best, t1) > 0) return best;
  return gap(best) <= 30 * DAY ? best : undefined;
}

export type CellStats = Summary & { respondents: number; reliable: boolean };

/** Mean (N/A left out), share of ১০ and how many children's guardians answered; greyed below MIN_N. */
export function cellStats(items: GuardianItem[]): CellStats {
  const summary = summarise(items.map((i) => i.mark));
  // Children with at least one counted mark (an all-N/A answer adds nothing to the mean).
  const respondents = new Set(items.filter((i) => i.mark !== null).map((i) => i.studentErpId)).size;
  return { ...summary, respondents, reliable: respondents >= MIN_N };
}

/** Marks given per question, in template order, for a distribution chart. */
export function questionDistributions(items: GuardianItem[], questionKeys: string[], scale: number[]) {
  return questionKeys.map((questionKey) => {
    const stats = summarise(items.filter((i) => i.questionKey === questionKey).map((i) => i.mark));
    return { questionKey, mean: stats.mean, n: stats.n, counts: scale.map((mark) => ({ mark, count: stats.distribution.get(mark) ?? 0 })) };
  });
}

/** Each child's own mean first, so a child answered for in more subjects does not weigh more. */
export function perStudentMeans(items: Marked[]): Map<string, number> {
  const byStudent = new Map<string, (number | null)[]>();
  for (const item of items) byStudent.set(item.studentErpId, [...(byStudent.get(item.studentErpId) ?? []), item.mark]);
  const means = new Map<string, number>();
  for (const [erpId, marks] of byStudent) {
    const { mean } = summarise(marks);
    if (mean !== null) means.set(erpId, mean);
  }
  return means;
}

/** A difference in marks for a Δ line, or null when either side is missing. */
export function delta(current: number | null, previous: number | null): number | null {
  return current === null || previous === null ? null : Math.round((current - previous) * 10) / 10;
}

/** Mean of each child's own mean: every child weighs the same, whatever their number of subjects. */
export function childWeightedMean(items: Marked[]): number | null {
  const means = [...perStudentMeans(items).values()];
  return means.length ? means.reduce((a, b) => a + b, 0) / means.length : null;
}

/**
 * Change between two rounds on the shared cohort (spec §7): only children with marks in both,
 * each child's own mean first. `cohort` = how many children that is.
 */
export function cohortDelta(now: Map<string, number>, before: Map<string, number>): { delta: number | null; cohort: number } {
  const shared = [...now.keys()].filter((erpId) => before.has(erpId));
  if (!shared.length) return { delta: null, cohort: 0 };
  const mean = (m: Map<string, number>) => shared.reduce((sum, erpId) => sum + m.get(erpId)!, 0) / shared.length;
  return { delta: delta(mean(now), mean(before)), cohort: shared.length };
}

/** The requested round of a kind, else the newest that has opened. */
export function pickKindRound<R extends Window>(rounds: R[], kind: string, requested?: string, now = new Date()): R | undefined {
  const own = rounds.filter((r) => r.kind === kind);
  return own.find((r) => r.id === requested) ?? [...own].reverse().find((r) => r.opensAt <= now) ?? own[own.length - 1];
}

/** The same kind's round before this one (the default "compare with"). */
export function previousRound<R extends Window>(rounds: R[], round: R): R | undefined {
  return [...rounds].reverse().find((r) => r.kind === round.kind && r.opensAt < round.opensAt);
}

/**
 * A teacher round with its guardian rounds (picked, else paired by date) and the comparison:
 * `compare: 'none'` = no comparison; otherwise the picked earlier teacher round, else the previous
 * one. A comparison guardian round equal to the current one is dropped (no change to show).
 */
export function resolveRounds<R extends Window>(t1: R, rounds: R[], picked: { g1?: string; g2?: string; compare?: string }) {
  const byId = (id: string | undefined, kind: string) => rounds.find((r) => r.id === id && r.kind === kind);
  const g1 = byId(picked.g1, 'G1') ?? pairedRound(t1, rounds, 'G1');
  const g2 = byId(picked.g2, 'G2') ?? pairedRound(t1, rounds, 'G2');
  const compareT1 = picked.compare === 'none' ? undefined : (rounds.find((r) => r.id === picked.compare && r.kind === 'T1' && r.opensAt < t1.opensAt) ?? previousRound(rounds, t1));
  const other = (round: R | undefined, current: R | undefined) => (round && round.id !== current?.id ? round : undefined);
  return {
    g1,
    g2,
    compareT1,
    cg1: other(compareT1 && pairedRound(compareT1, rounds, 'G1'), g1),
    cg2: other(compareT1 && pairedRound(compareT1, rounds, 'G2'), g2),
  };
}

/** A mark (৪–১০) as the 0–100 score used only where guardian and teacher are compared (spec §7). */
export function score100(mark: number): number {
  return ((mark - 4) / 6) * 100;
}

/** Spec §7 flag: the guardian's and the teachers' averages for a child at least FLAGS.guardianTeacherGap apart. */
export function gapFlag(guardian: number | null, teacher: number | null, bn: (n: number | string) => string): Flag | null {
  if (guardian === null || teacher === null) return null;
  const gap = Math.abs(guardian - teacher);
  return gap >= FLAGS.guardianTeacherGap ? { kind: 'gap', label: `অভিভাবক–শিক্ষক পার্থক্য ${bn(gap.toFixed(1))}` } : null;
}

/**
 * Each teacher round up to `t1` (oldest first) with its guardian rounds, for trends. `t1` keeps the
 * given g1/g2 (they may be picked); a guardian round already shown with a later teacher round is
 * not repeated.
 */
export function roundHistory<R extends Window>(t1: R, rounds: R[], current: { g1?: R; g2?: R }) {
  const history = rounds.filter((r) => r.kind === 'T1' && r.opensAt <= t1.opensAt);
  const used = new Set<string>();
  const take = (round: R | undefined) => (round && !used.has(round.id) ? (used.add(round.id), round) : undefined);
  return [...history]
    .reverse()
    .map((r) => ({ t1: r, g1: take(r.id === t1.id ? current.g1 : pairedRound(r, rounds, 'G1')), g2: take(r.id === t1.id ? current.g2 : pairedRound(r, rounds, 'G2')) }))
    .reverse();
}

/** Mean of the marks that exist (a class average shown beside a child: guardian and teachers together). */
export function averageOf(marks: (number | null)[]): number | null {
  const shown = marks.filter((m): m is number => m !== null);
  return shown.length ? shown.reduce((a, b) => a + b, 0) / shown.length : null;
}

/** Guardian print: a strength is an area the child averages ৮+ in, work is below ৭ (guardian and teachers together). */
export const PRINT_STRENGTH = 8;
export const PRINT_WORK = 7;

export function strengthsAndWork(areas: { name: string; guardian: number | null; teacher: number | null }[]) {
  const both = areas
    .map((a) => ({ name: a.name, mean: averageOf([a.guardian, a.teacher]) }))
    .filter((a): a is { name: string; mean: number } => a.mean !== null);
  return {
    strengths: both.filter((a) => a.mean >= PRINT_STRENGTH).sort((a, b) => b.mean - a.mean).slice(0, 3).map((a) => a.name),
    work: both.filter((a) => a.mean < PRINT_WORK).sort((a, b) => a.mean - b.mean).slice(0, 3).map((a) => a.name),
  };
}
