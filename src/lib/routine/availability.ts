import { daysText } from './days';
import { atSchool, busyTeachers, sessionOf } from './free';
import { absentIn, rankCandidates, type Absence, type Need, type ProxyRecord } from './proxy';
import type { Assignment, Group, Period, Teacher } from './types';

// Who can take a class, for the teacher picker (docs/class-routine.md §5–6): every teacher is a
// choice, free (green, those who teach the subject first) or not (red, with the reason). The proxy
// screen and the class editor use the same picker; the proxy's free list is rankCandidates, so the
// screen and the server agree.

export type Choice<T> = {
  teacher: T;
  free: boolean;
  canTeach: boolean;
  /** Why not, for a red choice ("Two (F)-এ ক্লাস"); empty when free. */
  why: string;
  /** A short note under the name ("আজ ৩টা ক্লাস"). */
  meta: string;
};

const RULE_TEXT = { male: 'এই গ্রুপে শুধু পুরুষ টিচার', female: 'এই গ্রুপে শুধু মহিলা টিচার' } as const;
const count = (n: number) => n.toLocaleString('bn-BD');

/** The proxy choices for one class on a date: everyone but the absent teacher, free ones ranked. */
export function proxyChoices<T extends Teacher>(
  need: Need,
  ctx: { teachers: T[]; assignments: Assignment[]; periods: Period[]; day: number; absences: Absence[]; proxies: ProxyRecord[]; monthCounts: Map<string, number>; groups: Map<string, Group>; today?: boolean },
): Choice<T>[] {
  const when = ctx.today === false ? 'এ দিন' : 'আজ';
  const group = ctx.groups.get(need.assignment.groupId);
  const ranked = rankCandidates(need, { ...ctx, group });
  const green = ranked.map((c) => ({
    teacher: c.teacher,
    free: true,
    canTeach: c.canTeach,
    why: '',
    meta: [`${when} ${count(c.today)}টা ক্লাস`, c.month ? `এ মাসে ${count(c.month)}টা প্রক্সি` : '', c.atSchool ? '' : 'এ সময় স্কুলে থাকেন না'].filter(Boolean).join(' · '),
  }));
  const periodId = need.assignment.periodId;
  const own = ctx.proxies.find((p) => p.assignmentId === need.assignment.id && p.role === need.role);
  const classIn = new Map<string, Assignment>();
  for (const a of ctx.assignments) {
    if (a.periodId !== periodId || !a.days.includes(ctx.day)) continue;
    classIn.set(a.teacherId, a);
    if (a.taId) classIn.set(a.taId, a);
  }
  const free = new Set(ranked.map((c) => c.teacher.id));
  const red = ctx.teachers
    .filter((t) => t.active && !t.isVacancy && t.id !== need.absentId && !free.has(t.id))
    .map((t) => {
      const name = (a: { groupId: string } | undefined) => ctx.groups.get(a?.groupId ?? '')?.name ?? '';
      const proxy = ctx.proxies.find((p) => p !== own && p.periodId === periodId && p.proxyTeacherId === t.id);
      const proxyFor = proxy && ctx.assignments.find((a) => a.id === proxy.assignmentId);
      const why = ctx.absences.some((x) => x.teacherId === t.id && absentIn(x, periodId))
        ? 'অ্যাবসেন্ট'
        : classIn.has(t.id)
          ? `${name(classIn.get(t.id))}-এ ক্লাস`
          : proxy
            ? `${name(proxyFor)}-এ প্রক্সি`
            : group && group.genderRule !== 'any'
              ? RULE_TEXT[group.genderRule]
              : 'ফ্রি নেই';
      return { teacher: t, free: false, canTeach: t.subjectIds.includes(need.assignment.subjectId), why, meta: '' };
    })
    .sort((a, b) => a.teacher.shortName.localeCompare(b.teacher.shortName));
  return [...green, ...red];
}

/**
 * The choices for the class editor: a teacher is free when they have nothing else in this period on
 * any of the chosen days. Open posts can be chosen; a group's gender rule only warns (the server asks
 * to confirm), so it doesn't make anyone red, only says so. Free ones with the lightest week first.
 */
export function editorChoices<T extends Teacher>(ctx: {
  teachers: T[];
  assignments: Assignment[];
  groups: Map<string, Group>;
  groupId: string;
  periodId: string;
  days: number[];
  subjectId: string;
  /** The row being edited: its own class doesn't count against anyone. */
  exceptId?: string;
  /** Kept in the list though inactive (the row's current teachers). */
  keep?: string[];
}): Choice<T>[] {
  const others = ctx.assignments.filter((a) => a.id !== ctx.exceptId);
  const rule = ctx.groups.get(ctx.groupId)?.genderRule ?? 'any';
  const week = new Map<string, number>();
  for (const a of others) for (const id of [a.teacherId, a.taId]) if (id) week.set(id, (week.get(id) ?? 0) + a.days.length);
  const choices = ctx.teachers
    .filter((t) => t.active || ctx.keep?.includes(t.id))
    .map((t) => {
      const clash = others.filter((a) => a.periodId === ctx.periodId && (a.teacherId === t.id || a.taId === t.id) && a.days.some((d) => ctx.days.includes(d)));
      const busyDays = [...new Set(clash.flatMap((a) => a.days.filter((d) => ctx.days.includes(d))))];
      const where = [...new Set(clash.map((a) => ctx.groups.get(a.groupId)?.name ?? ''))].join(', ');
      const free = clash.length === 0;
      return {
        teacher: t,
        free,
        canTeach: t.subjectIds.includes(ctx.subjectId),
        why: free ? '' : `${where}-এ ক্লাস${busyDays.length < ctx.days.length ? ` (${daysText(busyDays)})` : ''}`,
        meta: [rule !== 'any' && t.gender && t.gender !== rule ? RULE_TEXT[rule] : '', t.isVacancy ? 'খালি পোস্ট' : '', `সপ্তাহে ${count(week.get(t.id) ?? 0)}টা ক্লাস`].filter(Boolean).join(' · '),
      };
    });
  return choices.sort((a, b) => Number(b.free) - Number(a.free) || (a.free ? (week.get(a.teacher.id) ?? 0) - (week.get(b.teacher.id) ?? 0) : 0) || a.teacher.shortName.localeCompare(b.teacher.shortName));
}

/** Free teachers in one period of a date, split into those at school then and the rest. */
export function freeOnDate<T extends Teacher>(ctx: { teachers: T[]; assignments: Assignment[]; periods: Period[]; day: number; periodId: string; absences: Absence[]; proxies: ProxyRecord[] }): { here: T[]; away: T[] } {
  const busy = busyTeachers(ctx.assignments, ctx.day, ctx.periodId);
  for (const p of ctx.proxies) if (p.periodId === ctx.periodId) busy.add(p.proxyTeacherId);
  const session = sessionOf(ctx.periods, ctx.periodId);
  const free = ctx.teachers
    .filter((t) => t.active && !t.isVacancy && !busy.has(t.id) && !ctx.absences.some((x) => x.teacherId === t.id && absentIn(x, ctx.periodId)))
    .sort((a, b) => a.shortName.localeCompare(b.shortName));
  const here = free.filter((t) => atSchool(ctx.assignments, session, t.id, ctx.day) || ctx.proxies.some((p) => p.proxyTeacherId === t.id && session.has(p.periodId ?? '')));
  return { here, away: free.filter((t) => !here.includes(t)) };
}
