import { daysText, distinctTimes, overlaps } from './days';
import { atSchool, periodsOnDay, sittingOf } from './free';
import { absentIn, daySpans, proxyAt, rankCandidates, type Absence, type Need, type ProxyRecord } from './proxy';
import type { Assignment, Group, Role, Teacher, TimeSpan } from './types';

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
  ctx: { teachers: T[]; assignments: Assignment[]; day: number; absences: Absence[]; proxies: ProxyRecord[]; monthCounts: Map<string, number>; groups: Map<string, Group>; today?: boolean },
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
  const span = need.assignment;
  const own = ctx.proxies.find((p) => p.assignmentId === need.assignment.id && p.role === need.role);
  const classIn = new Map<string, Assignment>();
  for (const a of ctx.assignments) {
    if (!overlaps(a, span) || !a.days.includes(ctx.day)) continue;
    classIn.set(a.teacherId, a);
    if (a.taId) classIn.set(a.taId, a);
  }
  const free = new Set(ranked.map((c) => c.teacher.id));
  const red = ctx.teachers
    .filter((t) => t.active && !t.isVacancy && t.id !== need.absentId && !free.has(t.id))
    .map((t) => {
      const name = (a: { groupId: string } | undefined) => ctx.groups.get(a?.groupId ?? '')?.name ?? '';
      const proxy = ctx.proxies.find((p) => p !== own && p.proxyTeacherId === t.id && proxyAt(p, span));
      const proxyFor = proxy && ctx.assignments.find((a) => a.id === proxy.assignmentId);
      const why = ctx.absences.some((x) => x.teacherId === t.id && absentIn(x, span))
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
 * The choices for the class editor: a teacher is free when they have nothing else at an overlapping
 * time on any of the chosen days. Open posts can be chosen; a group's gender rule only warns (the server asks
 * to confirm), so it doesn't make anyone red, only says so. Free ones with the lightest week first.
 */
export function editorChoices<T extends Teacher>(ctx: {
  teachers: T[];
  assignments: Assignment[];
  groups: Map<string, Group>;
  groupId: string;
  span: TimeSpan;
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
      const clash = others.filter((a) => overlaps(a, ctx.span) && (a.teacherId === t.id || a.taId === t.id) && a.days.some((d) => ctx.days.includes(d)));
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

export type BoardCell =
  | { kind: 'free'; fits: boolean }
  | { kind: 'away' | 'absent' }
  | { kind: 'class' | 'proxy'; assignment: Assignment | undefined; role: Role };

export type BoardTime = { time: TimeSpan; cells: Map<string, BoardCell>; free: number };

/**
 * Every teacher's state at every lesson time of a date, for the free-teacher page: absent, in a
 * lesson (main or TA), on a proxy, free, or away (free, but not at school in that sitting). A free
 * teacher fits when they teach the chosen subject, else a subject taught at that time that day.
 */
export function dayBoard<T extends Teacher>(ctx: { teachers: T[]; assignments: Assignment[]; day: number; absences: Absence[]; proxies: ProxyRecord[]; subjectId?: string }) {
  const teachers = ctx.teachers.filter((t) => t.active && !t.isVacancy);
  const classes = new Map(teachers.map((t) => [t.id, periodsOnDay(ctx.assignments, t.id, ctx.day) + ctx.proxies.filter((p) => p.proxyTeacherId === t.id).length]));
  const spans = daySpans(ctx.assignments, ctx.day);
  const times: BoardTime[] = distinctTimes(spans).map((time) => {
    const running = ctx.assignments.filter((a) => overlaps(a, time) && a.days.includes(ctx.day));
    const subjects = new Set(running.filter((a) => a.startsAt === time.startsAt && a.endsAt === time.endsAt).map((a) => a.subjectId));
    const sitting = sittingOf(spans, time);
    const cells = new Map<string, BoardCell>();
    for (const t of teachers) {
      const own = running.find((a) => a.teacherId === t.id || a.taId === t.id);
      const proxy = ctx.proxies.find((p) => p.proxyTeacherId === t.id && proxyAt(p, time));
      const here = atSchool(ctx.assignments, sitting, t.id, ctx.day) || ctx.proxies.some((p) => p.proxyTeacherId === t.id && proxyAt(p, sitting));
      cells.set(
        t.id,
        ctx.absences.some((x) => x.teacherId === t.id && absentIn(x, time))
          ? { kind: 'absent' }
          : own
            ? { kind: 'class', assignment: own, role: own.teacherId === t.id ? 'main' : 'ta' }
            : proxy
              ? { kind: 'proxy', assignment: ctx.assignments.find((a) => a.id === proxy.assignmentId), role: proxy.role }
              : !here
                ? { kind: 'away' }
                : { kind: 'free', fits: ctx.subjectId ? t.subjectIds.includes(ctx.subjectId) : t.subjectIds.some((s) => subjects.has(s)) },
      );
    }
    return { time, cells, free: [...cells.values()].filter((c) => c.kind === 'free').length };
  });
  return { teachers, times, classes };
}
