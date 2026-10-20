import type { Assignment, Period, Teacher } from './types';

// Who is free in a period on a day: active teachers (not vacancies) with no class there, as main
// teacher or TA.

/** Teachers who teach or assist in this period on this day. */
export function busyTeachers(assignments: Assignment[], day: number, periodId: string): Set<string> {
  const busy = new Set<string>();
  for (const a of assignments) {
    if (a.periodId !== periodId || !a.days.includes(day)) continue;
    busy.add(a.teacherId);
    if (a.taId) busy.add(a.taId);
  }
  return busy;
}

/** Active, non-vacancy teachers with nothing in this period on this day, by short name. */
export function freeTeachers<T extends Pick<Teacher, 'id' | 'shortName' | 'active' | 'isVacancy'>>(teachers: T[], assignments: Assignment[], day: number, periodId: string): T[] {
  const busy = busyTeachers(assignments, day, periodId);
  return teachers.filter((t) => t.active && !t.isVacancy && !busy.has(t.id)).sort((a, b) => a.shortName.localeCompare(b.shortName));
}

/** Periods at most this many minutes apart are one sitting: the morning school day; the evening Hifz is another. */
export const SESSION_GAP = 30;

/** The ids of the periods in the same sitting as this one. */
export function sessionOf(periods: Pick<Period, 'id' | 'startsAt' | 'endsAt'>[], periodId: string): Set<string> {
  const runs: (typeof periods)[] = [];
  for (const p of [...periods].sort((a, b) => a.startsAt - b.startsAt)) {
    const run = runs[runs.length - 1];
    const last = run?.[run.length - 1];
    if (last && p.startsAt - last.endsAt <= SESSION_GAP) run.push(p);
    else runs.push([p]);
  }
  return new Set(runs.find((r) => r.some((p) => p.id === periodId))?.map((p) => p.id) ?? []);
}

/** At school then: the teacher has a class (main or TA) that day in the same sitting. */
export function atSchool(assignments: Assignment[], session: Set<string>, teacherId: string, day: number): boolean {
  return assignments.some((a) => session.has(a.periodId) && a.days.includes(day) && (a.teacherId === teacherId || a.taId === teacherId));
}

/** Periods a teacher has on a day (main or TA). */
export function periodsOnDay(assignments: Assignment[], teacherId: string, day: number): number {
  return assignments.filter((a) => a.days.includes(day) && (a.teacherId === teacherId || a.taId === teacherId)).length;
}
