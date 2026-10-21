import { overlaps } from './days';
import type { Assignment, TimeSpan } from './types';

// Who is busy at a time on a day: teachers with a lesson then, as main teacher or TA.

/** Teachers who teach or assist at a time overlapping this one on this day. */
export function busyTeachers(assignments: Assignment[], day: number, span: TimeSpan): Set<string> {
  const busy = new Set<string>();
  for (const a of assignments) {
    if (!a.days.includes(day) || !overlaps(a, span)) continue;
    busy.add(a.teacherId);
    if (a.taId) busy.add(a.taId);
  }
  return busy;
}

/** Lessons at most this many minutes apart are one sitting: the morning school day; the evening Hifz is another. */
export const SESSION_GAP = 30;

/** The sitting this time is in: the run of the day's lesson times around it with gaps of at most SESSION_GAP. */
export function sittingOf(spans: TimeSpan[], span: TimeSpan): TimeSpan {
  const sorted = [...spans, span].sort((a, b) => a.startsAt - b.startsAt);
  const runs: TimeSpan[] = [];
  for (const s of sorted) {
    const run = runs[runs.length - 1];
    if (run && s.startsAt - run.endsAt <= SESSION_GAP) run.endsAt = Math.max(run.endsAt, s.endsAt);
    else runs.push({ ...s });
  }
  return runs.find((r) => overlaps(r, span) || (r.startsAt <= span.startsAt && span.endsAt <= r.endsAt)) ?? span;
}

/** At school then: the teacher has a lesson (main or TA) that day in the same sitting. */
export function atSchool(assignments: Assignment[], sitting: TimeSpan, teacherId: string, day: number): boolean {
  return assignments.some((a) => a.days.includes(day) && overlaps(a, sitting) && (a.teacherId === teacherId || a.taId === teacherId));
}

/** Lessons a teacher has on a day (main or TA). */
export function periodsOnDay(assignments: Assignment[], teacherId: string, day: number): number {
  return assignments.filter((a) => a.days.includes(day) && (a.teacherId === teacherId || a.taId === teacherId)).length;
}
