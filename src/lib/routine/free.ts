import type { Assignment, Teacher } from './types';

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

/** Periods a teacher has on a day (main or TA). */
export function periodsOnDay(assignments: Assignment[], teacherId: string, day: number): number {
  return assignments.filter((a) => a.days.includes(day) && (a.teacherId === teacherId || a.taId === teacherId)).length;
}
