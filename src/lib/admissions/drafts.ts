import 'server-only';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import { checkAll, sanitizeDraft, type AnswerError, type Answers, type FileAnswer } from './answers';
import type { CycleState } from './cycle';
import { loadSnapshot } from './cycle';
import { getAdmissionsDb } from './db';
import { fieldWithRole, type FormSnapshot } from './form-config';
import { normaliseEmail, normaliseMobile } from './normalise';
import { classCodeFor, roleColumns } from './roles';
import { applicationEvents, applications } from './schema';
import { hashToken, newResumeToken } from './tokens';

export type Application = typeof applications.$inferSelect;

/** Statuses in which the guardian may still change answers. */
const EDITABLE = ['draft', 'unpaid'] as const;

export const ownsFile = (applicationId: string) => (f: FileAnswer) => f.key.startsWith(`admissions/${applicationId}/`);

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

/** The application and the form version it was answered against. */
export async function loadWithSnapshot(token: string): Promise<{ app: Application; snapshot: FormSnapshot } | null> {
  const app = await getByToken(token);
  if (!app) return null;
  const snapshot = await loadSnapshot(app.cycleId, app.snapshotVersion);
  return snapshot ? { app, snapshot } : null;
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
  await db
    .update(applications)
    .set(roleColumns(snapshot, row.answers))
    .where(and(eq(applications.id, app.id), inArray(applications.status, [...EDITABLE])));
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
 * Other applications in the cycle for the same child (same guardian mobile and date of birth).
 * Shown as a warning with a link to Find my application; never blocks (twins exist).
 */
export async function findDuplicates(app: Application): Promise<{ publicRef: string | null; studentNameBn: string | null; status: Application['status'] }[]> {
  if (!app.dateOfBirth || !app.primaryMobile) return [];
  return getAdmissionsDb()
    .select({ publicRef: applications.publicRef, studentNameBn: applications.studentNameBn, status: applications.status })
    .from(applications)
    .where(
      and(
        eq(applications.cycleId, app.cycleId),
        eq(applications.primaryMobile, app.primaryMobile),
        eq(applications.dateOfBirth, app.dateOfBirth),
        ne(applications.id, app.id),
      ),
    );
}

export function label(app: Pick<Application, 'publicRef' | 'studentNameBn' | 'primaryMobile'>): string {
  return app.publicRef ?? app.studentNameBn ?? app.primaryMobile;
}

export async function logEvent(applicationId: string, eventLabel: string, kind: string, actor: 'guardian' | 'system' | 'admin', detail?: Record<string, unknown>) {
  await getAdmissionsDb().insert(applicationEvents).values({ applicationId, label: eventLabel, kind, actor, detail });
}
