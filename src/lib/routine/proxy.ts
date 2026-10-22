import { dateText, overlaps } from './days';
import { atSchool, busyTeachers, periodsOnDay, sittingOf } from './free';
import type { Assignment, Group, Role, Teacher, TimeSpan } from './types';

// The daily proxy register (docs/class-routine.md §6): the lessons absent teachers leave on a date,
// and who can cover each one, best first.

/** Away the whole day (times null) or at these times. */
export type Absence = { teacherId: string; times: TimeSpan[] | null };
/** A saved cover; its time is the lesson's (empty on old history). */
export type ProxyRecord = { id: string; assignmentId: string | null; role: Role; startsAt: number | null; endsAt: number | null; proxyTeacherId: string };

export const absentIn = (absence: Absence, span: TimeSpan) => absence.times === null || absence.times.some((t) => overlaps(t, span));

/** The proxy's time, when it has one. */
export const proxySpan = (p: ProxyRecord): TimeSpan | null => (p.startsAt === null || p.endsAt === null ? null : { startsAt: p.startsAt, endsAt: p.endsAt });

/** The proxy is at a time overlapping this one (old history without a time never is). */
export const proxyAt = (p: ProxyRecord, span: TimeSpan) => {
  const own = proxySpan(p);
  return !!own && overlaps(own, span);
};

export type Need = { assignment: Assignment; role: Role; absentId: string };

/** Every lesson on this day whose main teacher or TA is away at its time. */
export function needsFor(day: number, absences: Absence[], assignments: Assignment[]): Need[] {
  const needs: Need[] = [];
  for (const a of assignments) {
    if (!a.days.includes(day)) continue;
    for (const [role, id] of [['main', a.teacherId], ['ta', a.taId]] as const) {
      if (id && absences.some((x) => x.teacherId === id && absentIn(x, a))) needs.push({ assignment: a, role, absentId: id });
    }
  }
  return needs;
}

export type Candidate<T> = { teacher: T; canTeach: boolean; atSchool: boolean; today: number; month: number };

/** The day's lesson times, for working out sittings. */
export const daySpans = (assignments: Assignment[], day: number): TimeSpan[] => assignments.filter((a) => a.days.includes(day));

/**
 * Who can cover a need: active, not a vacancy, not away, free then (no lesson, no other proxy at an
 * overlapping time) and allowed by the group's gender rule. Those who teach the subject first; then
 * those at school then (a lesson in the same sitting that day); then fewest lessons that day
 * (proxies included), then fewest proxies this month.
 */
export function rankCandidates<T extends Teacher>(
  need: Need,
  ctx: { teachers: T[]; assignments: Assignment[]; day: number; absences: Absence[]; proxies: ProxyRecord[]; monthCounts: Map<string, number>; group: Group | undefined },
): Candidate<T>[] {
  const { assignment: a } = need;
  const busy = busyTeachers(ctx.assignments, ctx.day, a);
  // The need's own proxy does not count against anyone: it is the one being chosen.
  const own = ctx.proxies.find((p) => p.assignmentId === a.id && p.role === need.role);
  const others = ctx.proxies.filter((p) => p !== own);
  for (const p of others) if (proxyAt(p, a)) busy.add(p.proxyTeacherId);
  const rule = ctx.group?.genderRule ?? 'any';
  const sitting = sittingOf(daySpans(ctx.assignments, ctx.day), a);
  return ctx.teachers
    .filter((t) => t.active && !t.isVacancy && !busy.has(t.id))
    .filter((t) => !ctx.absences.some((x) => x.teacherId === t.id && absentIn(x, a)))
    .filter((t) => rule === 'any' || t.gender === rule)
    .map((teacher) => ({
      teacher,
      canTeach: teacher.subjectIds.includes(a.subjectId),
      atSchool: atSchool(ctx.assignments, sitting, teacher.id, ctx.day),
      today: periodsOnDay(ctx.assignments, teacher.id, ctx.day) + others.filter((p) => p.proxyTeacherId === teacher.id).length,
      month: (ctx.monthCounts.get(teacher.id) ?? 0) - (own?.proxyTeacherId === teacher.id ? 1 : 0),
    }))
    .sort((x, y) => Number(y.canTeach) - Number(x.canTeach) || Number(y.atSchool) - Number(x.atSchool) || x.today - y.today || x.month - y.month || x.teacher.shortName.localeCompare(y.teacher.shortName));
}

export type ProxyLine = { time: string; group: string; subject: string; absent: string; proxy: string | null; role: Role };

/** The day's register as text for WhatsApp. */
export function proxyDayText(date: string, lines: ProxyLine[]): string {
  const body = lines.map((l) => `${l.time} · ${l.group} (${l.subject}${l.role === 'ta' ? ', টিএ' : ''}): ${l.absent} → ${l.proxy ?? 'এখনো কেউ নেই'}`);
  return [`প্রক্সি — ${dateText(date)}`, '', ...body].join('\n');
}
