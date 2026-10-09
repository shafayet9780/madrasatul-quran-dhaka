import { sql } from 'drizzle-orm';
import { bigserial, boolean, check, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { Answers } from './answers';
import type { FormSnapshot } from './form-config';

// Pre-admission 2027 (docs/pre-admission-2027.md). Postgres is the source of truth for applications;
// Sanity only configures the form. Documents live in the private Blob store under
// `admissions/<application id>/`, so ownership checks and deletion need no file table.

const ts = (name: string) => timestamp(name, { withTimezone: true });

export const applicationStatus = pgEnum('application_status', [
  'draft', // started; answers being filled in
  'unpaid', // form complete and declared; application fee not yet paid
  'paid', // fee confirmed by SSLCommerz validation; has an application ID
  'interview',
  'evaluated',
  'admitted',
  'waitlisted',
  'not_selected',
  'sent_to_erp',
]);

export const paymentStatus = pgEnum('payment_status', ['initiated', 'valid', 'failed', 'cancelled', 'held']);

/** One admission session (e.g. 2027). */
export const admissionCycles = pgTable('admission_cycles', {
  id: uuid('id').primaryKey().defaultRandom(),
  session: text('session').notNull().unique(),
  currentVersion: integer('current_version').notNull().default(1),
  openedAt: ts('opened_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

/**
 * Frozen copies of the form. A new version is added whenever the published Sanity form changes;
 * each application keeps the version it was answered against, so old answers always render.
 */
export const admissionSnapshots = pgTable(
  'admission_snapshots',
  {
    cycleId: uuid('cycle_id')
      .notNull()
      .references(() => admissionCycles.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    snapshot: jsonb('snapshot').$type<FormSnapshot>().notNull(),
    sourceRev: text('source_rev'),
    takenAt: ts('taken_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.cycleId, t.version] }), uniqueIndex('admission_snapshots_rev_uq').on(t.cycleId, t.sourceRev)],
);

export const applications = pgTable(
  'applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cycleId: uuid('cycle_id')
      .notNull()
      .references(() => admissionCycles.id),
    snapshotVersion: integer('snapshot_version').notNull(),
    status: applicationStatus('status').notNull().default('draft'),
    locale: text('locale').notNull().default('bengali'),
    /** Hash of the resume token (cookie + emailed link); the token itself is never stored. */
    resumeTokenHash: text('resume_token_hash').notNull().unique(),

    // Copies of role answers, kept in step with `answers` on every save (search, list, ERP export).
    primaryMobile: text('primary_mobile').notNull(),
    email: text('email').notNull(),
    studentNameBn: text('student_name_bn'),
    studentNameEn: text('student_name_en'),
    dateOfBirth: text('date_of_birth'),
    classValue: text('class_value'),
    fatherName: text('father_name'),
    motherName: text('mother_name'),
    secondaryMobile: text('secondary_mobile'),

    answers: jsonb('answers').$type<Answers>().notNull().default({}),
    attribution: jsonb('attribution').$type<Record<string, unknown>>(),
    /** Started with the office's test pass: a 10 taka fee, an ID like TEST-001, no Sheet row, deletable when paid. */
    isTest: boolean('is_test').notNull().default(false),

    /** Application ID, e.g. KG-017: assigned when payment is confirmed. */
    publicRef: text('public_ref'),
    classCode: text('class_code'),
    serial: integer('serial'),

    declaredAt: ts('declared_at'),
    submittedAt: ts('submitted_at'),
    paidAt: ts('paid_at'),
    attendedAt: ts('attended_at'),
    evalFeeReceivedAt: ts('eval_fee_received_at'),

    /** Private Blob key of the generated application PDF. */
    pdfKey: text('pdf_key'),
    confirmationEmailAt: ts('confirmation_email_at'),
    resumeEmailAt: ts('resume_email_at'),
    /** Google Sheet copy, claimed before appending (same pattern as the survey mirror). */
    mirroredAt: ts('mirrored_at'),
    mirrorClaimedAt: ts('mirror_claimed_at'),

    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
    lastActiveAt: ts('last_active_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('applications_ref_uq').on(t.cycleId, t.publicRef),
    index('applications_status_idx').on(t.cycleId, t.status),
    index('applications_mobile_idx').on(t.primaryMobile),
    index('applications_dob_idx').on(t.dateOfBirth),
    index('applications_mirror_idx')
      .on(t.paidAt)
      .where(sql`${t.paidAt} IS NOT NULL AND ${t.mirroredAt} IS NULL`),
    check('applications_paid_has_ref_chk', sql`${t.status} IN ('draft', 'unpaid') OR ${t.publicRef} IS NOT NULL`),
  ],
);

/** Last serial handed out per class in a cycle (KG → 17 means the next is KG-018). */
export const applicationSerials = pgTable(
  'application_serials',
  {
    cycleId: uuid('cycle_id')
      .notNull()
      .references(() => admissionCycles.id, { onDelete: 'cascade' }),
    classCode: text('class_code').notNull(),
    lastSerial: integer('last_serial').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.cycleId, t.classCode] })],
);

/** One row per payment attempt. Only a server-validated attempt marks an application paid. */
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    /** Our transaction ID sent to SSLCommerz (server-generated). */
    tranId: text('tran_id').notNull().unique(),
    amount: integer('amount').notNull(),
    currency: text('currency').notNull().default('BDT'),
    status: paymentStatus('status').notNull().default('initiated'),
    sessionKey: text('session_key'),
    valId: text('val_id'),
    bankTranId: text('bank_tran_id'),
    cardType: text('card_type'),
    riskLevel: text('risk_level'),
    /** The SSLCommerz validation response, kept for disputes and refunds. */
    gatewayResponse: jsonb('gateway_response').$type<Record<string, unknown>>(),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
    completedAt: ts('completed_at'),
  },
  (t) => [
    index('payments_application_idx').on(t.applicationId),
    index('payments_pending_idx')
      .on(t.createdAt)
      .where(sql`${t.status} = 'initiated'`),
  ],
);

/**
 * Activity log, append-only. Rows outlive a deleted application (application_id becomes null;
 * `label` keeps the ID or child's name) so deletions stay on record.
 */
export const applicationEvents = pgTable(
  'application_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'set null' }),
    label: text('label').notNull(),
    kind: text('kind').notNull(),
    actor: text('actor').notNull(),
    detail: jsonb('detail').$type<Record<string, unknown>>(),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('application_events_app_idx').on(t.applicationId, t.createdAt)],
);
