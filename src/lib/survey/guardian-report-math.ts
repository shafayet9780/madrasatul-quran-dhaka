import { FLAGS, GUARDIAN_AREAS, type Flag } from './report-math';
import type { SnapshotQuestion } from './snapshot';
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
  /** "Not applicable" (mark null). A mark can also be null for an unmarked question, which keeps its option. */
  isNa?: boolean;
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
export function pairedRound<R extends Window>(t1: Window, rounds: R[], kind: 'G1' | 'G2' | 'T1'): R | undefined {
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

/** Each child's mean per area (each area from that child's own marks). */
export function childAreaMeans(rows: Marked[] & { areaKey: string }[]): Map<string, Map<string, number>> {
  const marks = new Map<string, Map<string, number[]>>();
  for (const r of rows) {
    if (r.mark === null) continue;
    const areas = marks.get(r.studentErpId) ?? new Map<string, number[]>();
    areas.set(r.areaKey, [...(areas.get(r.areaKey) ?? []), r.mark]);
    marks.set(r.studentErpId, areas);
  }
  return new Map([...marks].map(([erpId, areas]) => [erpId, new Map([...areas].map(([area, list]) => [area, list.reduce((a, b) => a + b, 0) / list.length]))]));
}

/**
 * Guardian against teachers for one child on the areas both rated (guardian-only areas, such as
 * home habits, and the teachers' guardian questions are left out), each side the mean of its area
 * means. `gap` = guardian − teachers in marks; null when they share no area.
 */
export function sharedAreaGap(guardian: Map<string, number> | undefined, teacher: Map<string, number> | undefined) {
  if (!guardian || !teacher) return null;
  const shared = [...guardian.keys()].filter((area) => teacher.has(area) && !GUARDIAN_AREAS.has(area));
  if (!shared.length) return null;
  const mean = (side: Map<string, number>) => shared.reduce((sum, area) => sum + side.get(area)!, 0) / shared.length;
  return { guardian: mean(guardian), teacher: mean(teacher), gap: mean(guardian) - mean(teacher), areas: shared.length };
}

/** Spec §7 flag: guardian and teachers at least FLAGS.guardianTeacherGap marks apart on the areas both rated. */
export function gapFlag(shared: { gap: number } | null, bn: (n: number | string) => string): Flag | null {
  const gap = shared ? Math.round(Math.abs(shared.gap) * 10) / 10 : 0;
  if (!shared || gap < FLAGS.guardianTeacherGap) return null;
  return { kind: 'gap', label: `অভিভাবক ও শিক্ষকের মতে ${bn(gap.toFixed(1))} মার্ক পার্থক্য` };
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

/**
 * Guardian print: a strength is an area where every side that marked it gave ৮+; work is an area
 * where either side is below ৭ (so a wide guardian–teacher gap is discussed, never praised).
 */
export const PRINT_STRENGTH = 8;
export const PRINT_WORK = 7;

export function strengthsAndWork(areas: { key: string; name: string; guardian: number | null; teacher: number | null }[]) {
  // The teachers' guardian questions are about the parent, not the child.
  const marked = areas
    .filter((a) => !GUARDIAN_AREAS.has(a.key))
    .map((a) => {
      const sides = [a.guardian, a.teacher].filter((m): m is number => m !== null);
      return { name: a.name, low: Math.min(...sides), high: Math.max(...sides), sides: sides.length };
    })
    .filter((a) => a.sides > 0);
  return {
    strengths: marked.filter((a) => a.low >= PRINT_STRENGTH).sort((a, b) => b.low - a.low).slice(0, 3).map((a) => a.name),
    work: marked.filter((a) => a.low < PRINT_WORK).sort((a, b) => a.low - b.low).slice(0, 3).map((a) => a.name),
  };
}

/** Spec §7 "G2 also shows raw option counts": per question, how many children got each option (and N/A). */
export function optionCounts(items: GuardianItem[], questions: SnapshotQuestion[]) {
  return questions.flatMap((q) => {
    const here = items.filter((i) => i.questionKey === q.key);
    const rows = q.options.map((o) => ({ question: q.text, answer: o.label, mark: q.unscored ? null : (o.mark as number | null), count: here.filter((i) => i.optionKey === o.key).length }));
    return q.allowNA ? [...rows, { question: q.text, answer: q.naLabel ?? 'প্রযোজ্য নয়', mark: null, count: here.filter((i) => i.isNa).length }] : rows;
  });
}
