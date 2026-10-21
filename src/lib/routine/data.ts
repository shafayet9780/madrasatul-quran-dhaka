import 'server-only';
import { and, asc, eq, gte, inArray, lt, ne, sql } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { assignmentWarnings, clashText, findClashes, hostProblem, lookup, occupancy, type Draft } from './clash';
import { dayOfDate, dhakaToday, sameTime, spanText } from './days';
import { busyTeachers } from './free';
import { getRoutineDb, type RoutineDb } from './db';
import { absentIn, needsFor, proxySpan, rankCandidates, type Absence, type ProxyRecord } from './proxy';
import {
  routineAbsences,
  routineAssignments,
  routineClassTypes,
  routineGroups,
  routineProxies,
  routineRooms,
  routineRoutines,
  routineSlots,
  routineSubjects,
  routineTeacherSubjects,
  routineTeachers,
  type ProxySnapshot,
} from './schema';
import type { ClassType, Group, Role, Room, RoutineData, RoutineInfo, Subject, Teacher, TimeSpan } from './types';

// Reads and writes for the class routine admin (docs/class-routine.md). Every multi-statement write
// is one db.batch (one transaction); routine_slots' exclusion constraint makes a clash fail the batch.

export type Outcome = { ok: true; id?: string } | { ok: false; error: string; warnings?: string[] };

const fail = (error: string): Outcome => ({ ok: false, error });
const pgCode = (e: unknown): string | undefined => (e as { code?: string }).code ?? (e as { cause?: { code?: string } }).cause?.code;
/** A unique index (23505) or an exclusion constraint (23P01) refused the write. */
const conflict = (e: unknown) => pgCode(e) === '23505' || pgCode(e) === '23P01';
const RACE = 'এর মধ্যে রুটিনে অন্য কিছু বদলেছে। পেজটা রিলোড করে আবার চেষ্টা করুন।';

function omit<T extends object, K extends keyof T>(o: T, ...keys: K[]): Omit<T, K> {
  const copy = { ...o };
  for (const k of keys) delete copy[k];
  return copy;
}

async function run(db: RoutineDb, statements: BatchItem<'pg'>[]) {
  if (statements.length) await db.batch(statements as [BatchItem<'pg'>, ...BatchItem<'pg'>[]]);
}

/** Slot rows in inserts of 1,000 (7 parameters a row stays under Postgres's 65,535). */
function insertSlots(db: RoutineDb, rows: (typeof routineSlots.$inferInsert)[]): BatchItem<'pg'>[] {
  const out: BatchItem<'pg'>[] = [];
  for (let i = 0; i < rows.length; i += 1000) out.push(db.insert(routineSlots).values(rows.slice(i, i + 1000)));
  return out;
}

function slotRows(routineId: string, a: Draft & { id: string }): (typeof routineSlots.$inferInsert)[] {
  return occupancy(a).map((o) => ({ routineId, startsAt: a.startsAt, endsAt: a.endsAt, day: o.day, kind: o.kind, refId: o.refId, assignmentId: a.id }));
}

// ── Reads ──────────────────────────────────────────────────────────────────────────────────────

export type RoutineSummary = RoutineInfo & { assignments: number };

export async function listRoutines(): Promise<RoutineSummary[]> {
  const db = getRoutineDb();
  const [rows, assignments] = await Promise.all([
    db.select().from(routineRoutines).orderBy(sql`${routineRoutines.createdAt} desc`),
    db.select({ id: routineAssignments.routineId, n: sql<number>`count(*)::int` }).from(routineAssignments).groupBy(routineAssignments.routineId),
  ]);
  return rows.map((r) => ({ id: r.id, name: r.name, status: r.status, createdAt: r.createdAt.toISOString(), assignments: assignments.find((x) => x.id === r.id)?.n ?? 0 }));
}

/** The routine asked for, else the active one, else the newest draft. */
export async function pickRoutine(id?: string | null): Promise<RoutineInfo | null> {
  const all = await listRoutines();
  return all.find((r) => r.id === id) ?? all.find((r) => r.status === 'active') ?? all[0] ?? null;
}

export async function activeRoutine(): Promise<RoutineInfo | null> {
  return (await listRoutines()).find((r) => r.status === 'active') ?? null;
}

export async function listTypes(): Promise<ClassType[]> {
  return getRoutineDb().select().from(routineClassTypes).orderBy(asc(routineClassTypes.sort), asc(routineClassTypes.name));
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
  const [assignments, types, groups, teachers, subjects, rooms] = await Promise.all([
    db.select().from(routineAssignments).where(eq(routineAssignments.routineId, routine.id)),
    listTypes(),
    listGroups(),
    listTeachers(),
    listSubjects(),
    listRooms(),
  ]);
  return { routine, assignments: assignments.map((a) => omit(a, 'routineId')), types, groups, teachers, subjects, rooms };
}

/** Lessons per class or group (as itself or as the host of a seated group), over every routine. */
export async function groupLessonCounts(): Promise<Record<string, number>> {
  const rows = await getRoutineDb().select({ groupId: routineAssignments.groupId, hostGroupId: routineAssignments.hostGroupId }).from(routineAssignments);
  const counts: Record<string, number> = {};
  for (const r of rows) for (const id of new Set([r.groupId, r.hostGroupId ?? r.groupId])) counts[id] = (counts[id] ?? 0) + 1;
  return counts;
}

// ── Class types, subjects, rooms, groups ───────────────────────────────────────────────────────

export async function saveType(input: Omit<ClassType, 'id' | 'sort'> & { id?: string }): Promise<Outcome> {
  const db = getRoutineDb();
  try {
    if (input.id) {
      const [current] = await db.select().from(routineClassTypes).where(eq(routineClassTypes.id, input.id));
      if (!current) return fail(RACE);
      if (current.placement !== input.placement) {
        const [used] = await db
          .select({ n: sql<number>`count(*)::int` })
          .from(routineAssignments)
          // Its own lessons and the groups seated in its classes' rooms.
          .innerJoin(routineGroups, sql`${routineGroups.id} in (${routineAssignments.groupId}, ${routineAssignments.hostGroupId})`)
          .where(eq(routineGroups.typeId, input.id));
        if (used.n) return fail('এই ধরনের ক্লাস রুটিনে আছে, তাই কোথায় বসে সেটা বদলানো যাবে না।');
      }
      await db.update(routineClassTypes).set({ name: input.name, placement: input.placement }).where(eq(routineClassTypes.id, input.id));
    } else {
      const [last] = await db.select({ n: sql<number>`coalesce(max(${routineClassTypes.sort}), -1)::int` }).from(routineClassTypes);
      await db.insert(routineClassTypes).values({ name: input.name, placement: input.placement, sort: last.n + 1 });
    }
  } catch (e) {
    if (pgCode(e) === '23505') return fail('এই নামে ধরন আগে থেকেই আছে।');
    throw e;
  }
  return { ok: true };
}

const SORTED = { types: routineClassTypes, groups: routineGroups, subjects: routineSubjects };

/**
 * Puts types, or one type's groups or subjects, in this order (the routine table follows it). The
 * ids must be the whole list as it is now; anything added or removed meanwhile refuses.
 */
export async function reorder(kind: keyof typeof SORTED, ids: string[]): Promise<Outcome> {
  const db = getRoutineDb();
  const table = SORTED[kind];
  let now: string[];
  if (kind === 'types') now = (await db.select({ id: routineClassTypes.id }).from(routineClassTypes)).map((r) => r.id);
  else {
    const typed = table as typeof routineGroups | typeof routineSubjects;
    const [first] = await db.select({ typeId: typed.typeId }).from(typed).where(eq(typed.id, ids[0]));
    if (!first) return fail(RACE);
    now = (await db.select({ id: typed.id }).from(typed).where(eq(typed.typeId, first.typeId))).map((r) => r.id);
  }
  if (new Set(ids).size !== ids.length || ids.length !== now.length || !ids.every((x) => now.includes(x))) return fail(RACE);
  await run(
    db,
    ids.map((x, sort) => db.update(table).set({ sort }).where(eq(table.id, x))),
  );
  return { ok: true };
}

export async function deleteType(id: string): Promise<Outcome> {
  const db = getRoutineDb();
  const [used] = await db
    .select({ n: sql<number>`(select count(*)::int from ${routineGroups} where ${routineGroups.typeId} = ${id}) + (select count(*)::int from ${routineSubjects} where ${routineSubjects.typeId} = ${id})` })
    .from(sql`(select 1) as one`);
  if (used.n) return fail('এই ধরনের ক্লাস, গ্রুপ বা সাবজেক্ট আছে। আগে সেগুলো সরান বা অন্য ধরনে নিন।');
  await db.delete(routineClassTypes).where(eq(routineClassTypes.id, id));
  return { ok: true };
}

export async function saveSubject(input: Omit<Subject, 'id'> & { id?: string }): Promise<Outcome> {
  const db = getRoutineDb();
  try {
    if (input.id) {
      const [current] = await db.select().from(routineSubjects).where(eq(routineSubjects.id, input.id));
      if (!current) return fail(RACE);
      if (current.typeId !== input.typeId) {
        const [used] = await db.select({ n: sql<number>`count(*)::int` }).from(routineAssignments).where(eq(routineAssignments.subjectId, input.id));
        if (used.n) return fail('সাবজেক্টটা রুটিনে আছে, তাই ধরন বদলানো যাবে না।');
      }
      await db.update(routineSubjects).set(omit(input, 'id')).where(eq(routineSubjects.id, input.id));
    } else await db.insert(routineSubjects).values(omit(input, 'id'));
  } catch (e) {
    if (pgCode(e) === '23505') return fail('এই ধরনে এই নামে সাবজেক্ট আগে থেকেই আছে।');
    if (pgCode(e) === '23503') return fail(RACE);
    throw e;
  }
  return { ok: true };
}

export async function deleteSubject(id: string): Promise<Outcome> {
  const db = getRoutineDb();
  const [used] = await db.select({ n: sql<number>`count(*)::int` }).from(routineAssignments).where(eq(routineAssignments.subjectId, id));
  if (used.n) return fail('সাবজেক্টটা রুটিনে আছে, তাই ডিলিট করা যাবে না। "চালু" টিক তুলে দিন।');
  await db.delete(routineSubjects).where(eq(routineSubjects.id, id));
  return { ok: true };
}

export async function saveRoom(input: Omit<Room, 'id'> & { id?: string }): Promise<Outcome> {
  const db = getRoutineDb();
  try {
    if (input.id) await db.update(routineRooms).set({ name: input.name }).where(eq(routineRooms.id, input.id));
    else await db.insert(routineRooms).values({ name: input.name });
  } catch (e) {
    if (pgCode(e) === '23505') return fail('এই নামে রুম আগে থেকেই আছে।');
    throw e;
  }
  return { ok: true };
}

/** Classes and groups in the room lose it (ON DELETE SET NULL); the routine's rows stay as they are. */
export async function deleteRoom(id: string): Promise<Outcome> {
  await getRoutineDb().delete(routineRooms).where(eq(routineRooms.id, id));
  return { ok: true };
}

export async function saveGroup(input: Omit<Group, 'id'> & { id?: string }): Promise<Outcome> {
  const db = getRoutineDb();
  const types = await listTypes();
  const type = types.find((t) => t.id === input.typeId);
  if (!type) return fail(RACE);
  const values = { ...omit(input, 'id'), defaultRoomId: type.placement === 'seated' ? null : input.defaultRoomId };
  try {
    if (input.id) {
      const [current] = await db.select().from(routineGroups).where(eq(routineGroups.id, input.id));
      if (!current) return fail(RACE);
      const before = types.find((t) => t.id === current.typeId)?.placement;
      if (before !== type.placement && (await groupLessonCounts())[input.id]) return fail('রুটিনে এর ক্লাস আছে, তাই অন্য রকম ধরনে নেওয়া যাবে না (ক্লাস, নিজের রুমের গ্রুপ, ক্লাসের রুমে বসা গ্রুপ)।');
      // Its lessons have subjects of its type, so with lessons it keeps its type.
      if (current.typeId !== input.typeId) {
        const [own] = await db.select({ n: sql<number>`count(*)::int` }).from(routineAssignments).where(eq(routineAssignments.groupId, input.id));
        if (own.n) return fail('রুটিনে এর ক্লাস আছে (সেই ধরনের সাবজেক্টে), তাই ধরন বদলানো যাবে না। আগে ক্লাসগুলো ডিলিট করুন।');
      }
      await db.update(routineGroups).set(values).where(eq(routineGroups.id, input.id));
      return { ok: true, id: input.id };
    }
    const [row] = await db.insert(routineGroups).values(values).returning({ id: routineGroups.id });
    return { ok: true, id: row.id };
  } catch (e) {
    if (pgCode(e) === '23505') return fail('এই নামে ক্লাস বা গ্রুপ আগে থেকেই আছে।');
    if (pgCode(e) === '23503') return fail(RACE);
    throw e;
  }
}

export async function deleteGroup(id: string): Promise<Outcome> {
  if ((await groupLessonCounts())[id]) return fail('রুটিনে এর ক্লাস আছে (বা কোনো গ্রুপ এর রুমে বসে), তাই ডিলিট করা যাবে না। "চালু" টিক তুলে দিন।');
  await getRoutineDb().delete(routineGroups).where(eq(routineGroups.id, id));
  return { ok: true };
}

// ── Teachers ───────────────────────────────────────────────────────────────────────────────────

export type TeacherInput = Omit<Teacher, 'id'> & { id?: string };

export async function saveTeacher(input: TeacherInput): Promise<Outcome> {
  const db = getRoutineDb();
  if (!input.gender && !input.isVacancy) return fail('জেন্ডার সিলেক্ট করুন (শুধু খালি পোস্টে বাদ রাখা যায়)।');
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
    if (pgCode(e) === '23505') return fail('এই ছোট নামে আরেকজন টিচার আছেন। নামটা একটু বদলে দিন (যেমন "Taman Afz")।');
    if (pgCode(e) === '23503') return fail(RACE);
    throw e;
  }
  if (input.id && (!input.active || input.isVacancy)) await pruneUpcomingProxies();
  return { ok: true, id };
}

/** Sets only the weekly target (the workload table edits it in place). */
export async function setTeacherTarget(id: string, target: number | null): Promise<Outcome> {
  const rows = await getRoutineDb().update(routineTeachers).set({ targetPeriods: target, updatedAt: new Date() }).where(eq(routineTeachers.id, id)).returning({ id: routineTeachers.id });
  return rows.length ? { ok: true } : fail(RACE);
}

/** What deleting a teacher takes with it: their lessons as main teacher, and whether they have history. */
export async function teacherFootprint(id: string): Promise<{ lessons: number; taLessons: number; history: boolean }> {
  const db = getRoutineDb();
  const [row] = await db
    .select({
      lessons: sql<number>`(select count(*)::int from ${routineAssignments} where ${routineAssignments.teacherId} = ${id})`,
      taLessons: sql<number>`(select count(*)::int from ${routineAssignments} where ${routineAssignments.taId} = ${id})`,
      history: sql<number>`(select count(*)::int from ${routineAbsences} where ${routineAbsences.teacherId} = ${id}) + (select count(*)::int from ${routineProxies} where ${routineProxies.proxyTeacherId} = ${id})`,
    })
    .from(sql`(select 1) as one`);
  return { lessons: row.lessons, taLessons: row.taLessons, history: row.history > 0 };
}

/**
 * Deletes a teacher and their lessons (as main teacher; where they are TA the lesson loses its TA).
 * A teacher with absences or proxies on record is hidden instead (no longer active), so the
 * register's history keeps its names.
 */
export async function deleteTeacher(id: string): Promise<Outcome> {
  const db = getRoutineDb();
  const { history } = await teacherFootprint(id);
  await run(db, [
    db.delete(routineAssignments).where(eq(routineAssignments.teacherId, id)),
    db.update(routineAssignments).set({ taId: null }).where(eq(routineAssignments.taId, id)),
    db.delete(routineSlots).where(and(eq(routineSlots.kind, 'teacher'), eq(routineSlots.refId, id))),
    history ? db.update(routineTeachers).set({ active: false, updatedAt: new Date() }).where(eq(routineTeachers.id, id)) : db.delete(routineTeachers).where(eq(routineTeachers.id, id)),
  ]);
  await pruneUpcomingProxies();
  return { ok: true };
}

// ── Routines ───────────────────────────────────────────────────────────────────────────────────

/** A new empty routine, or a copy of another one (its lessons). */
export async function createRoutine(name: string, copyFromId?: string | null): Promise<Outcome> {
  const db = getRoutineDb();
  const id = crypto.randomUUID();
  const statements: BatchItem<'pg'>[] = [db.insert(routineRoutines).values({ id, name, copiedFromId: copyFromId ?? null })];
  if (copyFromId) {
    if (!(await db.select({ id: routineRoutines.id }).from(routineRoutines).where(eq(routineRoutines.id, copyFromId))).length) return fail('যে রুটিন কপি করবেন সেটা পাওয়া যায়নি।');
    const [assignments, slots] = await Promise.all([
      db.select().from(routineAssignments).where(eq(routineAssignments.routineId, copyFromId)),
      db.select().from(routineSlots).where(eq(routineSlots.routineId, copyFromId)),
    ]);
    const ids = new Map(assignments.map((a) => [a.id, crypto.randomUUID()]));
    if (assignments.length) statements.push(db.insert(routineAssignments).values(assignments.map((a) => ({ ...a, id: ids.get(a.id)!, routineId: id }))));
    statements.push(...insertSlots(db, slots.map((s) => ({ ...s, routineId: id, assignmentId: ids.get(s.assignmentId)! }))));
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
  // Absences are kept by time, so they carry over as they are.
  await run(db, [
    db.update(routineRoutines).set({ status: 'draft' }).where(and(eq(routineRoutines.status, 'active'), sql`${routineRoutines.id} <> ${id}`)),
    db.update(routineRoutines).set({ status: 'active' }).where(eq(routineRoutines.id, id)),
    // Today's and later proxies were made for the old routine's lessons; past ones stay as history.
    db.delete(routineProxies).where(and(gte(routineProxies.date, dhakaToday()), inArray(routineProxies.assignmentId, db.select({ id: routineAssignments.id }).from(routineAssignments).where(ne(routineAssignments.routineId, id))))),
  ]);
  return { ok: true };
}

export async function deleteRoutine(id: string): Promise<Outcome> {
  const db = getRoutineDb();
  const deleted = await db
    .delete(routineRoutines)
    .where(and(eq(routineRoutines.id, id), eq(routineRoutines.status, 'draft')))
    .returning({ id: routineRoutines.id });
  return deleted.length ? { ok: true } : fail('চালু রুটিন ডিলিট করা যায় না। আগে অন্য একটা রুটিন চালু করুন।');
}

// ── Lessons ────────────────────────────────────────────────────────────────────────────────────

/**
 * Adds or edits one lesson. Clashes are refused; a subject the teacher isn't listed for or a broken
 * gender rule comes back as `warnings` until the admin confirms.
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
  if (!days.length) return fail('অন্তত একটা দিন সিলেক্ট করুন।');
  if (!Number.isInteger(input.startsAt) || !Number.isInteger(input.endsAt) || input.startsAt < 0 || input.endsAt > 1440 || input.endsAt <= input.startsAt) return fail('শেষের সময় শুরুর পরে দিন।');
  const group = names.groups.get(input.groupId);
  const subject = names.subjects.get(input.subjectId);
  if (!group || !subject) return fail(RACE);
  if (subject.typeId !== group.typeId) return fail('এই সাবজেক্ট এই ধরনের ক্লাসের না।');
  const host = hostProblem(input, names);
  if (host) return fail(host);
  const usable = (id: string, current?: string | null) => {
    const t = names.teachers.get(id);
    return !!t && (t.active || id === current);
  };
  if (!usable(input.teacherId, existing?.teacherId)) return fail('এই টিচার এখন চালু নেই।');
  if (input.taId && !usable(input.taId, existing?.taId)) return fail('এই টিএ এখন চালু নেই।');
  if (input.taId === input.teacherId) return fail('একই জন মেইন টিচার আর টিএ দুটোই হতে পারেন না।');

  const draft: Draft = { ...input, days };
  const clashes = findClashes(draft, data.assignments);
  if (clashes.length) return fail(clashes.map((c) => clashText(c, names)).join(' '));
  const warnings = assignmentWarnings(draft, names);
  if (warnings.length && !confirm) return { ok: false, error: '', warnings };

  const id = input.id ?? crypto.randomUUID();
  const values = { groupId: draft.groupId, hostGroupId: draft.hostGroupId, startsAt: draft.startsAt, endsAt: draft.endsAt, days, subjectId: draft.subjectId, teacherId: draft.teacherId, taId: draft.taId };
  try {
    await run(db, [
      input.id ? db.update(routineAssignments).set(values).where(eq(routineAssignments.id, id)) : db.insert(routineAssignments).values({ ...values, id, routineId }),
      db.delete(routineSlots).where(eq(routineSlots.assignmentId, id)),
      db.insert(routineSlots).values(slotRows(routineId, { ...draft, id })),
    ]);
  } catch (e) {
    if (conflict(e) || pgCode(e) === '23503') return fail(RACE);
    throw e;
  }
  await pruneUpcomingProxies();
  return { ok: true, id };
}

export async function deleteAssignment(id: string): Promise<Outcome> {
  await getRoutineDb().delete(routineAssignments).where(eq(routineAssignments.id, id));
  await pruneUpcomingProxies();
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
  const routine = await activeRoutine();
  const [data, { absences, proxies }, monthCounts] = await Promise.all([routine ? routineData(routine) : null, dayRecords(date), monthProxyCounts(date)]);
  return { data, absences, proxies, monthCounts };
}

/** A date's absences and proxies (the routine page shows today's). */
export async function dayRecords(date: string) {
  const db = getRoutineDb();
  const [absences, proxies] = await Promise.all([
    db.select({ id: routineAbsences.id, teacherId: routineAbsences.teacherId, times: routineAbsences.times, reason: routineAbsences.reason }).from(routineAbsences).where(eq(routineAbsences.date, date)),
    db
      .select({ id: routineProxies.id, assignmentId: routineProxies.assignmentId, role: routineProxies.role, startsAt: routineProxies.startsAt, endsAt: routineProxies.endsAt, proxyTeacherId: routineProxies.proxyTeacherId, snapshot: routineProxies.snapshot })
      .from(routineProxies)
      .where(eq(routineProxies.date, date)),
  ]);
  return { absences, proxies };
}

/**
 * Removes the date's proxies that no longer hold: the class needs no cover any more, or the proxy
 * teacher is away or has a class in that period. From today on, a proxy whose class was deleted
 * goes too; on past dates it stays as history (its snapshot keeps the names).
 */
async function pruneProxies(date: string) {
  const day = dayOfDate(date);
  const { data, absences, proxies } = await proxyDay(date);
  const needs = day === null || !data ? [] : needsFor(day, absences, data.assignments);
  const needed = new Set(needs.map((n) => `${n.assignment.id}:${n.role}`));
  const upcoming = date >= dhakaToday();
  const stale = proxies
    .filter((p) => {
      if (!p.assignmentId) return upcoming;
      // A teacher taken off the list (hidden or turned off), or made an open post, covers nothing ahead.
      const cover = data?.teachers.find((t) => t.id === p.proxyTeacherId);
      if (upcoming && data && (!cover?.active || cover.isVacancy)) return true;
      if (!needed.has(`${p.assignmentId}:${p.role}`)) return true;
      const span = proxySpan(p);
      // From today on, a lesson moved to another time needs its proxy found again.
      const lesson = data?.assignments.find((a) => a.id === p.assignmentId);
      if (upcoming && lesson && !(span && sameTime(span, lesson))) return true;
      if (!span || day === null || !data) return false;
      return absences.some((x) => x.teacherId === p.proxyTeacherId && absentIn(x, span)) || busyTeachers(data.assignments, day, span).has(p.proxyTeacherId);
    })
    .map((p) => p.id);
  if (stale.length) await getRoutineDb().delete(routineProxies).where(inArray(routineProxies.id, stale));
}

/** After the routine changes: re-checks every proxy from today on. */
async function pruneUpcomingProxies() {
  const dates = await getRoutineDb().selectDistinct({ date: routineProxies.date }).from(routineProxies).where(gte(routineProxies.date, dhakaToday()));
  for (const { date } of dates) await pruneProxies(date);
}

/** Away the whole day (times null or empty) or at these times. */
export async function saveAbsence(date: string, teacherId: string, times: TimeSpan[] | null, reason: string): Promise<Outcome> {
  const db = getRoutineDb();
  if (dayOfDate(date) === null) return fail('শুক্রবার ক্লাস নেই।');
  const ids = times?.length ? times.map((t) => ({ startsAt: t.startsAt, endsAt: t.endsAt })) : null;
  try {
    await db
      .insert(routineAbsences)
      .values({ date, teacherId, times: ids, reason })
      .onConflictDoUpdate({ target: [routineAbsences.date, routineAbsences.teacherId], set: { times: ids, reason } });
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
  if (!candidates.some((c) => c.teacher.id === teacherId)) return fail('এই সময়ে তিনি আর ফ্রি নেই। পেজটা রিলোড করুন।');
  const { startsAt, endsAt } = need.assignment;
  const snapshot: ProxySnapshot = {
    group: names.groups.get(need.assignment.groupId)?.name ?? '',
    subject: names.subjects.get(need.assignment.subjectId)?.name ?? '',
    period: spanText(need.assignment),
    absent: names.teachers.get(need.absentId)?.shortName ?? '',
  };
  try {
    await db
      .insert(routineProxies)
      .values({ date, assignmentId, role, startsAt, endsAt, proxyTeacherId: teacherId, snapshot })
      .onConflictDoUpdate({ target: [routineProxies.date, routineProxies.assignmentId, routineProxies.role], set: { proxyTeacherId: teacherId, startsAt, endsAt, snapshot } });
  } catch (e) {
    if (conflict(e)) return fail('এই সময়ে তিনি আরেকটা প্রক্সিতে আছেন।');
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
