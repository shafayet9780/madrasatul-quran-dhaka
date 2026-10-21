import { sql } from 'drizzle-orm';
import { boolean, check, date, index, integer, jsonb, pgEnum, pgTable, primaryKey, real, smallint, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

// Class routine (docs/class-routine.md). Days are 0 = Saturday … 5 = Thursday; times are minutes
// after midnight. Postgres is the source of truth; nothing here is in Sanity.

const ts = (name: string) => timestamp(name, { withTimezone: true });

export const routineGender = pgEnum('routine_gender', ['male', 'female']);
export const routineGenderRule = pgEnum('routine_gender_rule', ['any', 'male', 'female']);
// Where a type's classes or groups show in the routine table: a class has its own row; a group with
// its own room (Hifz, Najera) too, at the top; a seated group (Quran, Arabic) uses a class's room.
export const routinePlacement = pgEnum('routine_placement', ['class', 'own_room', 'seated']);
export const routineStatus = pgEnum('routine_status', ['draft', 'active']);
export const routineRole = pgEnum('routine_role', ['main', 'ta']);

/** জেনারেল, হিফয, নাজেরা, কুরআন, আরবি (seeded; the admin can add and reorder). */
export const routineClassTypes = pgTable('routine_class_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  placement: routinePlacement('placement').notNull(),
  sort: integer('sort').notNull().default(0),
});

/** A subject belongs to exactly one class type ("Islam" of জেনারেল and of আরবি are two subjects). */
export const routineSubjects = pgTable(
  'routine_subjects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    typeId: uuid('type_id')
      .notNull()
      .references(() => routineClassTypes.id),
    name: text('name').notNull(),
    sort: integer('sort').notNull().default(0),
    active: boolean('active').notNull().default(true),
  },
  (t) => [uniqueIndex('routine_subjects_type_name_uq').on(t.typeId, sql`lower(${t.name})`)],
);

export const routineRooms = pgTable('routine_rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
});

export const routineTeachers = pgTable(
  'routine_teachers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fullName: text('full_name').notNull(),
    shortName: text('short_name').notNull(),
    // Empty only for an open post (a vacancy) whose hire isn't known yet.
    gender: routineGender('gender'),
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
  (t) => [
    uniqueIndex('routine_teachers_short_name_uq').on(sql`lower(${t.shortName})`).where(sql`${t.active}`),
    check('routine_teachers_gender_ck', sql`${t.gender} IS NOT NULL OR ${t.isVacancy}`),
  ],
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

/** A class (Nursery-A) or a group of its type (Hifz-1 (M), Qaida-A, L-3), which mixes classes. */
export const routineGroups = pgTable('routine_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  typeId: uuid('type_id')
    .notNull()
    .references(() => routineClassTypes.id),
  sort: integer('sort').notNull().default(0),
  // A class's or own-room group's room; a seated group has none (it uses its host class's).
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

/**
 * One class or group's lesson at a typed time on a set of days. A cell that changes by day is
 * several rows with disjoint days. A seated group (Quran, Arabic) names the class whose room it uses.
 */
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
    hostGroupId: uuid('host_group_id').references(() => routineGroups.id),
    startsAt: smallint('starts_at').notNull(),
    endsAt: smallint('ends_at').notNull(),
    days: smallint('days').array().notNull(),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => routineSubjects.id),
    teacherId: uuid('teacher_id')
      .notNull()
      .references(() => routineTeachers.id),
    taId: uuid('ta_id').references(() => routineTeachers.id),
  },
  (t) => [
    index('routine_assignments_routine_idx').on(t.routineId),
    check('routine_assignments_time_ck', sql`${t.endsAt} > ${t.startsAt} AND ${t.startsAt} >= 0 AND ${t.endsAt} <= 1440`),
    check('routine_assignments_days_ck', sql`cardinality(${t.days}) > 0 AND ${t.days} <@ ARRAY[0,1,2,3,4,5]::smallint[]`),
    check('routine_assignments_ta_ck', sql`${t.taId} IS NULL OR ${t.taId} <> ${t.teacherId}`),
  ],
);

/**
 * What each assignment occupies, one row per day: its group, its teacher and TA, and its room (the
 * row it shows in: its own, or its host class's). The clash guard is an exclusion constraint made in
 * the migration (drizzle can't declare one): two rows of the same routine, day, kind and ref whose
 * times overlap fail, and with them the whole write.
 */
export const routineSlots = pgTable(
  'routine_slots',
  {
    routineId: uuid('routine_id').notNull(),
    startsAt: smallint('starts_at').notNull(),
    endsAt: smallint('ends_at').notNull(),
    day: smallint('day').notNull(),
    // text, not an enum: the exclusion constraint's btree_gist compares it.
    kind: text('kind').$type<'group' | 'teacher' | 'room'>().notNull(),
    refId: uuid('ref_id').notNull(),
    assignmentId: uuid('assignment_id')
      .notNull()
      .references(() => routineAssignments.id, { onDelete: 'cascade' }),
  },
  (t) => [index('routine_slots_assignment_idx').on(t.assignmentId)],
);

export type TimeSpan = { startsAt: number; endsAt: number };

/** A teacher away on a date: the whole day (times NULL) or some times of it. */
export const routineAbsences = pgTable(
  'routine_absences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: date('date').notNull(),
    teacherId: uuid('teacher_id')
      .notNull()
      .references(() => routineTeachers.id),
    times: jsonb('times').$type<TimeSpan[]>(),
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
    // The class's time on the day (empty on old history whose time was lost); a proxy teacher's
    // covers may not overlap (exclusion constraint in the migration).
    startsAt: smallint('starts_at'),
    endsAt: smallint('ends_at'),
    proxyTeacherId: uuid('proxy_teacher_id')
      .notNull()
      .references(() => routineTeachers.id),
    snapshot: jsonb('snapshot').$type<ProxySnapshot>().notNull(),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('routine_proxies_slot_uq').on(t.date, t.assignmentId, t.role),
    index('routine_proxies_date_idx').on(t.date),
  ],
);
