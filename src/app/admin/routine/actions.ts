'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  activateRoutine,
  createRoutine,
  deleteAbsence,
  deleteAssignment,
  deleteGroup,
  deletePeriod,
  deleteRoom,
  deleteRoutine,
  deleteSubject,
  deleteTeacher,
  renameRoutine,
  saveAbsence,
  saveAssignment,
  saveGroup,
  savePeriod,
  saveRoom,
  saveSubject,
  saveTeacher,
  setProxy,
  type Outcome,
} from '@/lib/routine/data';
import { isDate, parseTime } from '@/lib/routine/days';
import { assertAdmin } from '@/lib/survey/admin-auth';

// Class routine admin changes. Every action checks the admin login first (the proxy also gates /admin).

export type Result = Outcome;
const BAD_REQUEST: Result = { ok: false, error: 'অনুরোধটি সঠিক নয়; পেজটি আবার লোড করুন।' };

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

const assignment = z.object({
  id: id.optional(),
  groupId: id,
  periodId: id,
  days: z.array(z.number().int().min(0).max(5)).min(1).max(6),
  subjectId: id,
  teacherId: id,
  taId: optionalId,
  roomId: optionalId,
  note: text(200),
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

export async function deleteTeacherAction(teacherId: string): Promise<Result> {
  return act(id, teacherId, deleteTeacher);
}

// ── Subjects, rooms, groups ──

export async function saveSubjectAction(input: { id?: string; name: string; sort: number; active: boolean }): Promise<Result> {
  return act(z.object({ id: id.optional(), name, sort: z.number().int().min(-9999).max(9999), active: z.boolean() }), input, saveSubject);
}

export async function deleteSubjectAction(subjectId: string): Promise<Result> {
  return act(id, subjectId, deleteSubject);
}

export async function saveRoomAction(input: { id?: string; name: string; shared: boolean }): Promise<Result> {
  return act(z.object({ id: id.optional(), name, shared: z.boolean() }), input, saveRoom);
}

export async function deleteRoomAction(roomId: string): Promise<Result> {
  return act(id, roomId, deleteRoom);
}

const group = z.object({
  id: id.optional(),
  name,
  kind: z.enum(['section', 'level']),
  section: text(60),
  band: text(40),
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

// ── Routines and periods ──

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

const time = z.string().transform((v, ctx) => parseTime(v) ?? (ctx.addIssue({ code: 'custom', message: 'time' }), z.NEVER));

export async function savePeriodAction(routineId: string, input: { id?: string; label: string; startsAt: string; endsAt: string }): Promise<Result> {
  return act(z.object({ routineId: id, input: z.object({ id: id.optional(), label: text(40), startsAt: time, endsAt: time }) }), { routineId, input }, (v) => savePeriod(v.routineId, v.input));
}

export async function deletePeriodAction(periodId: string): Promise<Result> {
  return act(id, periodId, deletePeriod);
}

// ── Absences and proxies ──

const date = z.string().refine(isDate);

export async function saveAbsenceAction(day: string, teacherId: string, periodIds: string[] | null, reason: string): Promise<Result> {
  return act(z.object({ day: date, teacherId: id, periodIds: z.array(id).max(30).nullable(), reason: text(200) }), { day, teacherId, periodIds, reason }, (v) =>
    saveAbsence(v.day, v.teacherId, v.periodIds, v.reason),
  );
}

export async function deleteAbsenceAction(absenceId: string): Promise<Result> {
  return act(id, absenceId, deleteAbsence);
}

export async function setProxyAction(day: string, assignmentId: string, role: 'main' | 'ta', teacherId: string | null): Promise<Result> {
  return act(z.object({ day: date, assignmentId: id, role: z.enum(['main', 'ta']), teacherId: optionalId }), { day, assignmentId, role, teacherId }, (v) =>
    setProxy(v.day, v.assignmentId, v.role, v.teacherId),
  );
}
