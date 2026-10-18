import { daysText } from './days';
import type { Assignment, Group, Room, Subject, Teacher } from './types';

// Clash rules (docs/class-routine.md §3): in one period on one day a group has one class, a
// teacher is in one place (as main teacher or TA), and a room holds one group unless it is shared.
// The same rules fill routine_slots, whose primary key enforces them in the database.

export type SlotKind = 'group' | 'teacher' | 'room';
export type Occupancy = { kind: SlotKind; refId: string; day: number };
export type Draft = Omit<Assignment, 'id'> & { id?: string };

export type Lookup = { groups: Map<string, Group>; rooms: Map<string, Room>; teachers: Map<string, Teacher>; subjects: Map<string, Subject> };

export function lookup(data: { groups: Group[]; rooms: Room[]; teachers: Teacher[]; subjects: Subject[] }): Lookup {
  return {
    groups: new Map(data.groups.map((g) => [g.id, g])),
    rooms: new Map(data.rooms.map((r) => [r.id, r])),
    teachers: new Map(data.teachers.map((t) => [t.id, t])),
    subjects: new Map(data.subjects.map((s) => [s.id, s])),
  };
}

/** The assignment's own room, else its group's default room. */
export function effectiveRoomId(a: Pick<Assignment, 'roomId' | 'groupId'>, groups: Map<string, Group>): string | null {
  return a.roomId ?? groups.get(a.groupId)?.defaultRoomId ?? null;
}

/** What an assignment takes up, one entry per day. */
export function occupancy(a: Draft, groups: Map<string, Group>, rooms: Map<string, Room>): Occupancy[] {
  const room = effectiveRoomId(a, groups);
  const roomTaken = room !== null && !rooms.get(room)?.shared;
  return [...new Set(a.days)].flatMap((day) => [
    { kind: 'group' as const, refId: a.groupId, day },
    { kind: 'teacher' as const, refId: a.teacherId, day },
    ...(a.taId ? [{ kind: 'teacher' as const, refId: a.taId, day }] : []),
    ...(roomTaken ? [{ kind: 'room' as const, refId: room, day }] : []),
  ]);
}

export type Clash = { kind: SlotKind; refId: string; days: number[]; other: Assignment };

/** Every clash between a new or edited assignment and the rest of its routine. */
export function findClashes(candidate: Draft, existing: Assignment[], groups: Map<string, Group>, rooms: Map<string, Room>): Clash[] {
  const mine = occupancy(candidate, groups, rooms);
  const clashes: Clash[] = [];
  for (const other of existing) {
    if (other.id === candidate.id || other.periodId !== candidate.periodId) continue;
    const theirs = new Set(occupancy(other, groups, rooms).map((o) => `${o.kind}:${o.refId}:${o.day}`));
    const found = new Map<string, Clash>();
    for (const o of mine) {
      if (!theirs.has(`${o.kind}:${o.refId}:${o.day}`)) continue;
      const key = `${o.kind}:${o.refId}`;
      const clash = found.get(key) ?? { kind: o.kind, refId: o.refId, days: [], other };
      clash.days.push(o.day);
      found.set(key, clash);
    }
    clashes.push(...found.values());
  }
  return clashes;
}

/** "মুঈন শনি–সোম Qaida-C-তে আছেন।" */
export function clashText(c: Clash, names: Lookup): string {
  const days = daysText(c.days);
  const otherGroup = names.groups.get(c.other.groupId)?.name ?? '';
  if (c.kind === 'group') return `${names.groups.get(c.refId)?.name ?? ''}-এর এই পিরিয়ডে ${days} আগে থেকেই ক্লাস আছে।`;
  if (c.kind === 'teacher') return `${names.teachers.get(c.refId)?.shortName ?? ''} ${days} এই পিরিয়ডে ${otherGroup}-তে আছেন।`;
  return `রুম ${names.rooms.get(c.refId)?.name ?? ''} ${days} এই পিরিয়ডে ${otherGroup} ব্যবহার করছে।`;
}

/** Things allowed after confirming: a subject the teacher isn't listed for, or a broken gender rule. */
export function assignmentWarnings(a: Draft, names: Lookup): string[] {
  const warnings: string[] = [];
  const group = names.groups.get(a.groupId);
  const subject = names.subjects.get(a.subjectId);
  const main = names.teachers.get(a.teacherId);
  if (main && subject && !main.subjectIds.includes(subject.id)) warnings.push(`${main.shortName}-এর বিষয়ের তালিকায় ${subject.name} নেই।`);
  for (const t of [main, a.taId ? names.teachers.get(a.taId) : undefined]) {
    if (t && group && group.genderRule !== 'any' && group.genderRule !== t.gender) {
      warnings.push(`${group.name}-এ শুধু ${group.genderRule === 'male' ? 'পুরুষ' : 'মহিলা'} শিক্ষক পড়ান; ${t.shortName} ${t.gender === 'male' ? 'পুরুষ' : 'মহিলা'}।`);
    }
  }
  return warnings;
}

/** Periods in one routine may not overlap; returns the first one this time range runs into. */
export function overlappingPeriod<P extends { id: string; startsAt: number; endsAt: number }>(range: { id?: string; startsAt: number; endsAt: number }, periods: P[]): P | undefined {
  return periods.find((p) => p.id !== range.id && range.startsAt < p.endsAt && p.startsAt < range.endsAt);
}
