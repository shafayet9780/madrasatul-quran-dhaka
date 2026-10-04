import { MARK_TOP } from './scoring';

/** Aggregates with fewer responses than this are greyed out. */
export const MIN_N = 3;

export type Summary = {
  n: number;
  mean: number | null;
  /** Share of marks at the top mark (১০), 0–1. */
  topShare: number | null;
  /** Count per mark. */
  distribution: Map<number, number>;
};

/** n, mean, top-mark share and distribution; null entries (N/A) are excluded entirely. */
export function summarise(marks: ReadonlyArray<number | null>): Summary {
  const valid = marks.filter((m): m is number => m !== null);
  const distribution = new Map<number, number>();
  for (const m of valid) distribution.set(m, (distribution.get(m) ?? 0) + 1);
  if (valid.length === 0) return { n: 0, mean: null, topShare: null, distribution };
  return {
    n: valid.length,
    mean: valid.reduce((sum, m) => sum + m, 0) / valid.length,
    topShare: (distribution.get(MARK_TOP) ?? 0) / valid.length,
    distribution,
  };
}

export type StraightLining = { flagged: boolean; students: number; mark: number | null; share: number };

/**
 * Straight-lining in one teacher batch: ≥ 90% of all marks identical across ≥ 10 students.
 * `batch` holds one array of marks per student.
 */
export function straightLining(batch: ReadonlyArray<ReadonlyArray<number>>): StraightLining {
  const { distribution, n } = summarise(batch.flat());
  let mark: number | null = null;
  let top = 0;
  for (const [m, count] of distribution) if (count > top) [mark, top] = [m, count];
  const share = n ? top / n : 0;
  return { flagged: batch.length >= 10 && share >= 0.9, students: batch.length, mark, share };
}

export type RatedMark = { teacherKey: string; studentId: string; mark: number };
export type Leniency = { teacherKey: string; delta: number; pairedStudents: number };

/**
 * Leniency = paired mean difference: for each student a teacher shares with at least one
 * colleague, the teacher's mean mark minus the colleagues' mean mark on that student,
 * averaged over those students. Pass marks from one round only.
 */
export function leniency(marks: ReadonlyArray<RatedMark>): Leniency[] {
  // student → teacher → [sum, count]
  const byStudent = new Map<string, Map<string, [number, number]>>();
  for (const { teacherKey, studentId, mark } of marks) {
    const teachers = byStudent.get(studentId) ?? new Map<string, [number, number]>();
    const acc = teachers.get(teacherKey) ?? [0, 0];
    teachers.set(teacherKey, [acc[0] + mark, acc[1] + 1]);
    byStudent.set(studentId, teachers);
  }

  const diffs = new Map<string, number[]>();
  for (const teachers of byStudent.values()) {
    if (teachers.size < 2) continue;
    let totalSum = 0;
    let totalCount = 0;
    for (const [sum, count] of teachers.values()) {
      totalSum += sum;
      totalCount += count;
    }
    for (const [teacherKey, [sum, count]] of teachers) {
      const others = (totalSum - sum) / (totalCount - count);
      diffs.set(teacherKey, [...(diffs.get(teacherKey) ?? []), sum / count - others]);
    }
  }

  return [...diffs].map(([teacherKey, d]) => ({
    teacherKey,
    delta: d.reduce((a, b) => a + b, 0) / d.length,
    pairedStudents: d.length,
  }));
}
