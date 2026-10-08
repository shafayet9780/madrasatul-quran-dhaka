import 'server-only';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import { checkAll, sanitizeDraft, type AnswerError, type Answers, type FileAnswer } from './answers';
import type { CycleState } from './cycle';
import { loadSnapshot } from './cycle';
import { getAdmissionsDb } from './db';
import { fieldWithRole, type FormSnapshot } from './form-config';
import { normaliseEmail, normaliseMobile } from './normalise';
import { classCodeFor, roleColumns } from './roles';
import { admissionCycles, applicationEvents, applications } from './schema';
import { hashToken, newResumeToken } from './tokens';
import { isOwnKey } from './files';

export type Application = typeof applications.$inferSelect;

/** Statuses in which the guardian may still change answers. */
const EDITABLE = ['draft', 'unpaid'] as const;

export const ownsFile = (applicationId: string) => (f: FileAnswer) => isOwnKey(applicationId, f.key);

export type StartResult =
  | { ok: true; id: string; token: string }
  | { ok: false; reason: 'closed' } | { ok: false; reason: 'invalid'; errors: { mobile?: 'invalid_mobile'; email?: 'invalid_email' } };

/** Start page: mobile + email create the draft and its resume token. */
export async function createDraft(
  cycle: CycleState,
  input: { mobile: string; email: string; locale: 'bengali' | 'english'; attribution?: Record<string, unknown> },
): Promise<StartResult> {
  if (!cycle.enabled || cycle.window !== 'open') return { ok: false, reason: 'closed' };
  const mobile = normaliseMobile(input.mobile);
  const email = normaliseEmail(input.email);
  if (!mobile || !email) {
    return { ok: false, reason: 'invalid', errors: { ...(!mobile && { mobile: 'invalid_mobile' as const }), ...(!email && { email: 'invalid_email' as const }) } };
  }
  const answers: Answers = {
    [fieldWithRole(cycle.snapshot, 'primaryMobile')!.key]: mobile,
    [fieldWithRole(cycle.snapshot, 'email')!.key]: email,
  };
  const token = newResumeToken();
  const db = getAdmissionsDb();
  const [app] = await db
    .insert(applications)
    .values({
      cycleId: cycle.cycleId,
      snapshotVersion: cycle.version,
      locale: input.locale,
      resumeTokenHash: hashToken(token),
      answers,
      ...roleColumns(cycle.snapshot, answers),
      attribution: input.attribution,
    })
    .returning({ id: applications.id });
  await logEvent(app.id, mobile, 'created', 'guardian');
  return { ok: true, id: app.id, token };
}

export async function getByToken(token: string): Promise<Application | null> {
  const [app] = await getAdmissionsDb().select().from(applications).where(eq(applications.resumeTokenHash, hashToken(token)));
  return app ?? null;
}

/**
 * The application with its form version. A draft (not yet submitted) follows the form as the
 * office changes it: it moves to the cycle's current version when opened, keeping its answers by
 * question key. A submitted or paid application keeps the version it was submitted with.
 */
async function withSnapshot(app: Application): Promise<{ app: Application; snapshot: FormSnapshot } | null> {
  if (app.status === 'draft') {
    const db = getAdmissionsDb();
    const [cycle] = await db.select({ currentVersion: admissionCycles.currentVersion }).from(admissionCycles).where(eq(admissionCycles.id, app.cycleId));
    const latest = cycle && cycle.currentVersion > app.snapshotVersion ? await loadSnapshot(app.cycleId, cycle.currentVersion) : null;
    if (cycle && latest) {
      const [moved] = await db
        .update(applications)
        .set({ snapshotVersion: cycle.currentVersion, ...roleColumns(latest, app.answers), updatedAt: new Date() })
        .where(and(eq(applications.id, app.id), eq(applications.status, 'draft'), eq(applications.snapshotVersion, app.snapshotVersion)))
        .returning();
      if (moved) return { app: moved, snapshot: latest };
    }
  }
  const snapshot = await loadSnapshot(app.cycleId, app.snapshotVersion);
  return snapshot ? { app, snapshot } : null;
}

export async function loadWithSnapshot(token: string): Promise<{ app: Application; snapshot: FormSnapshot } | null> {
  const app = await getByToken(token);
  return app ? withSnapshot(app) : null;
}

export async function loadById(id: string): Promise<{ app: Application; snapshot: FormSnapshot } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [app] = await getAdmissionsDb().select().from(applications).where(eq(applications.id, id));
  return app ? withSnapshot(app) : null;
}

/**
 * Find my application: applications in the cycle with this ID or guardian mobile, and the child's
 * date of birth (both must match, so a phone number alone reveals nothing).
 */
export async function findApplications(cycleId: string, by: { publicRef: string } | { mobile: string }, dateOfBirth: string): Promise<Application[]> {
  return getAdmissionsDb()
    .select()
    .from(applications)
    .where(
      and(
        eq(applications.cycleId, cycleId),
        eq(applications.dateOfBirth, dateOfBirth),
        'publicRef' in by ? eq(applications.publicRef, by.publicRef) : eq(applications.primaryMobile, by.mobile),
      ),
    )
    .orderBy(applications.createdAt)
    .limit(10);
}

export type SaveResult = { ok: true; answers: Answers; status: Application['status'] } | { ok: false; reason: 'locked' | 'not_found' };

/**
 * Autosave. Merges the changed keys into the stored answers in one statement (concurrent saves of
 * different fields never lose each other), removes keys sent as null/empty, then refreshes the role
 * columns. Editing after the declaration sends the application back to draft.
 */
export async function saveDraft(app: Application, snapshot: FormSnapshot, patch: Record<string, unknown>): Promise<SaveResult> {
  if (!(EDITABLE as readonly string[]).includes(app.status)) return { ok: false, reason: 'locked' };
  const set = sanitizeDraft(snapshot, patch, ownsFile(app.id));
  const removed = Object.keys(patch).filter((k) => !(k in set) && (patch[k] == null || patch[k] === '' || (Array.isArray(patch[k]) && (patch[k] as unknown[]).length === 0)));
  const db = getAdmissionsDb();
  const rows = await db.execute<{ answers: Answers; status: Application['status'] }>(sql`
    UPDATE applications SET
      answers = (answers - ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(removed)}::jsonb))) || ${JSON.stringify(set)}::jsonb,
      status = 'draft',
      declared_at = NULL,
      submitted_at = NULL,
      last_active_at = now(),
      updated_at = now()
    WHERE id = ${app.id} AND status IN ('draft', 'unpaid')
    RETURNING answers, status`);
  const row = rows.rows[0];
  if (!row) return { ok: false, reason: 'locked' };
  // Only while the answers are still the ones this save produced: with overlapping saves, the last
  // one to write the answers also writes the columns.
  await db
    .update(applications)
    .set(roleColumns(snapshot, row.answers))
    .where(and(eq(applications.id, app.id), inArray(applications.status, [...EDITABLE]), sql`${applications.answers} = ${JSON.stringify(row.answers)}::jsonb`));
  if (app.status === 'unpaid') await logEvent(app.id, label(app), 'reopened', 'guardian');
  return { ok: true, answers: row.answers, status: row.status };
}

export type SubmitResult =
  | { ok: true; classCode: string }
  | { ok: false; reason: 'locked' | 'declaration' }
  | { ok: false; reason: 'invalid'; errors: Record<string, AnswerError> };

/** Review page: the whole form is checked, the declaration recorded, and the clean answers stored. */
export async function submitDraft(app: Application, snapshot: FormSnapshot, declared: boolean): Promise<SubmitResult> {
  if (!(EDITABLE as readonly string[]).includes(app.status)) return { ok: false, reason: 'locked' };
  if (!declared) return { ok: false, reason: 'declaration' };
  const { errors, values } = checkAll(snapshot, app.answers);
  if (Object.keys(errors).length) return { ok: false, reason: 'invalid', errors };
  const classCode = classCodeFor(snapshot, values);
  if (!classCode) return { ok: false, reason: 'invalid', errors: { [fieldWithRole(snapshot, 'classApplied')!.key]: 'required' } };
  const db = getAdmissionsDb();
  const [updated] = await db
    .update(applications)
    .set({
      answers: values,
      ...roleColumns(snapshot, values),
      classCode,
      status: 'unpaid',
      declaredAt: new Date(),
      submittedAt: new Date(),
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(applications.id, app.id), inArray(applications.status, [...EDITABLE])))
    .returning({ id: applications.id });
  if (!updated) return { ok: false, reason: 'locked' };
  await logEvent(app.id, label(app), 'submitted', 'guardian');
  return { ok: true, classCode };
}

/**
 * How many other applications in the cycle use this guardian mobile (shown on the review page as a
 * gentle "did you already apply?" note). Deliberately not by date of birth and without IDs: the
 * mobile is typed freely, so matching on the child's date of birth would let anyone test dates
 * against someone else's number, and date of birth is what guards Find my application.
 */
export async function countOtherApplications(app: Application): Promise<number> {
  if (!app.primaryMobile) return 0;
  const [row] = await getAdmissionsDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(applications)
    .where(and(eq(applications.cycleId, app.cycleId), eq(applications.primaryMobile, app.primaryMobile), ne(applications.id, app.id)));
  return row?.n ?? 0;
}

export function label(app: Pick<Application, 'publicRef' | 'studentNameBn' | 'primaryMobile'>): string {
  return app.publicRef ?? app.studentNameBn ?? app.primaryMobile;
}

export async function logEvent(applicationId: string | null, eventLabel: string, kind: string, actor: 'guardian' | 'system' | 'admin', detail?: Record<string, unknown>) {
  await getAdmissionsDb().insert(applicationEvents).values({ applicationId, label: eventLabel, kind, actor, detail });
}
