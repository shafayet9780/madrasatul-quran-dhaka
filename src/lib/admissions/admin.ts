import 'server-only';
import { and, desc, eq, ilike, inArray, isNotNull, isNull, or, sql, type SQL } from 'drizzle-orm';
import type { ApplicationStatus } from './admin-labels';
import type { FileAnswer } from './answers';
import { loadSnapshot } from './cycle';
import { getAdmissionsDb } from './db';
import { label, logEvent, type Application } from './drafts';
import type { FormSnapshot } from './form-config';
import { parseApplicationId } from './ids';
import { normaliseMobile, toAsciiDigits } from './normalise';
import { admissionCycles, applicationEvents, applications, payments } from './schema';
import { blobStore, type BlobStore } from './uploads';
import { isOwnKey } from './files';

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

export async function listApplications(cycleId: string, params: ListParams): Promise<{ rows: ListRow[]; total: number }> {
  const db = getAdmissionsDb();
  const pageSize = params.pageSize ?? 25;
  const page = Math.max(1, params.page ?? 1);
  const where = and(
    eq(applications.cycleId, cycleId),
    params.tab === 'paid' ? isNotNull(applications.publicRef) : isNull(applications.publicRef),
    params.classCode ? eq(applications.classCode, params.classCode) : undefined,
    params.status ? eq(applications.status, params.status) : undefined,
    params.evalFee === 'yes' ? isNotNull(applications.evalFeeReceivedAt) : params.evalFee === 'no' ? isNull(applications.evalFeeReceivedAt) : undefined,
    params.q ? searchCondition(params.q, params.classCodes ?? []) : undefined,
  );
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

/** Evaluation day switches: attendance and the evaluation fee (with the receipt number). */
export async function setEvaluationDay(id: string, field: 'attended' | 'evalFee', on: boolean, receiptNo?: string): Promise<boolean> {
  const db = getAdmissionsDb();
  const column = field === 'attended' ? { attendedAt: on ? new Date() : null } : { evalFeeReceivedAt: on ? new Date() : null };
  const [row] = await db
    .update(applications)
    .set({ ...column, updatedAt: new Date(), mirroredAt: null, mirrorClaimedAt: null })
    .where(and(eq(applications.id, id), isNotNull(applications.publicRef)))
    .returning({ publicRef: applications.publicRef });
  if (!row) return false;
  const kind = field === 'attended' ? (on ? 'attended' : 'attended_undone') : on ? 'eval_fee' : 'eval_fee_undone';
  await logEvent(id, row.publicRef ?? id, kind, 'admin', receiptNo ? { receiptNo: receiptNo.slice(0, 40) } : undefined);
  return true;
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
 */
export async function deleteUnpaid(id: string, store: BlobStore = blobStore()): Promise<'deleted' | 'not_found' | 'paid' | 'paying'> {
  const db = getAdmissionsDb();
  const [app] = await db.select().from(applications).where(eq(applications.id, id));
  if (!app) return 'not_found';
  if (app.publicRef) return 'paid';
  const [open] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.applicationId, id), eq(payments.status, 'initiated'), sql`${payments.createdAt} > now() - interval '2 hours'`))
    .limit(1);
  if (open) return 'paying';
  // One statement decides: no ID and no settled or held payment at the moment of deletion.
  const [gone] = await db
    .delete(applications)
    .where(
      and(
        eq(applications.id, id),
        isNull(applications.publicRef),
        sql`NOT EXISTS (SELECT 1 FROM payments p WHERE p.application_id = ${id} AND p.status IN ('valid', 'held'))`,
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
  heardFrom: { value: string; count: number }[];
  recent: { id: string; publicRef: string | null; studentNameBn: string | null; paidAt: Date | null }[];
};

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
    heardFromKey
      ? db
          .select({ value: sql<string>`coalesce(${applications.answers} ->> ${heardFromKey}, '')`, count: sql<number>`count(*)::int` })
          .from(applications)
          .where(paid)
          .groupBy(sql`1`)
          .orderBy(sql`2 DESC`)
      : Promise.resolve([]),
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
