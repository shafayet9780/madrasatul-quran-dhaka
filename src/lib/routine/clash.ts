import { daysText, overlaps, spanText } from './days';
import type { Assignment, ClassType, Group, Subject, Teacher } from './types';

// Clash rules (docs/class-routine.md §3): at overlapping times on one day a class or group has one
// lesson, a teacher is in one place (as main teacher or TA), and a room (a row of the routine table:
// a class's room, or an own-room group's) holds one lesson. The same rules fill routine_slots, whose
// exclusion constraint enforces them in the database.

export type SlotKind = 'group' | 'teacher' | 'room';
export type Occupancy = { kind: SlotKind; refId: string; day: number };
export type Draft = Omit<Assignment, 'id'> & { id?: string };

export type Lookup = { types: Map<string, ClassType>; groups: Map<string, Group>; teachers: Map<string, Teacher>; subjects: Map<string, Subject> };

export function lookup(data: { types: ClassType[]; groups: Group[]; teachers: Teacher[]; subjects: Subject[] }): Lookup {
  return {
    types: new Map(data.types.map((t) => [t.id, t])),
    groups: new Map(data.groups.map((g) => [g.id, g])),
    teachers: new Map(data.teachers.map((t) => [t.id, t])),
    subjects: new Map(data.subjects.map((s) => [s.id, s])),
  };
}

/** The row (room) a lesson takes: its host class's for a seated group, else its own. */
export const rowOf = (a: Pick<Assignment, 'groupId' | 'hostGroupId'>) => a.hostGroupId ?? a.groupId;

/** What a lesson takes up, one entry per day. */
export function occupancy(a: Draft): Occupancy[] {
  return [...new Set(a.days)].flatMap((day) => [
    { kind: 'group' as const, refId: a.groupId, day },
    { kind: 'room' as const, refId: rowOf(a), day },
    { kind: 'teacher' as const, refId: a.teacherId, day },
    ...(a.taId ? [{ kind: 'teacher' as const, refId: a.taId, day }] : []),
  ]);
}

export type Clash = { kind: SlotKind; refId: string; days: number[]; other: Assignment };

/** Every clash between a new or edited lesson and the rest of its routine. */
export function findClashes(candidate: Draft, existing: Assignment[]): Clash[] {
  const mine = occupancy(candidate);
  const clashes: Clash[] = [];
  for (const other of existing) {
    if (other.id === candidate.id || !overlaps(other, candidate)) continue;
    const theirs = new Set(occupancy(other).map((o) => `${o.kind}:${o.refId}:${o.day}`));
    const found = new Map<string, Clash>();
    for (const o of mine) {
      if (!theirs.has(`${o.kind}:${o.refId}:${o.day}`)) continue;
      const key = `${o.kind}:${o.refId}`;
      const clash = found.get(key) ?? { kind: o.kind, refId: o.refId, days: [], other };
      clash.days.push(o.day);
      found.set(key, clash);
    }
    // A class's own lesson takes its group and its room, which are the same thing: say it once.
    if (found.has(`group:${candidate.groupId}`)) found.delete(`room:${candidate.groupId}`);
    clashes.push(...found.values());
  }
  return clashes;
}

/** "Lubna শনি–সোম ৯:০০–৯:৪৫-এ Qaida-A-তে আছেন।" */
export function clashText(c: Clash, names: Lookup): string {
  const days = daysText(c.days);
  const when = spanText(c.other);
  const other = names.groups.get(c.other.groupId)?.name ?? '';
  const subject = names.subjects.get(c.other.subjectId)?.name ?? '';
  if (c.kind === 'group') return `${names.groups.get(c.refId)?.name ?? ''}-এর ${days} ${when}-এ আগে থেকেই ${subject} আছে।`;
  if (c.kind === 'teacher') return `${names.teachers.get(c.refId)?.shortName ?? ''} ${days} ${when}-এ ${other}-এ আছেন।`;
  return `${names.groups.get(c.refId)?.name ?? ''}-এর রুমে ${days} ${when}-এ ${c.other.groupId === c.refId ? subject : other} চলে।`;
}

/** Things allowed after confirming: a subject the teacher isn't listed for, or a broken gender rule. */
export function assignmentWarnings(a: Draft, names: Lookup): string[] {
  const warnings: string[] = [];
  const group = names.groups.get(a.groupId);
  const subject = names.subjects.get(a.subjectId);
  const main = names.teachers.get(a.teacherId);
  if (main && subject && !main.subjectIds.includes(subject.id)) warnings.push(`${main.shortName}-এর সাবজেক্টের লিস্টে ${subject.name} নেই।`);
  for (const t of [main, a.taId ? names.teachers.get(a.taId) : undefined]) {
    if (t?.gender && group && group.genderRule !== 'any' && group.genderRule !== t.gender) {
      warnings.push(`${group.name}-এ শুধু ${group.genderRule === 'male' ? 'পুরুষ' : 'মহিলা'} টিচার পড়ান, কিন্তু ${t.shortName} ${t.gender === 'male' ? 'পুরুষ' : 'মহিলা'}।`);
    }
  }
  return warnings;
}

/**
 * Where a lesson may sit, or why not: a seated group (Quran, Arabic) needs a host class; a class or
 * own-room group sits in its own row, with no host.
 */
export function hostProblem(a: Pick<Draft, 'groupId' | 'hostGroupId'>, names: Lookup): string | null {
  const group = names.groups.get(a.groupId);
  const placement = group && names.types.get(group.typeId)?.placement;
  if (placement !== 'seated') return a.hostGroupId ? 'এই ক্লাস বা গ্রুপ নিজের রুমে বসে।' : null;
  const host = a.hostGroupId ? names.groups.get(a.hostGroupId) : undefined;
  if (!host) return 'কোন ক্লাসের রুমে বসে, সেটা সিলেক্ট করুন।';
  return names.types.get(host.typeId)?.placement === 'class' ? null : 'গ্রুপ শুধু কোনো ক্লাসের রুমে বসতে পারে।';
}
