import 'server-only';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { getSheetsClient, sheetsConfigured } from '@/lib/google-sheets-server';
import { getDb } from './db';
import { responses, submissions, surveyRounds } from './schema';
import { t1SheetHeader, t1SheetRows } from './sheet-rows';

// Best-effort copy of submitted batches to the "Survey Responses" sheet (SURVEY_SHEET_ID).
// A submission is claimed by setting mirrored_at before appending, so the after-submit copy and
// the daily retry never append it twice; a failed append releases the claim for the next retry.

/** Sheet tab names cannot contain []*?/\: and are limited to 100 characters. */
function tabName(slug: string) {
  return slug.replace(/[[\]*?/\\:]/g, '-').slice(0, 100);
}

async function ensureTab(spreadsheetId: string, title: string, header: string[], known: Set<string>) {
  if (known.has(title)) return;
  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties.title' });
  for (const sheet of meta.data.sheets ?? []) if (sheet.properties?.title) known.add(sheet.properties.title);
  if (known.has(title)) return;
  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } } }] } });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${title}'!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [header] },
  });
  known.add(title);
}

async function mirrorOne(spreadsheetId: string, submissionId: string, knownTabs: Set<string>): Promise<boolean> {
  const db = getDb();
  const [claimed] = await db
    .update(submissions)
    .set({ mirroredAt: new Date() })
    .where(and(eq(submissions.id, submissionId), isNull(submissions.mirroredAt)))
    .returning();
  if (!claimed) return true; // Someone else is copying it.
  try {
    const [[round], rows] = await Promise.all([
      db.select().from(surveyRounds).where(eq(surveyRounds.id, claimed.roundId)),
      db.select().from(responses).where(eq(responses.submissionId, claimed.id)),
    ]);
    if (claimed.kind !== 'T1') return true; // Guardian surveys get their own layout in phase 2.
    const title = tabName(round.slug);
    await ensureTab(spreadsheetId, title, t1SheetHeader(round.snapshot), knownTabs);
    await getSheetsClient().spreadsheets.values.append({
      spreadsheetId,
      range: `'${title}'!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: t1SheetRows(round.snapshot, { ...claimed, submittedAt: claimed.submittedAt! }, rows) },
    });
    return true;
  } catch (error) {
    console.error('[survey] sheet copy failed', submissionId, error instanceof Error ? error.message : error);
    await db.update(submissions).set({ mirroredAt: null }).where(eq(submissions.id, submissionId));
    return false;
  }
}

/** Copies submitted batches not yet in the sheet (new, or whose status changed). */
export async function mirrorPending({ roundId, limit = 200 }: { roundId?: string; limit?: number } = {}) {
  const spreadsheetId = process.env.SURVEY_SHEET_ID;
  if (!spreadsheetId || !sheetsConfigured()) return { mirrored: 0, failed: 0, skipped: 'Sheets not configured' as const };
  const pending = await getDb()
    .select({ id: submissions.id })
    .from(submissions)
    .where(and(eq(submissions.status, 'submitted'), isNull(submissions.mirroredAt), roundId ? eq(submissions.roundId, roundId) : undefined))
    .orderBy(asc(submissions.submittedAt))
    .limit(limit);
  const knownTabs = new Set<string>();
  let mirrored = 0;
  let failed = 0;
  // One at a time keeps the order in the sheet and stays inside the Sheets write quota.
  for (const { id } of pending) {
    if (await mirrorOne(spreadsheetId, id, knownTabs)) mirrored++;
    else failed++;
  }
  return { mirrored, failed };
}
