import { dateText } from './days';
import { atSchool, busyTeachers, periodsOnDay, sessionOf } from './free';
import type { Assignment, Group, Period, Role, Teacher } from './types';

// The daily proxy register (docs/class-routine.md §6): the classes absent teachers leave on a date,
// and who can cover each one, best first.

export type Absence = { teacherId: string; periodIds: string[] | null };
export type ProxyRecord = { id: string; assignmentId: string | null; role: Role; periodId: string | null; proxyTeacherId: string };

/** Away the whole day (no periods chosen) or in this period. */
export const absentIn = (absence: Absence, periodId: string) => absence.periodIds === null || absence.periodIds.includes(periodId);

export type Need = { assignment: Assignment; role: Role; absentId: string };

/** Every class on this day whose main teacher or TA is away in its period. */
export function needsFor(day: number, absences: Absence[], assignments: Assignment[]): Need[] {
  const needs: Need[] = [];
  for (const a of assignments) {
    if (!a.days.includes(day)) continue;
    for (const [role, id] of [['main', a.teacherId], ['ta', a.taId]] as const) {
      if (id && absences.some((x) => x.teacherId === id && absentIn(x, a.periodId))) needs.push({ assignment: a, role, absentId: id });
    }
  }
  return needs;
}

export type Candidate<T> = { teacher: T; canTeach: boolean; atSchool: boolean; today: number; month: number };

/**
 * Who can cover a need: active, not a vacancy, not away, free in that period (no class, no other
 * proxy) and allowed by the group's gender rule. Those who teach the subject first; then those at
 * school then (a class in the same sitting that day); then fewest periods that day (proxies
 * included), then fewest proxies this month.
 */
export function rankCandidates<T extends Teacher>(
  need: Need,
  ctx: { teachers: T[]; assignments: Assignment[]; periods: Period[]; day: number; absences: Absence[]; proxies: ProxyRecord[]; monthCounts: Map<string, number>; group: Group | undefined },
): Candidate<T>[] {
  const { assignment: a } = need;
  const busy = busyTeachers(ctx.assignments, ctx.day, a.periodId);
  // The need's own proxy does not count against anyone: it is the one being chosen.
  const own = ctx.proxies.find((p) => p.assignmentId === a.id && p.role === need.role);
  const others = ctx.proxies.filter((p) => p !== own);
  for (const p of others) if (p.periodId === a.periodId) busy.add(p.proxyTeacherId);
  const rule = ctx.group?.genderRule ?? 'any';
  const session = sessionOf(ctx.periods, a.periodId);
  return ctx.teachers
    .filter((t) => t.active && !t.isVacancy && !busy.has(t.id))
    .filter((t) => !ctx.absences.some((x) => x.teacherId === t.id && absentIn(x, a.periodId)))
    .filter((t) => rule === 'any' || t.gender === rule)
    .map((teacher) => ({
      teacher,
      canTeach: teacher.subjectIds.includes(a.subjectId),
      atSchool: atSchool(ctx.assignments, session, teacher.id, ctx.day),
      today: periodsOnDay(ctx.assignments, teacher.id, ctx.day) + others.filter((p) => p.proxyTeacherId === teacher.id).length,
      month: (ctx.monthCounts.get(teacher.id) ?? 0) - (own?.proxyTeacherId === teacher.id ? 1 : 0),
    }))
    .sort((x, y) => Number(y.canTeach) - Number(x.canTeach) || Number(y.atSchool) - Number(x.atSchool) || x.today - y.today || x.month - y.month || x.teacher.shortName.localeCompare(y.teacher.shortName));
}

export type ProxyLine = { period: string; group: string; subject: string; absent: string; proxy: string | null; role: Role };

/** The day's register as text for WhatsApp. */
export function proxyDayText(date: string, lines: ProxyLine[]): string {
  const body = lines.map((l) => `${l.period} · ${l.group} (${l.subject}${l.role === 'ta' ? ', টিএ' : ''}): ${l.absent} → ${l.proxy ?? 'এখনো কেউ নেই'}`);
  return [`প্রক্সি — ${dateText(date)}`, '', ...body].join('\n');
}
