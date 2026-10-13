import 'server-only';
import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { getAdmissionsDb } from './db';
import { localOverrides } from './local';
import { classesAcrossVersions, type FormOption, type FormSnapshot } from './form-config';
import { admissionCycles, admissionSnapshots, applicationSerials, applications } from './schema';
import { hasTestPass } from './test-pass';
import { FormConfigError, buildSnapshot, cycleWindow, type CycleWindow, type FormDocument } from './snapshot';

export type CycleState = {
  cycleId: string;
  session: string;
  version: number;
  snapshot: FormSnapshot;
  /** The Studio on/off switch (Form Settings → Enable Form). */
  enabled: boolean;
  window: CycleWindow;
  /** Problems in the published form that kept it from replacing the current version. */
  problems: string[];
  /** Opened for this device by the office's test pass (test-pass.ts). */
  testPass?: boolean;
};

// Transport routes and charges (Fees & Discounts) are frozen with the form.
const FEES = '{ _rev, transport, transportRoutes }';

export const FORM_QUERY = `*[_type == "preAdmissionForm" && !(_id in path("drafts.**"))][0]{
  _rev, formSettings{ isEnabled }, declarationText, cycle, sections,
  "fees": *[_id == "feeSettings"][0]${FEES}
}`;

/**
 * Class codes that read an application ID: the current form's (closed classes included) and every
 * code that has given an ID this cycle, so a class since taken out of the form still works.
 */
export async function idClassCodes(cycleId: string, current: FormSnapshot): Promise<string[]> {
  const issued = await getAdmissionsDb().select({ code: applicationSerials.classCode }).from(applicationSerials).where(eq(applicationSerials.cycleId, cycleId));
  return [...new Set([...classesAcrossVersions([current]).map((o) => o.code!), ...issued.map((r) => r.code)])];
}

/**
 * Every class of the cycle with its label: the current form's, then a class since taken out of the
 * form that gave an ID, labelled as in the newest version that had it. For the admin filters and chart.
 */
export async function cycleClasses(cycleId: string, current: FormSnapshot): Promise<FormOption[]> {
  const [codes, answered] = await Promise.all([idClassCodes(cycleId, current), loadAnsweredSnapshots(cycleId)]);
  const older = [...answered].sort(([a], [b]) => b - a).map(([, snapshot]) => snapshot);
  const keep = new Set(codes);
  return classesAcrossVersions([current, ...older]).filter((o) => keep.has(o.code!));
}

/**
 * Keeps the cycle's frozen form in step with the published Sanity document: a valid new revision
 * becomes the next version; an invalid one is reported and the last good version stays in use.
 * Concurrent requests may both try to add a version; the unique (cycle, revision) and primary key
 * make the loser a no-op.
 */
export async function syncCycle(doc: FormDocument | null, now: Date = new Date()): Promise<CycleState | null> {
  if (!doc) return null;
  const db = getAdmissionsDb();
  let snapshot: FormSnapshot | null = null;
  let problems: string[] = [];
  try {
    snapshot = buildSnapshot(doc, now);
  } catch (e) {
    if (!(e instanceof FormConfigError)) throw e;
    problems = e.problems;
  }

  const session = snapshot?.settings.session ?? doc.cycle?.session;
  if (!session) return null;

  let [cycle] = await db.select().from(admissionCycles).where(eq(admissionCycles.session, session));
  if (!cycle) {
    await db.insert(admissionCycles).values({ session, currentVersion: 0 }).onConflictDoNothing();
    [cycle] = await db.select().from(admissionCycles).where(eq(admissionCycles.session, session));
  }

  if (snapshot) {
    const [known] = await db
      .select({ version: admissionSnapshots.version })
      .from(admissionSnapshots)
      .where(and(eq(admissionSnapshots.cycleId, cycle.id), eq(admissionSnapshots.sourceRev, snapshot.sourceRev ?? '')));
    if (!known) {
      await db.execute(sql`
        INSERT INTO admission_snapshots (cycle_id, version, snapshot, source_rev)
        SELECT ${cycle.id}, COALESCE(MAX(version), 0) + 1, ${JSON.stringify(snapshot)}::jsonb, ${snapshot.sourceRev ?? ''}
        FROM admission_snapshots WHERE cycle_id = ${cycle.id}
        ON CONFLICT DO NOTHING`);
      await db.execute(sql`
        UPDATE admission_cycles SET
          current_version = (SELECT MAX(version) FROM admission_snapshots WHERE cycle_id = ${cycle.id}),
          updated_at = now()
        WHERE id = ${cycle.id}`);
    }
  }

  const [current] = await db
    .select()
    .from(admissionSnapshots)
    .where(eq(admissionSnapshots.cycleId, cycle.id))
    .orderBy(sql`${admissionSnapshots.version} DESC`)
    .limit(1);
  if (!current) return null;

  return {
    cycleId: cycle.id,
    session,
    version: current.version,
    snapshot: current.snapshot,
    enabled: !!doc.formSettings?.isEnabled,
    window: cycleWindow(current.snapshot.settings, now),
    problems,
  };
}

/** The form version an application was answered against. */
export async function loadSnapshot(cycleId: string, version: number): Promise<FormSnapshot | null> {
  const [row] = await getAdmissionsDb()
    .select({ snapshot: admissionSnapshots.snapshot })
    .from(admissionSnapshots)
    .where(and(eq(admissionSnapshots.cycleId, cycleId), eq(admissionSnapshots.version, version)));
  return row?.snapshot ?? null;
}

/** The current version and every version a submitted application was answered against (export columns). */
export async function loadAnsweredSnapshots(cycleId: string): Promise<Map<number, FormSnapshot>> {
  const db = getAdmissionsDb();
  const [cycle, used] = await Promise.all([
    db.select({ version: admissionCycles.currentVersion }).from(admissionCycles).where(eq(admissionCycles.id, cycleId)),
    db
      .selectDistinct({ version: applications.snapshotVersion })
      .from(applications)
      .where(and(eq(applications.cycleId, cycleId), isNotNull(applications.publicRef))),
  ]);
  const versions = [...new Set([...cycle, ...used].map((r) => r.version))];
  if (!versions.length) return new Map();
  const rows = await db
    .select({ version: admissionSnapshots.version, snapshot: admissionSnapshots.snapshot })
    .from(admissionSnapshots)
    .where(and(eq(admissionSnapshots.cycleId, cycleId), inArray(admissionSnapshots.version, versions)));
  return new Map(rows.map((r) => [r.version, r.snapshot]));
}

/**
 * The Studio draft of the form when there is one, else the published form. The Studio creates the
 * document with a random ID, so the draft is found as drafts.<published ID>.
 */
const DRAFT_FORM_QUERY = `*[_type == "preAdmissionForm" && !(_id in path("drafts.**"))][0]{
  "doc": coalesce(*[_id == "drafts." + ^._id][0], @){
    _rev, formSettings{ isEnabled }, declarationText, cycle, sections,
    "fees": coalesce(*[_id == "drafts.feeSettings"][0], *[_id == "feeSettings"][0])${FEES}
  }
}.doc`;

/**
 * Preview deployments only (ADMISSIONS_PREVIEW_DRAFT=1 on a Vercel preview): the form is read
 * from the Studio draft and is always open, so the 2027 flow can be tested without publishing the
 * form or switching it on. Production and previews share the Sanity dataset, so publishing or the
 * Enable switch would change the live site. Never applies in production.
 */
export function previewDraftMode(env: Record<string, string | undefined> = process.env): boolean {
  return env.ADMISSIONS_PREVIEW_DRAFT === '1' && env.VERCEL_ENV === 'preview';
}

/** Current cycle from the published form (Sanity, cached like the rest of the site). */
export async function getCurrentCycle(): Promise<CycleState | null> {
  const state = await loadCurrentCycle();
  return state && (await hasTestPass()) ? { ...state, enabled: true, window: 'open', testPass: true } : state;
}

async function loadCurrentCycle(): Promise<CycleState | null> {
  const local = localOverrides();
  if (local) return syncCycle(local.form);
  if (previewDraftMode()) {
    const { previewClient } = await import('@/lib/sanity');
    const doc = await previewClient.withConfig({ perspective: 'raw' }).fetch<FormDocument | null>(DRAFT_FORM_QUERY, {}, { cache: 'no-store' });
    const state = await syncCycle(doc);
    return state && { ...state, enabled: true, window: 'open' };
  }
  const { sanityFetch } = await import('@/lib/sanity-fetch');
  const doc = await sanityFetch<FormDocument | null>({ query: FORM_QUERY, tags: ['preAdmissionForm', 'feeSettings'] });
  return syncCycle(doc);
}
