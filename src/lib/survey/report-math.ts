import { MIN_N, summarise } from './stats';

// Aggregations for the T1 reports (R3 class, R4 student, R5 raters), from answer_items rows.

export type MarkRow = {
  roundId: string;
  submissionId: string;
  teacherKey: string | null;
  studentErpId: string;
  subjectKey: string;
  questionKey: string;
  areaKey: string;
  mark: number | null;
};

/** Flag thresholds (spec §7 "thresholds editable"; constants until an admin setting is needed). */
export const FLAGS = {
  /** Teacher average fell by at least this many marks since the previous round. */
  dropMarks: 1,
  /** At least this many different teachers gave the lowest mark on some question. */
  lowMarkTeachers: 2,
  /** Guardian (G2) and teacher (T1) averages on the areas both rate at least this many marks apart. */
  guardianTeacherGap: 2,
};

/**
 * Areas whose teacher questions are about the guardian, not the child (T1: coordination, contact
 * outside hours). They are shown on their own and left out of the child's average, flags and the
 * guardian–teacher gap (owner, 2026-10-06).
 */
export const GUARDIAN_AREAS: ReadonlySet<string> = new Set(['guardian-cooperation']);

/** Marks about the child only (see GUARDIAN_AREAS). */
export function childRows<T extends { areaKey: string }>(rows: T[]): T[] {
  return rows.filter((r) => !GUARDIAN_AREAS.has(r.areaKey));
}

export type StudentAggregate = {
  erpId: string;
  mean: number | null;
  /** Marks counted. */
  n: number;
  teachers: number;
  /** The question most teachers gave the lowest mark on, and how many did (null when none did). */
  lowQuestion: { questionKey: string; teachers: number } | null;
};

export function studentAggregates(rows: MarkRow[], lowestMark: number): Map<string, StudentAggregate> {
  const byStudent = new Map<string, MarkRow[]>();
  for (const row of rows) byStudent.set(row.studentErpId, [...(byStudent.get(row.studentErpId) ?? []), row]);
  const out = new Map<string, StudentAggregate>();
  for (const [erpId, list] of byStudent) {
    const { mean, n } = summarise(list.map((r) => r.mark));
    const lowByQuestion = new Map<string, Set<string | null>>();
    for (const r of list.filter((r) => r.mark === lowestMark)) lowByQuestion.set(r.questionKey, (lowByQuestion.get(r.questionKey) ?? new Set()).add(r.teacherKey));
    const lowQuestion = [...lowByQuestion].map(([questionKey, teachers]) => ({ questionKey, teachers: teachers.size })).sort((a, b) => b.teachers - a.teachers)[0] ?? null;
    out.set(erpId, { erpId, mean, n, teachers: new Set(list.map((r) => r.teacherKey)).size, lowQuestion });
  }
  return out;
}

/** Area means need only these fields, so guardian answer items work too. */
type AreaRow = Pick<MarkRow, 'studentErpId' | 'areaKey' | 'mark'>;

export type AreaMean = { areaKey: string; mean: number | null; students: number; reliable: boolean };

/**
 * Class mean per area: each student's own area mean first, so a student rated by more teachers
 * does not weigh more. Greyed (`reliable: false`) below MIN_N students.
 */
export function areaMeans(rows: AreaRow[], areaKeys: string[]): AreaMean[] {
  return areaKeys.map((areaKey) => {
    const perStudent = new Map<string, (number | null)[]>();
    for (const row of rows.filter((r) => r.areaKey === areaKey)) perStudent.set(row.studentErpId, [...(perStudent.get(row.studentErpId) ?? []), row.mark]);
    const studentMeans = [...perStudent.values()].map((marks) => summarise(marks).mean);
    const { mean, n } = summarise(studentMeans);
    return { areaKey, mean, students: n, reliable: n >= MIN_N };
  });
}

/** One student's mean per area (for the profile), with the number of marks behind it. */
export function studentAreaMeans(rows: AreaRow[], erpId: string, areaKeys: string[]) {
  return areaKeys.map((areaKey) => {
    const { mean, n } = summarise(rows.filter((r) => r.studentErpId === erpId && r.areaKey === areaKey).map((r) => r.mark));
    return { areaKey, mean, n };
  });
}

export type Flag = { kind: 'drop' | 'low-teachers' | 'gap'; label: string };

/**
 * How far the student's teacher average fell since their latest earlier round with marks, on the
 * subjects rated in both rounds only (so a subject or teacher missing in one round does not count
 * as a drop). Rounds oldest first, the last one current; null without a comparison.
 */
export function dropSince(rows: MarkRow[], roundIds: string[], erpId: string): number | null {
  const own = rows.filter((r) => r.studentErpId === erpId);
  const current = own.filter((r) => r.roundId === roundIds[roundIds.length - 1]);
  const earlierId = [...roundIds.slice(0, -1)].reverse().find((id) => own.some((r) => r.roundId === id && r.mark !== null));
  if (!earlierId || !current.length) return null;
  const earlier = own.filter((r) => r.roundId === earlierId);
  const shared = new Set(current.map((r) => r.subjectKey).filter((s) => earlier.some((r) => r.subjectKey === s)));
  const now = summarise(current.filter((r) => shared.has(r.subjectKey)).map((r) => r.mark)).mean;
  const before = summarise(earlier.filter((r) => shared.has(r.subjectKey)).map((r) => r.mark)).mean;
  return now === null || before === null ? null : before - now;
}

export function studentFlags(
  current: StudentAggregate | undefined,
  drop: number | null,
  bn: (n: number | string) => string,
  lowestMark: number,
  questionName: (questionKey: string) => string
): Flag[] {
  const flags: Flag[] = [];
  if (drop !== null && Math.round(drop * 10) / 10 >= FLAGS.dropMarks) {
    flags.push({ kind: 'drop', label: `আগের রাউন্ড থেকে ${bn(drop.toFixed(1))} কমেছে` });
  }
  if (current?.lowQuestion && current.lowQuestion.teachers >= FLAGS.lowMarkTeachers) {
    flags.push({ kind: 'low-teachers', label: `${bn(current.lowQuestion.teachers)} জন শিক্ষক “${questionName(current.lowQuestion.questionKey)}”-এ ${bn(lowestMark)} দিয়েছেন` });
  }
  return flags;
}

/** Per-round means for one student, oldest first (trend line / sparkline). */
export function roundMeans(rows: MarkRow[], rounds: { id: string; label: string }[], erpId?: string) {
  return rounds
    .map((round) => ({
      roundId: round.id,
      label: round.label,
      ...summarise(rows.filter((r) => r.roundId === round.id && (!erpId || r.studentErpId === erpId)).map((r) => r.mark)),
    }))
    .filter((point) => point.mean !== null);
}

/** "৮.৫" with one decimal, or "—". */
export function formatMark(mean: number | null, bn: (n: number | string) => string): string {
  return mean === null ? '—' : bn(mean.toFixed(1));
}

/** "১২% উত্তর ৭ বা কম": the share of low answers shown beside an average. */
export function formatLow(share: number | null, bn: (n: number | string) => string): string {
  return share === null ? '' : `${bn(Math.round(share * 100))}% উত্তর ৭ বা কম`;
}
