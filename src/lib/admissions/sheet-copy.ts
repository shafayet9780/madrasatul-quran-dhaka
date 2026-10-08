import 'server-only';
import { and, asc, eq, isNotNull, isNull, lt, or } from 'drizzle-orm';
import { getSheetsClient, sheetsConfigured } from '@/lib/google-sheets-server';
import { loadSnapshot } from './cycle';
import { getAdmissionsDb } from './db';
import { exportHeader, exportRow } from './export-rows';
import { toBengaliDigits } from './normalise';
import { admissionCycles, applications, payments } from './schema';

// Best-effort copy of paid applications to the tab "ভর্তি ২০২৭" of the pre-admission spreadsheet
// (FORM_GOOGLE_SHEETS_ID). One row per application, found by its ID in column A and updated in
// place, so a status change or the evaluation day rewrites the same row. Each application is
// claimed (mirror_claimed_at) before writing, like the survey copy; an admin change clears
// mirrored_at so the application is copied again. The daily job retries what failed.
// Values are written RAW, so answers are never evaluated as formulas.

const CLAIM_TTL_MS = 15 * 60 * 1000;

export const sheetTabName = (session: string) => `ভর্তি ${toBengaliDigits(session)}`;

const isPending = (now: Date) =>
  and(
    isNotNull(applications.publicRef),
    isNull(applications.mirroredAt),
    or(isNull(applications.mirrorClaimedAt), lt(applications.mirrorClaimedAt, new Date(now.getTime() - CLAIM_TTL_MS))),
  );

/** Creates the tab when missing, writes the header (the form may have changed), returns ID → row. */
async function prepareTab(spreadsheetId: string, title: string, header: string[]): Promise<Map<string, number>> {
  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties.title' });
  if (!meta.data.sheets?.some((s) => s.properties?.title === title)) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } } }] } });
  }
  await sheets.spreadsheets.values.update({ spreadsheetId, range: `'${title}'!A1`, valueInputOption: 'RAW', requestBody: { values: [header] } });
  const ids = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${title}'!A:A` });
  const rows = new Map<string, number>();
  (ids.data.values ?? []).forEach((r, i) => {
    if (i > 0 && r[0]) rows.set(String(r[0]), i + 1);
  });
  return rows;
}

/** Copies paid applications not yet in the sheet (new, or changed by the office). */
export async function copyPendingToSheet({ limit = 100, budgetMs = 20_000 }: { limit?: number; budgetMs?: number } = {}) {
  const start = Date.now();
  const spreadsheetId = process.env.FORM_GOOGLE_SHEETS_ID;
  if (!spreadsheetId || !sheetsConfigured()) return { copied: 0, failed: 0, skipped: 'Sheets not configured' as const };
  const db = getAdmissionsDb();
  const pending = await db.select({ id: applications.id, cycleId: applications.cycleId }).from(applications).where(isPending(new Date())).orderBy(asc(applications.paidAt)).limit(limit);
  let copied = 0;
  let failed = 0;
  const tabs = new Map<string, { title: string; rows: Map<string, number>; snapshot: NonNullable<Awaited<ReturnType<typeof loadSnapshot>>> } | null>();

  for (const { id, cycleId } of pending) {
    if (Date.now() - start > budgetMs) break;
    const claimAt = new Date();
    const [app] = await db.update(applications).set({ mirrorClaimedAt: claimAt }).where(and(eq(applications.id, id), isPending(claimAt))).returning();
    if (!app?.publicRef) continue; // Someone else is copying it.
    const ours = and(eq(applications.id, id), eq(applications.mirrorClaimedAt, claimAt));
    try {
      if (!tabs.has(cycleId)) {
        const [cycle] = await db.select().from(admissionCycles).where(eq(admissionCycles.id, cycleId));
        const snapshot = cycle && (await loadSnapshot(cycle.id, cycle.currentVersion));
        if (!cycle || !snapshot) tabs.set(cycleId, null);
        else {
          const title = sheetTabName(cycle.session);
          tabs.set(cycleId, { title, snapshot, rows: await prepareTab(spreadsheetId, title, exportHeader(snapshot)) });
        }
      }
      const tab = tabs.get(cycleId);
      if (!tab) throw new Error('No form snapshot for the cycle');
      const [payment] = await db
        .select()
        .from(payments)
        .where(and(eq(payments.applicationId, id), eq(payments.status, 'valid')))
        .orderBy(asc(payments.completedAt))
        .limit(1);
      const values = [exportRow(tab.snapshot, app, payment ?? null)];
      const sheets = getSheetsClient();
      const row = tab.rows.get(app.publicRef);
      if (row) {
        await sheets.spreadsheets.values.update({ spreadsheetId, range: `'${tab.title}'!A${row}`, valueInputOption: 'RAW', requestBody: { values } });
      } else {
        const res = await sheets.spreadsheets.values.append({ spreadsheetId, range: `'${tab.title}'!A1`, valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS', requestBody: { values } });
        const added = /![A-Z]+(\d+)/.exec(res.data.updates?.updatedRange ?? '');
        if (added) tab.rows.set(app.publicRef, Number(added[1]));
      }
      await db.update(applications).set({ mirroredAt: new Date(), mirrorClaimedAt: null }).where(ours);
      copied++;
    } catch (error) {
      console.error('[admissions] sheet copy failed', id, error instanceof Error ? error.message : error);
      await db.update(applications).set({ mirrorClaimedAt: null }).where(ours);
      failed++;
    }
  }
  return { copied, failed };
}
