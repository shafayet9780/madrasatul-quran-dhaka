import 'server-only';
import { and, desc, eq, ilike, inArray, isNotNull, isNull, or, sql, type SQL } from 'drizzle-orm';
import type { ApplicationStatus } from './admin-labels';
import type { FileAnswer } from './answers';
import { cycleClasses, loadSnapshot } from './cycle';
import { getAdmissionsDb } from './db';
import { evalReceiptRef } from './admin-labels';
import { label, logEvent, type Application } from './drafts';
import { NO_ROUTE, type FormSnapshot } from './form-config';
import { parseApplicationId } from './ids';
import { normaliseMobile, toAsciiDigits } from './normalise';
import { admissionCycles, applicationEvents, applications, payments } from './schema';
import { blobStore, type BlobStore } from './uploads';
import { isOwnKey } from './files';
import type { StopCount } from './transport';

// Admin queries and changes for /admin/admissions. Every server action that calls a change here
// first calls assertAdmin() (src/app/admin/admissions/actions.ts).

export type AdminCycle = { cycleId: string; session: string; snapshot: FormSnapshot };

/** The latest cycle and its current form version (works even when the form is unpublished). */
export async function adminCycle(): Promise<AdminCycle | null> {
  const db = getAdmissionsDb();
  const [cycle] = await db.select().from(admissionCycles).orderBy(desc(admissionCycles.session)).limit(1);
  if (!cycle || !cycle.currentVersion) return null;
  const snapshot = await loadSnapshot(cycle.id, cycle.currentVersion);
  return snapshot ? { cycleId: cycle.id, session: cycle.session, snapshot } : null;
}

export type ListTab = 'paid' | 'unpaid';
export type ListParams = {
  tab: ListTab;
  q?: string;
  classCode?: string;
  status?: ApplicationStatus;
  evalFee?: 'yes' | 'no';
  page?: number;
  pageSize?: number;
  classCodes?: string[];
  /** Transport: the stop question's key and the chosen filter (transportFilter). */
  transport?: { key: string; filter: { routes: string[] } | { kind: 'none' | 'no' } };
};
export type ListRow = Pick<
  Application,
  | 'id'
  | 'publicRef'
  | 'status'
  | 'studentNameBn'
  | 'studentNameEn'
  | 'dateOfBirth'
  | 'classCode'
  | 'classValue'
  | 'primaryMobile'
  | 'paidAt'
  | 'attendedAt'
  | 'evalFeeReceivedAt'
  | 'lastActiveAt'
  | 'answers'
  | 'snapshotVersion'
> & { paymentAttempts: number; lastPaymentStatus: string | null };

/** Search box: an application ID, a mobile number (any part), or a name in Bengali or English. */
function searchCondition(q: string, classCodes: string[]): SQL | undefined {
  const text = toAsciiDigits(q).trim();
  if (!text) return undefined;
  const id = parseApplicationId(text, classCodes);
  if (id) return eq(applications.publicRef, id);
  const compactId = text.toUpperCase().replace(/\s+/g, '');
  const digits = text.replace(/\D/g, '');
  const mobile = normaliseMobile(text);
  const like = `%${text.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  return or(
    ilike(applications.publicRef, `%${compactId}%`),
    ilike(applications.studentNameBn, like),
    ilike(applications.studentNameEn, like),
    ...(mobile ? [eq(applications.primaryMobile, mobile)] : digits.length >= 4 ? [ilike(applications.primaryMobile, `%${digits.replace(/^0/, '')}%`)] : []),
  );
}

/**
 * A submitted application keeps only the answers it showed, so the stop answer alone tells: a
 * `route:stop` value, "none" (not on any route), or nothing (no transport).
 */
function transportCondition(key: string, filter: NonNullable<ListParams['transport']>['filter']): SQL | undefined {
  const stop = sql`${applications.answers} ->> ${key}`;
  if ('kind' in filter) return filter.kind === 'none' ? sql`${stop} = ${NO_ROUTE}` : sql`${stop} IS NULL`;
  return filter.routes.length ? and(sql`${stop} LIKE '%:%'`, inArray(sql`split_part(${stop}, ':', 1)`, filter.routes)) : sql`false`;
}

function listWhere(cycleId: string, params: ListParams): SQL | undefined {
  return and(
    eq(applications.cycleId, cycleId),
    params.tab === 'paid' ? isNotNull(applications.publicRef) : isNull(applications.publicRef),
    params.classCode ? eq(applications.classCode, params.classCode) : undefined,
    params.status ? eq(applications.status, params.status) : undefined,
    params.evalFee === 'yes' ? isNotNull(applications.evalFeeReceivedAt) : params.evalFee === 'no' ? isNull(applications.evalFeeReceivedAt) : undefined,
    params.q ? searchCondition(params.q, params.classCodes ?? []) : undefined,
    params.transport ? transportCondition(params.transport.key, params.transport.filter) : undefined,
  );
}

export async function listApplications(cycleId: string, params: ListParams): Promise<{ rows: ListRow[]; total: number }> {
  const db = getAdmissionsDb();
  const pageSize = params.pageSize ?? 25;
  const page = Math.max(1, params.page ?? 1);
  const where = listWhere(cycleId, params);
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(applications).where(where);
  const rows = await db
    .select({
      id: applications.id,
      publicRef: applications.publicRef,
      status: applications.status,
      studentNameBn: applications.studentNameBn,
      studentNameEn: applications.studentNameEn,
      dateOfBirth: applications.dateOfBirth,
      classCode: applications.classCode,
      classValue: applications.classValue,
      primaryMobile: applications.primaryMobile,
      paidAt: applications.paidAt,
      attendedAt: applications.attendedAt,
      evalFeeReceivedAt: applications.evalFeeReceivedAt,
      lastActiveAt: applications.lastActiveAt,
      answers: applications.answers,
      snapshotVersion: applications.snapshotVersion,
      paymentAttempts: sql<number>`(SELECT count(*)::int FROM payments p WHERE p.application_id = "applications"."id")`,
      lastPaymentStatus: sql<string | null>`(SELECT p.status::text FROM payments p WHERE p.application_id = "applications"."id" ORDER BY p.created_at DESC LIMIT 1)`,
    })
    .from(applications)
    .where(where)
    .orderBy(...(params.tab === 'paid' ? [desc(applications.paidAt), desc(applications.id)] : [desc(applications.lastActiveAt)]))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return { rows, total };
}

/**
 * The paid applications a bulk receipt print covers (the list's filters, tests left out): how many,
 * and the first `limit` ids (none with limit 0, for the list's button).
 */
export async function receiptTargets(cycleId: string, params: ListParams, limit: number): Promise<{ ids: string[]; total: number }> {
  const db = getAdmissionsDb();
  const where = and(listWhere(cycleId, { ...params, tab: 'paid' }), eq(applications.isTest, false));
  const [[{ total }], rows] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int` }).from(applications).where(where),
    limit ? db.select({ id: applications.id }).from(applications).where(where).limit(limit) : Promise.resolve([]),
  ]);
  return { ids: rows.map((r) => r.id), total };
}

export async function applicationCounts(cycleId: string): Promise<{ paid: number; unpaid: number }> {
  const [row] = await getAdmissionsDb()
    .select({
      paid: sql<number>`count(*) FILTER (WHERE ${applications.publicRef} IS NOT NULL)::int`,
      unpaid: sql<number>`count(*) FILTER (WHERE ${applications.publicRef} IS NULL)::int`,
    })
    .from(applications)
    .where(eq(applications.cycleId, cycleId));
  return row ?? { paid: 0, unpaid: 0 };
}

export async function applicationDetail(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = getAdmissionsDb();
  const [app] = await db.select().from(applications).where(eq(applications.id, id));
  if (!app) return null;
  const [snapshot, paymentRows, events] = await Promise.all([
    loadSnapshot(app.cycleId, app.snapshotVersion),
    db.select().from(payments).where(eq(payments.applicationId, id)).orderBy(desc(payments.createdAt)),
    db.select().from(applicationEvents).where(eq(applicationEvents.applicationId, id)).orderBy(desc(applicationEvents.createdAt), desc(applicationEvents.id)).limit(100),
  ]);
  return snapshot ? { app, snapshot, payments: paymentRows, events } : null;
}

/** Bulk or single status change on paid applications (unpaid ones have no pipeline yet). */
export async function setStatuses(ids: string[], status: ApplicationStatus): Promise<number> {
  if (!ids.length) return 0;
  const db = getAdmissionsDb();
  const changed = await db
    .update(applications)
    .set({ status, updatedAt: new Date(), mirroredAt: null, mirrorClaimedAt: null })
    .where(and(inArray(applications.id, ids), isNotNull(applications.publicRef), sql`${applications.status} <> ${status}`))
    .returning({ id: applications.id, publicRef: applications.publicRef });
  for (const row of changed) await logEvent(row.id, row.publicRef ?? row.id, 'status', 'admin', { status });
  return changed.length;
}

/**
 * Evaluation day switches: attendance and the evaluation fee. The first time the fee is marked
 * received, the application gets the cycle's next receipt number unless it has one already (from
 * receipts printed in advance); it keeps it if the fee is switched off and on again, so no number
 * is lost or given twice. Test applications get no number.
 */
export async function setEvaluationDay(id: string, field: 'attended' | 'evalFee', on: boolean): Promise<boolean> {
  const db = getAdmissionsDb();
  const column = field === 'attended' ? { attendedAt: on ? new Date() : null } : { evalFeeReceivedAt: on ? new Date() : null };
  const [row] = await db
    .update(applications)
    .set({ ...column, updatedAt: new Date(), mirroredAt: null, mirrorClaimedAt: null })
    .where(and(eq(applications.id, id), isNotNull(applications.publicRef)))
    .returning({ publicRef: applications.publicRef, cycleId: applications.cycleId });
  if (!row) return false;
  if (field === 'evalFee' && on) await assignEvalReceipts(row.cycleId, [id]);
  const receipt = field === 'evalFee' && on ? await evalReceiptOf(id) : null;
  const kind = field === 'attended' ? (on ? 'attended' : 'attended_undone') : on ? 'eval_fee' : 'eval_fee_undone';
  await logEvent(id, row.publicRef ?? id, kind, 'admin', receipt ? { receiptNo: receipt } : undefined);
  return true;
}

const idList = (ids: string[]) => sql.join(ids.map((id) => sql`${id}`), sql`, `);

/**
 * Gives receipt numbers to the paid applications among `ids` that have none (tests excepted), in
 * class order (`classOrder`: class codes in the form's order) then ID, in one statement: the cycle
 * row lock keeps numbers unique and gapless.
 */
export async function assignEvalReceipts(cycleId: string, ids: string[], classOrder: string[] = []): Promise<void> {
  if (!ids.length) return;
  const order = classOrder.length ? sql`array_position(ARRAY[${sql.join(classOrder.map((c) => sql`${c}`), sql`, `)}]::text[], class_code), ` : sql``;
  await getAdmissionsDb().execute(sql`
    WITH locked AS (
      SELECT id, class_code, serial FROM applications
      WHERE cycle_id = ${cycleId} AND id IN (${idList(ids)}) AND public_ref IS NOT NULL AND NOT is_test AND eval_receipt_no IS NULL
      FOR UPDATE
    ), numbered AS (
      SELECT id, row_number() OVER (ORDER BY ${order}class_code, serial, id) AS n FROM locked
    ), bump AS (
      UPDATE admission_cycles c SET last_eval_receipt = c.last_eval_receipt + (SELECT count(*) FROM locked)
      WHERE c.id = ${cycleId} AND EXISTS (SELECT 1 FROM locked)
      RETURNING c.last_eval_receipt - (SELECT count(*) FROM locked) AS base
    )
    UPDATE applications a SET eval_receipt_no = bump.base + numbered.n FROM numbered, bump WHERE a.id = numbered.id`);
}

/** The application's receipt number as printed ("2027/001"), or null. */
async function evalReceiptOf(id: string): Promise<string | null> {
  const [row] = await getAdmissionsDb()
    .select({ no: applications.evalReceiptNo, session: admissionCycles.session })
    .from(applications)
    .innerJoin(admissionCycles, eq(admissionCycles.id, applications.cycleId))
    .where(eq(applications.id, id));
  return row?.no ? evalReceiptRef(row.session, row.no) : null;
}

/**
 * A print of assessment fee receipts (the print button): applications among `ids` without a number
 * get one now (class order of their cycle's form, then ID), then the print is recorded. Only
 * applications whose fee was received or that have a number are printed. The first print of each
 * is the original; the result lists those printed before (duplicates) and every printed number. A
 * receipt printed with the fee received keeps that date from then on (eval_receipt_date), so
 * switching the fee off and on again does not change it.
 */
export async function printReceipts(ids: string[]): Promise<{ printed: string[]; duplicates: string[]; numbers: Record<string, string> }> {
  if (!ids.length) return { printed: [], duplicates: [], numbers: {} };
  const db = getAdmissionsDb();
  const cycles = await db
    .selectDistinct({ id: admissionCycles.id, version: admissionCycles.currentVersion })
    .from(applications)
    .innerJoin(admissionCycles, eq(admissionCycles.id, applications.cycleId))
    .where(inArray(applications.id, ids));
  for (const cycle of cycles) {
    const snapshot = await loadSnapshot(cycle.id, cycle.version);
    const order = snapshot ? (await cycleClasses(cycle.id, snapshot)).map((o) => o.code!) : [];
    await assignEvalReceipts(cycle.id, ids, order);
  }
  const result = await db.execute<{ id: string; public_ref: string; eval_receipt_no: number | null; session: string; first: unknown }>(sql`
    WITH old AS (
      SELECT id, eval_receipt_printed_at AS first FROM applications
      WHERE id IN (${idList(ids)}) AND public_ref IS NOT NULL AND (eval_fee_received_at IS NOT NULL OR eval_receipt_no IS NOT NULL)
      FOR UPDATE
    )
    UPDATE applications a SET
      eval_receipt_printed_at = coalesce(old.first, now()),
      eval_receipt_date = coalesce(a.eval_receipt_date, a.eval_fee_received_at)
    FROM old, admission_cycles c
    WHERE a.id = old.id AND c.id = a.cycle_id
    RETURNING a.id, a.public_ref, a.eval_receipt_no, c.session, old.first`);
  const rows = result.rows;
  const numbers = Object.fromEntries(rows.filter((r) => r.eval_receipt_no).map((r) => [r.id, evalReceiptRef(r.session, r.eval_receipt_no!)]));
  if (rows.length) {
    await db.insert(applicationEvents).values(
      rows.map((r) => ({
        applicationId: r.id,
        label: r.public_ref,
        kind: 'eval_receipt_printed',
        actor: 'admin',
        detail: { duplicate: !!r.first, ...(numbers[r.id] ? { receiptNo: numbers[r.id] } : {}) },
      })),
    );
  }
  return { printed: rows.map((r) => r.id), duplicates: rows.filter((r) => r.first).map((r) => r.id), numbers };
}

/**
 * "Print again, same copy" right after a print (a jam, a cancelled dialog): nothing changes, the
 * print is only logged. Applications never printed are ignored.
 */
export async function logReceiptReprint(ids: string[]): Promise<number> {
  if (!ids.length) return 0;
  const db = getAdmissionsDb();
  const rows = await db
    .select({ id: applications.id, publicRef: applications.publicRef, no: applications.evalReceiptNo, session: admissionCycles.session })
    .from(applications)
    .innerJoin(admissionCycles, eq(admissionCycles.id, applications.cycleId))
    .where(and(inArray(applications.id, ids), isNotNull(applications.evalReceiptPrintedAt)));
  if (rows.length) {
    await db.insert(applicationEvents).values(
      rows.map((r) => ({
        applicationId: r.id,
        label: r.publicRef ?? r.id,
        kind: 'eval_receipt_printed',
        actor: 'admin',
        detail: { again: true, ...(r.no ? { receiptNo: evalReceiptRef(r.session, r.no) } : {}) },
      })),
    );
  }
  return rows.length;
}

/** Paid applications for receipts, in class order (as assignEvalReceipts) then ID. */
export async function receiptApplications(cycleId: string, ids: string[], classOrder: string[] = []): Promise<Application[]> {
  if (!ids.length) return [];
  const rows = await getAdmissionsDb()
    .select()
    .from(applications)
    .where(and(eq(applications.cycleId, cycleId), inArray(applications.id, ids), isNotNull(applications.publicRef)))
    .orderBy(applications.classCode, applications.serial, applications.id);
  const rank = (code: string | null) => (classOrder.indexOf(code ?? '') + 1 || classOrder.length + 1);
  return rows.sort((a, b) => rank(a.classCode) - rank(b.classCode));
}

export async function addNote(id: string, text: string): Promise<boolean> {
  const note = text.trim().slice(0, 2000);
  if (!note) return false;
  const [app] = await getAdmissionsDb().select().from(applications).where(eq(applications.id, id));
  if (!app) return false;
  await logEvent(id, label(app), 'note', 'admin', { text: note });
  return true;
}

/**
 * Deletes an application that was never paid: its answers, uploaded documents and payment
 * attempts. The activity log keeps a "deleted" entry (application_id becomes null). Refused while
 * a payment is settled, held, or still open on the SSLCommerz page (less than two hours old).
 * A test application (the office's test pass) can always be deleted, paid or not.
 */
export async function deleteUnpaid(id: string, store: BlobStore = blobStore()): Promise<'deleted' | 'not_found' | 'paid' | 'paying'> {
  const db = getAdmissionsDb();
  const [app] = await db.select().from(applications).where(eq(applications.id, id));
  if (!app) return 'not_found';
  if (!app.isTest) {
    if (app.publicRef) return 'paid';
    const [open] = await db
      .select({ id: payments.id })
      .from(payments)
      .where(and(eq(payments.applicationId, id), eq(payments.status, 'initiated'), sql`${payments.createdAt} > now() - interval '2 hours'`))
      .limit(1);
    if (open) return 'paying';
  }
  // One statement decides: a test, or no ID and no settled or held payment at the moment of deletion.
  const [gone] = await db
    .delete(applications)
    .where(
      and(
        eq(applications.id, id),
        or(
          eq(applications.isTest, true),
          and(isNull(applications.publicRef), sql`NOT EXISTS (SELECT 1 FROM payments p WHERE p.application_id = ${id} AND p.status IN ('valid', 'held'))`),
        ),
      ),
    )
    .returning({ id: applications.id });
  if (!gone) return 'paid';
  await logEvent(null, label(app), 'deleted', 'admin', { mobile: app.primaryMobile, student: app.studentNameBn });
  // Files go after the row, so a payment that won the race keeps its documents.
  const files = Object.values(app.answers).filter((v): v is FileAnswer => !!v && typeof v === 'object' && !Array.isArray(v) && typeof (v as FileAnswer).key === 'string');
  for (const f of files) if (isOwnKey(id, f.key)) await store.del(f.key).catch(() => {});
  if (app.pdfKey) await store.del(app.pdfKey).catch(() => {});
  return 'deleted';
}

export type Overview = {
  paid: number;
  unpaid: number;
  drafts: number;
  attended: number;
  evalFees: number;
  byClass: { classCode: string; count: number }[];
  byDay: { day: string; count: number }[];
  /** Per way they heard: applications started (any status) and paid. */
  heardFrom: { value: string; started: number; paid: number }[];
  recent: { id: string; publicRef: string | null; studentNameBn: string | null; paidAt: Date | null }[];
};

/**
 * How many applications chose each way they heard (asked on the start page, so drafts count too), and how many of
 * them paid; most paid first. A multiple-choice answer counts once per ticked option; a single answer from before the
 * question allowed several counts as itself; no answer counts as '' (last of its count).
 */
function heardFromCounts(inCycle: SQL, key: string) {
  const db = getAdmissionsDb();
  const answer = sql`${applications.answers} -> ${key}`;
  const each = db
    .select({
      paid: sql<boolean>`${applications.publicRef} IS NOT NULL`.as('paid'),
      value: sql<string>`jsonb_array_elements_text(CASE jsonb_typeof(${answer}) WHEN 'array' THEN ${answer} WHEN 'string' THEN jsonb_build_array(${answer}) ELSE '[""]'::jsonb END)`.as('value'),
    })
    .from(applications)
    .where(inCycle)
    .as('each');
  return db
    .select({ value: each.value, started: sql<number>`count(*)::int`, paid: sql<number>`count(*) FILTER (WHERE ${each.paid})::int` })
    .from(each)
    .groupBy(each.value)
    .orderBy(sql`3 DESC`, sql`2 DESC`, sql`${each.value} = ''`, each.value);
}

export async function overview(cycleId: string, heardFromKey: string | null): Promise<Overview> {
  const db = getAdmissionsDb();
  const inCycle = eq(applications.cycleId, cycleId);
  const paid = and(inCycle, isNotNull(applications.publicRef));
  const [[totals], byClass, byDay, heardFrom, recent] = await Promise.all([
    db
      .select({
        paid: sql<number>`count(*) FILTER (WHERE ${applications.publicRef} IS NOT NULL)::int`,
        unpaid: sql<number>`count(*) FILTER (WHERE ${applications.publicRef} IS NULL AND ${applications.status} = 'unpaid')::int`,
        drafts: sql<number>`count(*) FILTER (WHERE ${applications.status} = 'draft')::int`,
        attended: sql<number>`count(*) FILTER (WHERE ${applications.attendedAt} IS NOT NULL)::int`,
        evalFees: sql<number>`count(*) FILTER (WHERE ${applications.evalFeeReceivedAt} IS NOT NULL)::int`,
      })
      .from(applications)
      .where(inCycle),
    db
      .select({ classCode: sql<string>`coalesce(${applications.classCode}, '')`, count: sql<number>`count(*)::int` })
      .from(applications)
      .where(paid)
      .groupBy(applications.classCode),
    db
      .select({ day: sql<string>`to_char(${applications.paidAt} AT TIME ZONE 'Asia/Dhaka', 'YYYY-MM-DD')`, count: sql<number>`count(*)::int` })
      .from(applications)
      .where(paid)
      .groupBy(sql`1`)
      .orderBy(sql`1`),
    heardFromKey ? heardFromCounts(inCycle, heardFromKey) : Promise.resolve([]),
    db
      .select({ id: applications.id, publicRef: applications.publicRef, studentNameBn: applications.studentNameBn, paidAt: applications.paidAt })
      .from(applications)
      .where(paid)
      .orderBy(desc(applications.paidAt))
      .limit(6),
  ]);
  return { ...(totals ?? { paid: 0, unpaid: 0, drafts: 0, attended: 0, evalFees: 0 }), byClass, byDay, heardFrom, recent };
}

/** Evaluation day page: an application by its ID, for typing it in. */
export async function byPublicRef(cycleId: string, publicRef: string): Promise<string | null> {
  const [row] = await getAdmissionsDb()
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.cycleId, cycleId), eq(applications.publicRef, publicRef)));
  return row?.id ?? null;
}

/** Evaluation day page: who has been marked attended today (Dhaka time). */
export async function attendedToday(cycleId: string) {
  return getAdmissionsDb()
    .select({ id: applications.id, publicRef: applications.publicRef, studentNameBn: applications.studentNameBn, attendedAt: applications.attendedAt, evalFeeReceivedAt: applications.evalFeeReceivedAt })
    .from(applications)
    .where(and(eq(applications.cycleId, cycleId), sql`(${applications.attendedAt} AT TIME ZONE 'Asia/Dhaka')::date = (now() AT TIME ZONE 'Asia/Dhaka')::date`))
    .orderBy(desc(applications.attendedAt))
    .limit(100);
}

export type AdmissionsNav = { session: string; paid: number; unpaid: number } | null;

/** Sidebar counts for the admissions module; null when there is no cycle or no database. */
export async function admissionsNav(): Promise<AdmissionsNav> {
  try {
    const cycle = await adminCycle();
    if (!cycle) return null;
    return { session: cycle.session, ...(await applicationCounts(cycle.cycleId)) };
  } catch (error) {
    console.error('Admissions sidebar data failed', error);
    return null;
  }
}

/** Paid applications by transport stop answer and status, for the overview (transportSummary). */
export async function transportCounts(cycleId: string, key: string): Promise<StopCount[]> {
  const value = sql<string | null>`${applications.answers} ->> ${key}`;
  return getAdmissionsDb()
    .select({ value, status: sql<string>`${applications.status}::text`, count: sql<number>`count(*)::int` })
    .from(applications)
    .where(and(eq(applications.cycleId, cycleId), isNotNull(applications.publicRef)))
    .groupBy(sql`1`, sql`2`);
}

/** The areas typed in by guardians not on any route, most asked first (trimmed, case kept). */
export async function transportAreas(cycleId: string, stopKey: string, areaKey: string): Promise<{ area: string; count: number }[]> {
  const area = sql<string>`trim(${applications.answers} ->> ${areaKey})`;
  return getAdmissionsDb()
    .select({ area, count: sql<number>`count(*)::int` })
    .from(applications)
    .where(and(eq(applications.cycleId, cycleId), isNotNull(applications.publicRef), sql`${applications.answers} ->> ${stopKey} = ${NO_ROUTE}`))
    .groupBy(sql`1`)
    .orderBy(sql`2 DESC`, sql`1`);
}
