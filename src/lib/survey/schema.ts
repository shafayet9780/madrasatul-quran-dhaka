import { sql } from 'drizzle-orm';
import {
  bigserial,
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import type { RoundSnapshot } from './snapshot';

// Convention: a class without sections uses section_key '' (never NULL), so
// unique indexes over class + section behave without NULLS NOT DISTINCT.
// subject_key is '' where a row has no subject (G2).

export const surveyKind = pgEnum('survey_kind', ['T1', 'G1', 'G2']);
export const submissionStatus = pgEnum('submission_status', ['draft', 'submitted']);

const ts = (name: string) => timestamp(name, { withTimezone: true });

/** Current roster, upserted from the ERP export by erp_id; never deleted. */
export const students = pgTable(
  'students',
  {
    erpId: text('erp_id').primaryKey(),
    name: text('name').notNull(),
    classKey: text('class_key').notNull(),
    sectionKey: text('section_key').notNull().default(''),
    roll: integer('roll'),
    fatherName: text('father_name'),
    fatherMobile: text('father_mobile'),
    motherMobile: text('mother_mobile'),
    active: boolean('active').notNull().default(true),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('students_class_idx').on(t.classKey, t.sectionKey),
    index('students_father_mobile_idx').on(t.fatherMobile),
    index('students_mother_mobile_idx').on(t.motherMobile),
  ]
);

/** A round opened from Sanity. The snapshot is the source of truth once opened. */
export const surveyRounds = pgTable('survey_rounds', {
  id: uuid('id').primaryKey().defaultRandom(),
  sanityRoundId: text('sanity_round_id').notNull().unique(),
  kind: surveyKind('kind').notNull(),
  slug: text('slug').notNull().unique(),
  label: text('label').notNull(),
  snapshot: jsonb('snapshot').$type<RoundSnapshot>().notNull(),
  opensAt: ts('opens_at').notNull(),
  closesAt: ts('closes_at').notNull(),
  linkKey: text('link_key').notNull(),
  openedAt: ts('opened_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

/** One guardian form (G1/G2) or one teacher class batch (T1). Submitted rows are immutable. */
export const submissions = pgTable(
  'submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roundId: uuid('round_id')
      .notNull()
      .references(() => surveyRounds.id),
    kind: surveyKind('kind').notNull(),
    status: submissionStatus('status').notNull().default('draft'),
    supersededBy: uuid('superseded_by').references((): AnyPgColumn => submissions.id),
    duplicateFlag: boolean('duplicate_flag').notNull().default(false),
    receiptToken: text('receipt_token').unique(),
    submitterName: text('submitter_name'),
    submitterRelation: text('submitter_relation'),
    submitterMobile: text('submitter_mobile'),
    verified: boolean('verified'),
    teacherKey: text('teacher_key'),
    teacherName: text('teacher_name'),
    classKey: text('class_key').notNull(),
    sectionKey: text('section_key').notNull().default(''),
    subjectKey: text('subject_key').notNull().default(''),
    subjectName: text('subject_name'),
    comment: text('comment'),
    clientIp: text('client_ip'),
    userAgent: text('user_agent'),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
    submittedAt: ts('submitted_at'),
    mirroredAt: ts('mirrored_at'),
  },
  (t) => [
    index('submissions_round_idx').on(t.roundId, t.status),
    // One open draft per teacher batch, so autosave can upsert.
    uniqueIndex('submissions_t1_draft_uq')
      .on(t.roundId, t.teacherKey, t.classKey, t.sectionKey, t.subjectKey)
      .where(sql`${t.kind} = 'T1' AND ${t.status} = 'draft'`),
    // One current submitted batch per teacher + class-section + subject.
    uniqueIndex('submissions_t1_current_uq')
      .on(t.roundId, t.teacherKey, t.classKey, t.sectionKey, t.subjectKey)
      .where(sql`${t.kind} = 'T1' AND ${t.status} = 'submitted' AND ${t.supersededBy} IS NULL`),
    index('submissions_unmirrored_idx')
      .on(t.submittedAt)
      .where(sql`${t.status} = 'submitted' AND ${t.mirroredAt} IS NULL`),
    // NULL teacher keys would slip past the T1 unique indexes.
    check('submissions_t1_teacher_chk', sql`${t.kind} <> 'T1' OR ${t.teacherKey} IS NOT NULL`),
  ]
);

/**
 * One row per student in a submission, with a snapshot of the student at the time.
 * round/kind/teacher/subject are copied from the submission so the current-response
 * rule can be a partial unique index; is_current is set on submit and cleared on supersede.
 */
export const responses = pgTable(
  'responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    roundId: uuid('round_id')
      .notNull()
      .references(() => surveyRounds.id),
    kind: surveyKind('kind').notNull(),
    teacherKey: text('teacher_key'),
    subjectKey: text('subject_key').notNull().default(''),
    studentErpId: text('student_erp_id')
      .notNull()
      .references(() => students.erpId),
    studentName: text('student_name').notNull(),
    classKey: text('class_key').notNull(),
    sectionKey: text('section_key').notNull().default(''),
    roll: integer('roll'),
    // T1: {questionKey: mark} · G1: {questionKey: {subjectKey: mark | 'na'}} · G2: {questionKey: optionKey}
    answers: jsonb('answers').$type<Record<string, unknown>>().notNull().default({}),
    note: text('note'),
    isCurrent: boolean('is_current').notNull().default(false),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('responses_submission_student_uq').on(t.submissionId, t.studentErpId),
    uniqueIndex('responses_guardian_current_uq')
      .on(t.roundId, t.studentErpId)
      .where(sql`${t.isCurrent} AND ${t.kind} <> 'T1'`),
    uniqueIndex('responses_t1_current_uq')
      .on(t.roundId, t.teacherKey, t.subjectKey, t.studentErpId)
      .where(sql`${t.isCurrent} AND ${t.kind} = 'T1'`),
    index('responses_student_idx').on(t.studentErpId),
    check('responses_t1_teacher_chk', sql`${t.kind} <> 'T1' OR ${t.teacherKey} IS NOT NULL`),
  ]
);

/**
 * Flat answer rows for reports, written on submit for the current submissions only
 * (rows of a superseded submission are deleted in the same batch).
 */
export const answerItems = pgTable(
  'answer_items',
  {
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    responseId: uuid('response_id')
      .notNull()
      .references(() => responses.id, { onDelete: 'cascade' }),
    roundId: uuid('round_id')
      .notNull()
      .references(() => surveyRounds.id),
    kind: surveyKind('kind').notNull(),
    teacherKey: text('teacher_key'),
    studentErpId: text('student_erp_id').notNull(),
    classKey: text('class_key').notNull(),
    sectionKey: text('section_key').notNull().default(''),
    subjectKey: text('subject_key').notNull().default(''),
    questionKey: text('question_key').notNull(),
    areaKey: text('area_key').notNull(),
    optionKey: text('option_key'),
    mark: numeric('mark', { precision: 3, scale: 1, mode: 'number' }),
    isNa: boolean('is_na').notNull().default(false),
  },
  (t) => [
    primaryKey({ columns: [t.responseId, t.questionKey, t.subjectKey] }),
    index('answer_items_round_idx').on(t.roundId, t.kind, t.classKey),
    index('answer_items_student_idx').on(t.studentErpId, t.roundId),
    index('answer_items_teacher_idx').on(t.roundId, t.teacherKey),
  ]
);

/** Fixed-window counters keyed by action + IP or action + looked-up value. */
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  windowStart: ts('window_start').notNull(),
  count: integer('count').notNull(),
});

export const importRuns = pgTable('import_runs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  fileName: text('file_name').notNull(),
  status: text('status', { enum: ['dry_run', 'applied'] }).notNull(),
  summary: jsonb('summary').$type<Record<string, number>>().notNull(),
  problems: jsonb('problems').$type<unknown[]>().notNull().default([]),
  createdAt: ts('created_at').notNull().defaultNow(),
  appliedAt: ts('applied_at'),
});
