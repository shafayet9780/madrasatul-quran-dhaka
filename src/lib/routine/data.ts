import 'server-only';
import { and, asc, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { assignmentWarnings, clashText, effectiveRoomId, findClashes, lookup, occupancy, overlappingPeriod, type Draft } from './clash';
import { dayOfDate, daysText, periodText } from './days';
import { getRoutineDb, type RoutineDb } from './db';
import { needsFor, rankCandidates, type Absence, type ProxyRecord } from './proxy';
import {
  routineAbsences,
  routineAssignments,
  routineGroups,
  routinePeriods,
  routineProxies,
  routineRooms,
  routineRoutines,
  routineSlots,
  routineSubjects,
  routineTeacherSubjects,
  routineTeachers,
  type ProxySnapshot,
} from './schema';
import type { Group, Role, Room, RoutineData, RoutineInfo, Subject, Teacher } from './types';

// Reads and writes for the class routine admin (docs/class-routine.md). Every multi-statement write
// is one db.batch (one transaction); routine_slots makes a clash fail the whole batch.

export type Outcome = { ok: true; id?: string } | { ok: false; error: string; warnings?: string[] };

const fail = (error: string): Outcome => ({ ok: false, error });
const pgCode = (e: unknown): string | undefined => (e as { code?: string }).code ?? (e as { cause?: { code?: string } }).cause?.code;
const RACE = 'এর মধ্যে রুটিনে অন্য কোনো পরিবর্তন হয়েছে। পেজটি রিলোড করে আবার চেষ্টা করুন।';

function omit<T extends object, K extends keyof T>(o: T, ...keys: K[]): Omit<T, K> {
  const copy = { ...o };
  for (const k of keys) delete copy[k];
  return copy;
}

async function run(db: RoutineDb, statements: BatchItem<'pg'>[]) {
  if (statements.length) await db.batch(statements as [BatchItem<'pg'>, ...BatchItem<'pg'>[]]);
}

// ── Reads ──────────────────────────────────────────────────────────────────────────────────────

export type RoutineSummary = RoutineInfo & { periods: number; assignments: number };

export async function listRoutines(): Promise<RoutineSummary[]> {
  const db = getRoutineDb();
  const count = sql<number>`count(*)::int`;
  const [rows, periods, assignments] = await Promise.all([
    db.select().from(routineRoutines).orderBy(sql`${routineRoutines.createdAt} desc`),
    db.select({ id: routinePeriods.routineId, n: count }).from(routinePeriods).groupBy(routinePeriods.routineId),
    db.select({ id: routineAssignments.routineId, n: count }).from(routineAssignments).groupBy(routineAssignments.routineId),
  ]);
  const n = (list: { id: string; n: number }[], id: string) => list.find((x) => x.id === id)?.n ?? 0;
  return rows.map((r) => ({ id: r.id, name: r.name, status: r.status, createdAt: r.createdAt.toISOString(), periods: n(periods, r.id), assignments: n(assignments, r.id) }));
}

/** The routine asked for, else the active one, else the newest draft. */
export async function pickRoutine(id?: string | null): Promise<RoutineInfo | null> {
  const all = await listRoutines();
  return all.find((r) => r.id === id) ?? all.find((r) => r.status === 'active') ?? all[0] ?? null;
}

export async function activeRoutine(): Promise<RoutineInfo | null> {
  return (await listRoutines()).find((r) => r.status === 'active') ?? null;
}

export async function listSubjects(): Promise<Subject[]> {
  return getRoutineDb().select().from(routineSubjects).orderBy(asc(routineSubjects.sort), asc(routineSubjects.name));
}

export async function listRooms(): Promise<Room[]> {
  return getRoutineDb().select().from(routineRooms).orderBy(asc(routineRooms.name));
}

export async function listGroups(): Promise<Group[]> {
  return getRoutineDb().select().from(routineGroups).orderBy(asc(routineGroups.sort), asc(routineGroups.name));
}

export async function listTeachers(): Promise<Teacher[]> {
  const db = getRoutineDb();
  const [rows, links] = await Promise.all([db.select().from(routineTeachers).orderBy(asc(routineTeachers.shortName)), db.select().from(routineTeacherSubjects)]);
  return rows.map((row) => omit(row, 'createdAt', 'updatedAt')).map((t) => ({ ...t, subjectIds: links.filter((l) => l.teacherId === t.id).map((l) => l.subjectId) }));
}

export async function routineData(routine: RoutineInfo): Promise<RoutineData> {
  const db = getRoutineDb();
  const [periods, assignments, groups, teachers, subjects, rooms] = await Promise.all([
    db.select({ id: routinePeriods.id, label: routinePeriods.label, startsAt: routinePeriods.startsAt, endsAt: routinePeriods.endsAt }).from(routinePeriods).where(eq(routinePeriods.routineId, routine.id)).orderBy(asc(routinePeriods.startsAt)),
    db.select().from(routineAssignments).where(eq(routineAssignments.routineId, routine.id)),
    listGroups(),
    listTeachers(),
    listSubjects(),
    listRooms(),
  ]);
  return { routine, periods, assignments: assignments.map((a) => omit(a, 'routineId')), groups, teachers, subjects, rooms };
}

// ── Room slots (rebuilt whenever rooms or groups' default rooms change) ───────────────────────

/**
 * The room rows of routine_slots for every routine under these rooms and groups, or the first
 * clash. `removedRoom`: a room being deleted, which assignments stop using.
 */
async function roomSlotStatements(db: RoutineDb, rooms: Room[], groups: Group[], removedRoom?: string): Promise<{ statements: BatchItem<'pg'>[] } | { error: string }> {
  const [stored, routines] = await Promise.all([db.select().from(routineAssignments), db.select({ id: routineRoutines.id, name: routineRoutines.name }).from(routineRoutines)]);
  const assignments = stored.map((a) => (a.roomId === removedRoom ? { ...a, roomId: null } : a));
  const groupMap = new Map(groups.map((g) => [g.id, g]));
  const roomMap = new Map(rooms.map((r) => [r.id, r]));
  const seen = new Map<string, (typeof assignments)[number]>();
  const rows: (typeof routineSlots.$inferInsert)[] = [];
  for (const a of assignments) {
    const room = effectiveRoomId(a, groupMap);
    if (!room || roomMap.get(room)?.shared) continue;
    for (const day of new Set(a.days)) {
      const key = `${a.routineId}:${a.periodId}:${day}:${room}`;
      const other = seen.get(key);
      if (other) {
        const routine = routines.find((r) => r.id === a.routineId)?.name ?? '';
        return {
          error: `রুম ${roomMap.get(room)?.name}-এ ${daysText([day])} একই পিরিয়ডে ${groupMap.get(other.groupId)?.name} ও ${groupMap.get(a.groupId)?.name}-এর ক্লাস পড়ে যাবে (${routine} রুটিন)। আগে রুটিনে রুম বদলান, অথবা রুমটি "শেয়ার করা" করুন।`,
        };
      }
      seen.set(key, a);
      rows.push({ routineId: a.routineId, periodId: a.periodId, day, kind: 'room', refId: room, assignmentId: a.id });
    }
  }
  return { statements: [db.delete(routineSlots).where(eq(routineSlots.kind, 'room')), ...(rows.length ? [db.insert(routineSlots).values(rows)] : [])] };
}

// ── Subjects, rooms, groups ────────────────────────────────────────────────────────────────────

export async function saveSubject(input: Omit<Subject, 'id'> & { id?: string }): Promise<Outcome> {
  const db = getRoutineDb();
  try {
    if (input.id) await db.update(routineSubjects).set({ name: input.name, sort: input.sort, active: input.active }).where(eq(routineSubjects.id, input.id));
    else await db.insert(routineSubjects).values({ name: input.name, sort: input.sort, active: input.active });
  } catch (e) {
    if (pgCode(e) === '23505') return fail('এই নামে বিষয় আগে থেকেই আছে।');
    throw e;
  }
  return { ok: true };
}

export async function deleteSubject(id: string): Promise<Outcome> {
  const db = getRoutineDb();
  const [used] = await db.select({ n: sql<number>`count(*)::int` }).from(routineAssignments).where(eq(routineAssignments.subjectId, id));
  if (used.n) return fail('বিষয়টি রুটিনে আছে, তাই মুছে ফেলা যাবে না। বন্ধ করে রাখুন।');
  await db.delete(routineSubjects).where(eq(routineSubjects.id, id));
  return { ok: true };
}

export async function saveRoom(input: Omit<Room, 'id'> & { id?: string }): Promise<Outcome> {
  const db = getRoutineDb();
  const id = input.id ?? crypto.randomUUID();
  const rooms = (await listRooms()).filter((r) => r.id !== id).concat({ id, name: input.name, shared: input.shared });
  const rebuilt = await roomSlotStatements(db, rooms, await listGroups());
  if ('error' in rebuilt) return fail(rebuilt.error);
  const write = input.id ? db.update(routineRooms).set({ name: input.name, shared: input.shared }).where(eq(routineRooms.id, id)) : db.insert(routineRooms).values({ id, name: input.name, shared: input.shared });
  try {
    await run(db, [write, ...rebuilt.statements]);
  } catch (e) {
    if (pgCode(e) === '23505') return fail(rooms.some((r) => r.id !== id && r.name === input.name) ? 'এই নামে রুম আগে থেকেই আছে।' : RACE);
    throw e;
  }
  return { ok: true, id };
}

export async function deleteRoom(id: string): Promise<Outcome> {
  const db = getRoutineDb();
  // Groups and assignments lose the room (ON DELETE SET NULL); assignments then fall back to their
  // group's room, which could clash: checked first.
  const groups = (await listGroups()).map((g) => (g.defaultRoomId === id ? { ...g, defaultRoomId: null } : g));
  const rebuilt = await roomSlotStatements(db, (await listRooms()).filter((r) => r.id !== id), groups, id);
  if ('error' in rebuilt) return fail(rebuilt.error);
  await run(db, [db.delete(routineRooms).where(eq(routineRooms.id, id)), ...rebuilt.statements]);
  return { ok: true };
}

export async function saveGroup(input: Omit<Group, 'id'> & { id?: string }): Promise<Outcome> {
  const db = getRoutineDb();
  const id = input.id ?? crypto.randomUUID();
  const values = omit(input, 'id');
  const groups = (await listGroups()).filter((g) => g.id !== id).concat({ ...values, id });
  const rebuilt = await roomSlotStatements(db, await listRooms(), groups);
  if ('error' in rebuilt) return fail(rebuilt.error);
  const write = input.id ? db.update(routineGroups).set(values).where(eq(routineGroups.id, id)) : db.insert(routineGroups).values({ ...values, id });
  try {
    await run(db, [write, ...rebuilt.statements]);
  } catch (e) {
    if (pgCode(e) === '23505') return fail(groups.some((g) => g.id !== id && g.name === input.name) ? 'এই নামে গ্রুপ আগে থেকেই আছে।' : RACE);
    if (pgCode(e) === '23503') return fail(RACE);
    throw e;
  }
  return { ok: true, id };
}

export async function deleteGroup(id: string): Promise<Outcome> {
  const db = getRoutineDb();
  const [used] = await db.select({ n: sql<number>`count(*)::int` }).from(routineAssignments).where(eq(routineAssignments.groupId, id));
  if (used.n) return fail('গ্রুপটির রুটিনে ক্লাস আছে, তাই মুছে ফেলা যাবে না। বন্ধ করে রাখুন।');
  await db.delete(routineGroups).where(eq(routineGroups.id, id));
  return { ok: true };
}

// ── Teachers ───────────────────────────────────────────────────────────────────────────────────

export type TeacherInput = Omit<Teacher, 'id'> & { id?: string };

export async function saveTeacher(input: TeacherInput): Promise<Outcome> {
  const db = getRoutineDb();
  const id = input.id ?? crypto.randomUUID();
  const { subjectIds } = input;
  const values = omit(input, 'id', 'subjectIds');
  const write = input.id ? db.update(routineTeachers).set({ ...values, updatedAt: new Date() }).where(eq(routineTeachers.id, id)) : db.insert(routineTeachers).values({ ...values, id });
  try {
    await run(db, [
      write,
      db.delete(routineTeacherSubjects).where(eq(routineTeacherSubjects.teacherId, id)),
      ...(subjectIds.length ? [db.insert(routineTeacherSubjects).values(subjectIds.map((subjectId) => ({ teacherId: id, subjectId })))] : []),
    ]);
  } catch (e) {
    if (pgCode(e) === '23505') return fail('এই ছোট নামে আরেকজন সক্রিয় শিক্ষক আছেন। নামটি একটু বদলে দিন (যেমন "Taman Afz")।');
    if (pgCode(e) === '23503') return fail(RACE);
    throw e;
  }
  return { ok: true, id };
}

export async function deleteTeacher(id: string): Promise<Outcome> {
  const db = getRoutineDb();
  const [used] = await db
    .select({
      n: sql<number>`(select count(*)::int from ${routineAssignments} where ${routineAssignments.teacherId} = ${id} or ${routineAssignments.taId} = ${id})
        + (select count(*)::int from ${routineAbsences} where ${routineAbsences.teacherId} = ${id})
        + (select count(*)::int from ${routineProxies} where ${routineProxies.proxyTeacherId} = ${id})`,
    })
    .from(sql`(select 1) as one`);
  if (used.n) return fail('শিক্ষক রুটিনে বা প্রক্সির খাতায় আছেন, তাই মুছে ফেলা যাবে না। "সক্রিয়" বন্ধ করে রাখুন।');
  await db.delete(routineTeachers).where(eq(routineTeachers.id, id));
  return { ok: true };
}

// ── Routines and periods ───────────────────────────────────────────────────────────────────────

/** A new empty routine, or a copy of another one (its periods and assignments). */
export async function createRoutine(name: string, copyFromId?: string | null): Promise<Outcome> {
  const db = getRoutineDb();
  const id = crypto.randomUUID();
  const statements: BatchItem<'pg'>[] = [db.insert(routineRoutines).values({ id, name, copiedFromId: copyFromId ?? null })];
  if (copyFromId) {
    const [periods, assignments, slots] = await Promise.all([
      db.select().from(routinePeriods).where(eq(routinePeriods.routineId, copyFromId)),
      db.select().from(routineAssignments).where(eq(routineAssignments.routineId, copyFromId)),
      db.select().from(routineSlots).where(eq(routineSlots.routineId, copyFromId)),
    ]);
    if (!periods.length && !(await db.select({ id: routineRoutines.id }).from(routineRoutines).where(eq(routineRoutines.id, copyFromId))).length) return fail('যে রুটিন থেকে কপি করবেন সেটি পাওয়া যায়নি।');
    const periodIds = new Map(periods.map((p) => [p.id, crypto.randomUUID()]));
    const assignmentIds = new Map(assignments.map((a) => [a.id, crypto.randomUUID()]));
    if (periods.length) statements.push(db.insert(routinePeriods).values(periods.map((p) => ({ ...p, id: periodIds.get(p.id)!, routineId: id }))));
    if (assignments.length) {
      statements.push(db.insert(routineAssignments).values(assignments.map((a) => ({ ...a, id: assignmentIds.get(a.id)!, routineId: id, periodId: periodIds.get(a.periodId)! }))));
    }
    if (slots.length) {
      statements.push(db.insert(routineSlots).values(slots.map((s) => ({ ...s, routineId: id, periodId: periodIds.get(s.periodId)!, assignmentId: assignmentIds.get(s.assignmentId)! }))));
    }
  }
  try {
    await run(db, statements);
  } catch (e) {
    if (pgCode(e) === '23505') return fail('এই নামে রুটিন আগে থেকেই আছে।');
    throw e;
  }
  return { ok: true, id };
}

export async function renameRoutine(id: string, name: string): Promise<Outcome> {
  try {
    await getRoutineDb().update(routineRoutines).set({ name }).where(eq(routineRoutines.id, id));
  } catch (e) {
    if (pgCode(e) === '23505') return fail('এই নামে রুটিন আগে থেকেই আছে।');
    throw e;
  }
  return { ok: true };
}

/** Makes this routine the active one; the previously active one becomes a draft. */
export async function activateRoutine(id: string): Promise<Outcome> {
  const db = getRoutineDb();
  if (!(await db.select({ id: routineRoutines.id }).from(routineRoutines).where(eq(routineRoutines.id, id))).length) return fail(RACE);
  await run(db, [
    db.update(routineRoutines).set({ status: 'draft' }).where(and(eq(routineRoutines.status, 'active'), sql`${routineRoutines.id} <> ${id}`)),
    db.update(routineRoutines).set({ status: 'active' }).where(eq(routineRoutines.id, id)),
  ]);
  return { ok: true };
}

export async function deleteRoutine(id: string): Promise<Outcome> {
  const db = getRoutineDb();
  const deleted = await db
    .delete(routineRoutines)
    .where(and(eq(routineRoutines.id, id), eq(routineRoutines.status, 'draft')))
    .returning({ id: routineRoutines.id });
  return deleted.length ? { ok: true } : fail('চালু রুটিন মুছে ফেলা যায় না। আগে অন্য একটি রুটিন চালু করুন।');
}

export async function savePeriod(routineId: string, input: { id?: string; label: string; startsAt: number; endsAt: number }): Promise<Outcome> {
  const db = getRoutineDb();
  if (input.endsAt <= input.startsAt) return fail('শেষের সময় শুরুর পরে হতে হবে।');
  const periods = await db.select().from(routinePeriods).where(eq(routinePeriods.routineId, routineId));
  if (input.id && !periods.some((p) => p.id === input.id)) return fail(RACE);
  const overlap = overlappingPeriod(input, periods);
  if (overlap) return fail(`এই সময়টি ${periodText(overlap)} পিরিয়ডের সাথে মিলে যায়।`);
  const values = { label: input.label, startsAt: input.startsAt, endsAt: input.endsAt };
  try {
    if (input.id) await db.update(routinePeriods).set(values).where(eq(routinePeriods.id, input.id));
    else await db.insert(routinePeriods).values({ ...values, routineId });
  } catch (e) {
    if (pgCode(e) === '23503') return fail(RACE);
    throw e;
  }
  return { ok: true };
}

/** Deletes the period and its classes. */
export async function deletePeriod(id: string): Promise<Outcome> {
  await getRoutineDb().delete(routinePeriods).where(eq(routinePeriods.id, id));
  return { ok: true };
}

// ── Assignments ────────────────────────────────────────────────────────────────────────────────

/**
 * Adds or edits one assignment. Clashes are refused; a subject the teacher isn't listed for or a
 * broken gender rule comes back as `warnings` until the admin confirms.
 */
export async function saveAssignment(routineId: string, input: Draft, confirm: boolean): Promise<Outcome> {
  const db = getRoutineDb();
  const [routine] = await db.select().from(routineRoutines).where(eq(routineRoutines.id, routineId));
  if (!routine) return fail(RACE);
  const data = await routineData({ ...routine, createdAt: '' });
  const names = lookup(data);
  const existing = input.id ? data.assignments.find((a) => a.id === input.id) : undefined;
  if (input.id && !existing) return fail(RACE);
  const days = [...new Set(input.days)].sort();
  if (!days.length) return fail('অন্তত একটি দিন বাছাই করুন।');
  if (!data.periods.some((p) => p.id === input.periodId) || !names.groups.has(input.groupId) || !names.subjects.has(input.subjectId)) return fail(RACE);
  if (input.roomId && !names.rooms.has(input.roomId)) return fail(RACE);
  const usable = (id: string, current?: string | null) => {
    const t = names.teachers.get(id);
    return !!t && (t.active || id === current);
  };
  if (!usable(input.teacherId, existing?.teacherId)) return fail('শিক্ষক সক্রিয় নেই।');
  if (input.taId && !usable(input.taId, existing?.taId)) return fail('সহকারী শিক্ষক সক্রিয় নেই।');
  if (input.taId === input.teacherId) return fail('একই শিক্ষক মূল ও সহকারী দুটোই হতে পারেন না।');

  const draft: Draft = { ...input, days };
  const clashes = findClashes(draft, data.assignments, names.groups, names.rooms);
  if (clashes.length) return fail(clashes.map((c) => clashText(c, names)).join(' '));
  const warnings = assignmentWarnings(draft, names);
  if (warnings.length && !confirm) return { ok: false, error: '', warnings };

  const id = input.id ?? crypto.randomUUID();
  const values = { groupId: draft.groupId, periodId: draft.periodId, days, subjectId: draft.subjectId, teacherId: draft.teacherId, taId: draft.taId, roomId: draft.roomId, note: draft.note };
  const slots = occupancy(draft, names.groups, names.rooms).map((o) => ({ routineId, periodId: draft.periodId, day: o.day, kind: o.kind, refId: o.refId, assignmentId: id }));
  try {
    await run(db, [
      input.id ? db.update(routineAssignments).set(values).where(eq(routineAssignments.id, id)) : db.insert(routineAssignments).values({ ...values, id, routineId }),
      db.delete(routineSlots).where(eq(routineSlots.assignmentId, id)),
      db.insert(routineSlots).values(slots),
    ]);
  } catch (e) {
    if (pgCode(e) === '23505' || pgCode(e) === '23503') return fail(RACE);
    throw e;
  }
  return { ok: true, id };
}

export async function deleteAssignment(id: string): Promise<Outcome> {
  await getRoutineDb().delete(routineAssignments).where(eq(routineAssignments.id, id));
  return { ok: true };
}

// ── Absences and proxies ───────────────────────────────────────────────────────────────────────

export type AbsenceRow = Absence & { id: string; reason: string };
export type ProxyRow = ProxyRecord & { snapshot: ProxySnapshot };

function monthRange(date: string): [string, string] {
  const [y, m] = date.split('-').map(Number);
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
  return [`${date.slice(0, 7)}-01`, next];
}

/** Proxies each teacher took in the month of this date. */
export async function monthProxyCounts(date: string): Promise<Record<string, number>> {
  const [from, to] = monthRange(date);
  const rows = await getRoutineDb()
    .select({ teacherId: routineProxies.proxyTeacherId, n: sql<number>`count(*)::int` })
    .from(routineProxies)
    .where(and(gte(routineProxies.date, from), lt(routineProxies.date, to)))
    .groupBy(routineProxies.proxyTeacherId);
  return Object.fromEntries(rows.map((r) => [r.teacherId, r.n]));
}

export type ProxyDay = { data: RoutineData | null; absences: AbsenceRow[]; proxies: ProxyRow[]; monthCounts: Record<string, number> };

export async function proxyDay(date: string): Promise<ProxyDay> {
  const db = getRoutineDb();
  const routine = await activeRoutine();
  const [data, absences, proxies, monthCounts] = await Promise.all([
    routine ? routineData(routine) : null,
    db.select({ id: routineAbsences.id, teacherId: routineAbsences.teacherId, periodIds: routineAbsences.periodIds, reason: routineAbsences.reason }).from(routineAbsences).where(eq(routineAbsences.date, date)),
    db
      .select({ id: routineProxies.id, assignmentId: routineProxies.assignmentId, role: routineProxies.role, periodId: routineProxies.periodId, proxyTeacherId: routineProxies.proxyTeacherId, snapshot: routineProxies.snapshot })
      .from(routineProxies)
      .where(eq(routineProxies.date, date)),
    monthProxyCounts(date),
  ]);
  return { data, absences, proxies, monthCounts };
}

/** Removes the date's proxies for classes nobody is away from any more. */
async function pruneProxies(date: string) {
  const day = dayOfDate(date);
  const { data, absences, proxies } = await proxyDay(date);
  const needed = new Set(day === null || !data ? [] : needsFor(day, absences, data.assignments).map((n) => `${n.assignment.id}:${n.role}`));
  const stale = proxies.filter((p) => p.assignmentId && !needed.has(`${p.assignmentId}:${p.role}`)).map((p) => p.id);
  if (stale.length) await getRoutineDb().delete(routineProxies).where(inArray(routineProxies.id, stale));
}

export async function saveAbsence(date: string, teacherId: string, periodIds: string[] | null, reason: string): Promise<Outcome> {
  const db = getRoutineDb();
  if (dayOfDate(date) === null) return fail('শুক্রবার ক্লাস নেই।');
  const ids = periodIds?.length ? periodIds : null;
  try {
    await db
      .insert(routineAbsences)
      .values({ date, teacherId, periodIds: ids, reason })
      .onConflictDoUpdate({ target: [routineAbsences.date, routineAbsences.teacherId], set: { periodIds: ids, reason } });
  } catch (e) {
    if (pgCode(e) === '23503') return fail(RACE);
    throw e;
  }
  await pruneProxies(date);
  return { ok: true };
}

export async function deleteAbsence(id: string): Promise<Outcome> {
  const [row] = await getRoutineDb().delete(routineAbsences).where(eq(routineAbsences.id, id)).returning({ date: routineAbsences.date });
  if (row) await pruneProxies(row.date);
  return { ok: true };
}

/** Sets (or with null clears) who covers one class on a date; only a ranked candidate is accepted. */
export async function setProxy(date: string, assignmentId: string, role: Role, teacherId: string | null): Promise<Outcome> {
  const db = getRoutineDb();
  const day = dayOfDate(date);
  if (day === null) return fail('শুক্রবার ক্লাস নেই।');
  const where = and(eq(routineProxies.date, date), eq(routineProxies.assignmentId, assignmentId), eq(routineProxies.role, role));
  if (!teacherId) {
    await db.delete(routineProxies).where(where);
    return { ok: true };
  }
  const { data, absences, proxies, monthCounts } = await proxyDay(date);
  const need = data ? needsFor(day, absences, data.assignments).find((n) => n.assignment.id === assignmentId && n.role === role) : undefined;
  if (!data || !need) return fail(RACE);
  const names = lookup(data);
  const candidates = rankCandidates(need, { teachers: data.teachers, assignments: data.assignments, day, absences, proxies, monthCounts: new Map(Object.entries(monthCounts)), group: names.groups.get(need.assignment.groupId) });
  if (!candidates.some((c) => c.teacher.id === teacherId)) return fail('এই পিরিয়ডে তিনি আর ফ্রি নেই। পেজটি রিলোড করুন।');
  const period = data.periods.find((p) => p.id === need.assignment.periodId)!;
  const snapshot: ProxySnapshot = {
    group: names.groups.get(need.assignment.groupId)?.name ?? '',
    subject: names.subjects.get(need.assignment.subjectId)?.name ?? '',
    period: periodText(period),
    absent: names.teachers.get(need.absentId)?.shortName ?? '',
  };
  try {
    await db
      .insert(routineProxies)
      .values({ date, assignmentId, role, periodId: period.id, proxyTeacherId: teacherId, snapshot })
      .onConflictDoUpdate({ target: [routineProxies.date, routineProxies.assignmentId, routineProxies.role], set: { proxyTeacherId: teacherId, periodId: period.id, snapshot } });
  } catch (e) {
    if (pgCode(e) === '23505') return fail('এই পিরিয়ডে তিনি আরেকটি প্রক্সিতে আছেন।');
    throw e;
  }
  return { ok: true };
}

/** Proxy records of one teacher (newest first), for their page. */
export async function teacherProxies(teacherId: string, limit = 20) {
  return getRoutineDb()
    .select({ date: routineProxies.date, snapshot: routineProxies.snapshot, role: routineProxies.role })
    .from(routineProxies)
    .where(eq(routineProxies.proxyTeacherId, teacherId))
    .orderBy(sql`${routineProxies.date} desc`)
    .limit(limit);
}
