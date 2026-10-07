import 'server-only';
import { and, eq, sql } from 'drizzle-orm';
import { getAdmissionsDb } from './db';
import type { FormSnapshot } from './form-config';
import { admissionCycles, admissionSnapshots } from './schema';
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
};

export const FORM_QUERY = `*[_type == "preAdmissionForm" && !(_id in path("drafts.**"))][0]{
  _rev, formSettings{ isEnabled }, declarationText, cycle, sections
}`;

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

/** Current cycle from the published form (Sanity, cached like the rest of the site). */
export async function getCurrentCycle(): Promise<CycleState | null> {
  const { sanityFetch } = await import('@/lib/sanity-fetch');
  const doc = await sanityFetch<FormDocument | null>({ query: FORM_QUERY, tags: ['preAdmissionForm'] });
  return syncCycle(doc);
}
