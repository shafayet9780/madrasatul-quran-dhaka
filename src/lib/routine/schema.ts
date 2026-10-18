import { sql } from 'drizzle-orm';
import { boolean, check, date, index, integer, jsonb, pgEnum, pgTable, primaryKey, real, smallint, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

// Class routine (docs/class-routine.md). Days are 0 = Saturday … 5 = Thursday; times are minutes
// after midnight. Postgres is the source of truth; nothing here is in Sanity.

const ts = (name: string) => timestamp(name, { withTimezone: true });

export const routineGender = pgEnum('routine_gender', ['male', 'female']);
export const routineGenderRule = pgEnum('routine_gender_rule', ['any', 'male', 'female']);
export const routineGroupKind = pgEnum('routine_group_kind', ['section', 'level']);
export const routineStatus = pgEnum('routine_status', ['draft', 'active']);
export const routineSlotKind = pgEnum('routine_slot_kind', ['group', 'teacher', 'room']);
export const routineRole = pgEnum('routine_role', ['main', 'ta']);

export const routineSubjects = pgTable('routine_subjects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  sort: integer('sort').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

/** A shared room (the hall) may hold several groups at once; any other room is a clash. */
export const routineRooms = pgTable('routine_rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  shared: boolean('shared').notNull().default(false),
});

export const routineTeachers = pgTable(
  'routine_teachers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fullName: text('full_name').notNull(),
    shortName: text('short_name').notNull(),
    gender: routineGender('gender').notNull(),
    designation: text('designation').notNull().default(''),
    department: text('department').notNull().default(''),
    qualification: text('qualification').notNull().default(''),
    experienceYears: real('experience_years'),
    phone: text('phone').notNull().default(''),
    salary: integer('salary'),
    targetPeriods: integer('target_periods'),
    bio: text('bio').notNull().default(''),
    erpId: text('erp_id'),
    // A post not yet filled ("Science-1"): assignable, never offered as a proxy.
    isVacancy: boolean('is_vacancy').notNull().default(false),
    active: boolean('active').notNull().default(true),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('routine_teachers_short_name_uq').on(sql`lower(${t.shortName})`).where(sql`${t.active}`)],
);

export const routineTeacherSubjects = pgTable(
  'routine_teacher_subjects',
  {
    teacherId: uuid('teacher_id')
      .notNull()
      .references(() => routineTeachers.id, { onDelete: 'cascade' }),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => routineSubjects.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.teacherId, t.subjectId] })],
);

/** A class section (Nursery-A) or a level group that mixes classes (Qaida-A, Arabic L-3). */
export const routineGroups = pgTable('routine_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  kind: routineGroupKind('kind').notNull().default('section'),
  // The heading the grid sorts the group under (জেনারেল, কুরআন, আরবি, হিফয).
  section: text('section').notNull().default(''),
  // Groups that share a band ("LEVEL-1" for L-1 A, B, C) sit under one label, as in the sheet.
  band: text('band').notNull().default(''),
  sort: integer('sort').notNull().default(0),
  defaultRoomId: uuid('default_room_id').references(() => routineRooms.id, { onDelete: 'set null' }),
  genderRule: routineGenderRule('gender_rule').notNull().default('any'),
  active: boolean('active').notNull().default(true),
});

/** A whole timetable (e.g. "২০২৭"). At most one is active; the rest are drafts. */
export const routineRoutines = pgTable(
  'routine_routines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    status: routineStatus('status').notNull().default('draft'),
    copiedFromId: uuid('copied_from_id'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('routine_routines_one_active_uq').on(t.status).where(sql`${t.status} = 'active'`)],
);

export const routinePeriods = pgTable(
  'routine_periods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    routineId: uuid('routine_id')
      .notNull()
      .references(() => routineRoutines.id, { onDelete: 'cascade' }),
    label: text('label').notNull().default(''),
    startsAt: smallint('starts_at').notNull(),
    endsAt: smallint('ends_at').notNull(),
  },
  (t) => [index('routine_periods_routine_idx').on(t.routineId), check('routine_periods_time_ck', sql`${t.endsAt} > ${t.startsAt} AND ${t.startsAt} >= 0 AND ${t.endsAt} <= 1440`)],
);

/** One group's period on a set of days. A cell that changes by day is several rows with disjoint days. */
export const routineAssignments = pgTable(
  'routine_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    routineId: uuid('routine_id')
      .notNull()
      .references(() => routineRoutines.id, { onDelete: 'cascade' }),
    groupId: uuid('group_id')
      .notNull()
      .references(() => routineGroups.id),
    periodId: uuid('period_id')
      .notNull()
      .references(() => routinePeriods.id, { onDelete: 'cascade' }),
    days: smallint('days').array().notNull(),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => routineSubjects.id),
    teacherId: uuid('teacher_id')
      .notNull()
      .references(() => routineTeachers.id),
    taId: uuid('ta_id').references(() => routineTeachers.id),
    // Empty: the group's default room.
    roomId: uuid('room_id').references(() => routineRooms.id, { onDelete: 'set null' }),
    note: text('note').notNull().default(''),
  },
  (t) => [
    index('routine_assignments_routine_idx').on(t.routineId),
    check('routine_assignments_days_ck', sql`cardinality(${t.days}) > 0 AND ${t.days} <@ ARRAY[0,1,2,3,4,5]::smallint[]`),
    check('routine_assignments_ta_ck', sql`${t.taId} IS NULL OR ${t.taId} <> ${t.teacherId}`),
  ],
);

/**
 * What each assignment occupies, one row per day: its group, its teacher and TA, and its room
 * unless the room is shared. The primary key is the clash guard: a second booking of the same
 * group, teacher or room in the same period and day fails, and with it the whole write.
 */
export const routineSlots = pgTable(
  'routine_slots',
  {
    routineId: uuid('routine_id').notNull(),
    periodId: uuid('period_id').notNull(),
    day: smallint('day').notNull(),
    kind: routineSlotKind('kind').notNull(),
    refId: uuid('ref_id').notNull(),
    assignmentId: uuid('assignment_id')
      .notNull()
      .references(() => routineAssignments.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.routineId, t.periodId, t.day, t.kind, t.refId] }), index('routine_slots_assignment_idx').on(t.assignmentId)],
);

/** A teacher away on a date: the whole day (periodIds NULL) or chosen periods of the active routine. */
export const routineAbsences = pgTable(
  'routine_absences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: date('date').notNull(),
    teacherId: uuid('teacher_id')
      .notNull()
      .references(() => routineTeachers.id),
    periodIds: uuid('period_ids').array(),
    reason: text('reason').notNull().default(''),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('routine_absences_uq').on(t.date, t.teacherId)],
);

/** Names as they were on the day, so the register still reads right after the routine changes. */
export type ProxySnapshot = { group: string; subject: string; period: string; absent: string };

export const routineProxies = pgTable(
  'routine_proxies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: date('date').notNull(),
    assignmentId: uuid('assignment_id').references(() => routineAssignments.id, { onDelete: 'set null' }),
    role: routineRole('role').notNull().default('main'),
    periodId: uuid('period_id').references(() => routinePeriods.id, { onDelete: 'set null' }),
    proxyTeacherId: uuid('proxy_teacher_id')
      .notNull()
      .references(() => routineTeachers.id),
    snapshot: jsonb('snapshot').$type<ProxySnapshot>().notNull(),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('routine_proxies_slot_uq').on(t.date, t.assignmentId, t.role),
    uniqueIndex('routine_proxies_teacher_uq').on(t.date, t.periodId, t.proxyTeacherId),
    index('routine_proxies_date_idx').on(t.date),
  ],
);
