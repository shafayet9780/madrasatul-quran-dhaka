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
  /** Guardian (G2) and teacher (T1) averages at least this many points apart on the 0–100 score (33 ≈ 2 marks). */
  guardianTeacherGapPoints: 33,
};

export type StudentAggregate = {
  erpId: string;
  mean: number | null;
  /** Marks counted. */
  n: number;
  teachers: number;
  /** Teachers who gave the lowest mark at least once. */
  lowTeachers: number;
};

export function studentAggregates(rows: MarkRow[], lowestMark: number): Map<string, StudentAggregate> {
  const byStudent = new Map<string, MarkRow[]>();
  for (const row of rows) byStudent.set(row.studentErpId, [...(byStudent.get(row.studentErpId) ?? []), row]);
  const out = new Map<string, StudentAggregate>();
  for (const [erpId, list] of byStudent) {
    const { mean, n } = summarise(list.map((r) => r.mark));
    out.set(erpId, {
      erpId,
      mean,
      n,
      teachers: new Set(list.map((r) => r.teacherKey)).size,
      lowTeachers: new Set(list.filter((r) => r.mark === lowestMark).map((r) => r.teacherKey)).size,
    });
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

export function studentFlags(current: StudentAggregate | undefined, previousMean: number | null, bn: (n: number | string) => string, lowestMark = 4): Flag[] {
  const flags: Flag[] = [];
  if (current?.mean != null && previousMean != null && previousMean - current.mean >= FLAGS.dropMarks) {
    flags.push({ kind: 'drop', label: `আগের রাউন্ড থেকে ${bn((previousMean - current.mean).toFixed(1))} কমেছে` });
  }
  if (current && current.lowTeachers >= FLAGS.lowMarkTeachers) {
    flags.push({ kind: 'low-teachers', label: `${bn(current.lowTeachers)} জন শিক্ষক ${bn(lowestMark)} দিয়েছেন` });
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
