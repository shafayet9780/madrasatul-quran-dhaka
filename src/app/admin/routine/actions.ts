'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  activateRoutine,
  createRoutine,
  deleteAbsence,
  deleteAssignment,
  deleteGroup,
  deleteRoom,
  deleteRoutine,
  deleteSubject,
  deleteTeacher,
  deleteType,
  moveType,
  renameRoutine,
  saveAbsence,
  saveAssignment,
  saveGroup,
  saveRoom,
  saveSubject,
  saveTeacher,
  saveType,
  setProxy,
  setTeacherTarget,
  teacherFootprint,
  type Outcome,
} from '@/lib/routine/data';
import { isDate } from '@/lib/routine/days';
import { assertAdmin } from '@/lib/survey/admin-auth';

// Class routine admin changes. Every action checks the admin login first (the proxy also gates /admin).

export type Result = Outcome;
const BAD_REQUEST: Result = { ok: false, error: 'কিছু একটা ঠিক নেই। পেজটা রিলোড করে আবার চেষ্টা করুন।' };

const id = z.uuid();
const optionalId = id.nullable();
const name = z.string().trim().min(1).max(120);
const text = (max: number) => z.string().trim().max(max);

/** Validates, runs, and refreshes every routine page. */
async function act<T>(schema: z.ZodType<T>, input: unknown, run: (value: T) => Promise<Outcome>): Promise<Result> {
  await assertAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return BAD_REQUEST;
  const result = await run(parsed.data);
  if (result.ok) revalidatePath('/admin/routine', 'layout');
  return result;
}

// ── Assignments ──

const minute = z.number().int().min(0).max(1440);
const span = z.object({ startsAt: minute, endsAt: minute }).refine((t) => t.endsAt > t.startsAt);

const assignment = z.object({
  id: id.optional(),
  groupId: id,
  hostGroupId: optionalId,
  startsAt: minute,
  endsAt: minute,
  days: z.array(z.number().int().min(0).max(5)).min(1).max(6),
  subjectId: id,
  teacherId: id,
  taId: optionalId,
});

export async function saveAssignmentAction(routineId: string, input: z.input<typeof assignment>, confirm: boolean): Promise<Result> {
  return act(z.object({ routineId: id, input: assignment, confirm: z.boolean() }), { routineId, input, confirm }, (v) => saveAssignment(v.routineId, v.input, v.confirm));
}

export async function deleteAssignmentAction(assignmentId: string): Promise<Result> {
  return act(id, assignmentId, deleteAssignment);
}

// ── Teachers ──

const teacher = z.object({
  id: id.optional(),
  fullName: name,
  shortName: text(40).min(1),
  gender: z.enum(['male', 'female']).nullable(),
  designation: text(80),
  department: text(80),
  qualification: text(300),
  experienceYears: z.number().min(0).max(80).nullable(),
  phone: text(40),
  salary: z.number().int().min(0).max(10_000_000).nullable(),
  targetPeriods: z.number().int().min(0).max(80).nullable(),
  bio: text(2000),
  erpId: text(40).nullable().transform((v) => v || null),
  isVacancy: z.boolean(),
  active: z.boolean(),
  subjectIds: z.array(id).max(100),
});

export async function saveTeacherAction(input: z.input<typeof teacher>): Promise<Result> {
  return act(teacher, input, saveTeacher);
}

export async function setTargetAction(teacherId: string, target: number | null): Promise<Result> {
  return act(z.object({ teacherId: id, target: z.number().int().min(0).max(80).nullable() }), { teacherId, target }, (v) => setTeacherTarget(v.teacherId, v.target));
}

/** What deleting a teacher would take with it (asked before the confirm). */
export async function teacherFootprintAction(teacherId: string): Promise<{ lessons: number; taLessons: number; history: boolean } | null> {
  await assertAdmin();
  const parsed = id.safeParse(teacherId);
  return parsed.success ? teacherFootprint(parsed.data) : null;
}

export async function deleteTeacherAction(teacherId: string): Promise<Result> {
  return act(id, teacherId, deleteTeacher);
}

// ── Class types, subjects, rooms, classes and groups ──

const placement = z.enum(['class', 'own_room', 'seated']);

export async function saveTypeAction(input: { id?: string; name: string; placement: 'class' | 'own_room' | 'seated' }): Promise<Result> {
  return act(z.object({ id: id.optional(), name, placement }), input, saveType);
}

export async function moveTypeAction(typeId: string, step: -1 | 1): Promise<Result> {
  return act(z.object({ id, step: z.union([z.literal(-1), z.literal(1)]) }), { id: typeId, step }, (v) => moveType(v.id, v.step));
}

export async function deleteTypeAction(typeId: string): Promise<Result> {
  return act(id, typeId, deleteType);
}

export async function saveSubjectAction(input: { id?: string; typeId: string; name: string; sort: number; active: boolean }): Promise<Result> {
  return act(z.object({ id: id.optional(), typeId: id, name, sort: z.number().int().min(-9999).max(9999), active: z.boolean() }), input, saveSubject);
}

export async function deleteSubjectAction(subjectId: string): Promise<Result> {
  return act(id, subjectId, deleteSubject);
}

export async function saveRoomAction(input: { id?: string; name: string }): Promise<Result> {
  return act(z.object({ id: id.optional(), name }), input, saveRoom);
}

export async function deleteRoomAction(roomId: string): Promise<Result> {
  return act(id, roomId, deleteRoom);
}

const group = z.object({
  id: id.optional(),
  name,
  typeId: id,
  sort: z.number().int().min(-9999).max(9999),
  defaultRoomId: optionalId,
  genderRule: z.enum(['any', 'male', 'female']),
  active: z.boolean(),
});

export async function saveGroupAction(input: z.input<typeof group>): Promise<Result> {
  return act(group, input, saveGroup);
}

export async function deleteGroupAction(groupId: string): Promise<Result> {
  return act(id, groupId, deleteGroup);
}

// ── Routines ──

export async function createRoutineAction(routineName: string, copyFromId: string | null): Promise<Result> {
  return act(z.object({ name, copyFromId: optionalId }), { name: routineName, copyFromId }, (v) => createRoutine(v.name, v.copyFromId));
}

export async function renameRoutineAction(routineId: string, routineName: string): Promise<Result> {
  return act(z.object({ id, name }), { id: routineId, name: routineName }, (v) => renameRoutine(v.id, v.name));
}

export async function activateRoutineAction(routineId: string): Promise<Result> {
  return act(id, routineId, activateRoutine);
}

export async function deleteRoutineAction(routineId: string): Promise<Result> {
  return act(id, routineId, deleteRoutine);
}

// ── Absences and proxies ──

const date = z.string().refine(isDate);

/** Away the whole day (times null) or at these times. */
export async function saveAbsenceAction(day: string, teacherId: string, times: { startsAt: number; endsAt: number }[] | null, reason: string): Promise<Result> {
  return act(z.object({ day: date, teacherId: id, times: z.array(span).max(40).nullable(), reason: text(200) }), { day, teacherId, times, reason }, (v) => saveAbsence(v.day, v.teacherId, v.times, v.reason));
}

export async function deleteAbsenceAction(absenceId: string): Promise<Result> {
  return act(id, absenceId, deleteAbsence);
}

export async function setProxyAction(day: string, assignmentId: string, role: 'main' | 'ta', teacherId: string | null): Promise<Result> {
  return act(z.object({ day: date, assignmentId: id, role: z.enum(['main', 'ta']), teacherId: optionalId }), { day, assignmentId, role, teacherId }, (v) =>
    setProxy(v.day, v.assignmentId, v.role, v.teacherId),
  );
}
