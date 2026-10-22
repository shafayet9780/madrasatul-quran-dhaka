import 'server-only';
import { saveDailyBackup } from '../survey/backup';
import { getRoutineDb } from './db';
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
} from './schema';

/**
 * Nightly JSON copy of every class routine table (teachers' salaries included) to the same private
 * Blob store as the survey backup, under routine-backups/. Keeps the latest 30 days.
 */
export async function backupRoutineTables(now = new Date()) {
  const token = process.env.PG_BACKUP_BLOB_READ_WRITE_TOKEN;
  if (!token) return { skipped: 'PG_BACKUP_BLOB_READ_WRITE_TOKEN is not set (private Blob store)' as const };
  const db = getRoutineDb();
  const [types, subjects, rooms, teachers, teacherSubjects, groups, routines, assignments, slots, absences, proxies] = await Promise.all([
    db.select().from(routineClassTypes),
    db.select().from(routineSubjects),
    db.select().from(routineRooms),
    db.select().from(routineTeachers),
    db.select().from(routineTeacherSubjects),
    db.select().from(routineGroups),
    db.select().from(routineRoutines),
    db.select().from(routineAssignments),
    db.select().from(routineSlots),
    db.select().from(routineAbsences),
    db.select().from(routineProxies),
  ]);
  return saveDailyBackup(
    'routine-backups/',
    {
      routine_class_types: types,
      routine_subjects: subjects,
      routine_rooms: rooms,
      routine_teachers: teachers,
      routine_teacher_subjects: teacherSubjects,
      routine_groups: groups,
      routine_routines: routines,
      routine_assignments: assignments,
      routine_slots: slots,
      routine_absences: absences,
      routine_proxies: proxies,
    },
    now,
    token,
  );
}
