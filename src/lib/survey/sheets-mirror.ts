import 'server-only';
import { and, asc, eq, isNull, lt, or } from 'drizzle-orm';
import { getSheetsClient, sheetsConfigured } from '@/lib/google-sheets-server';
import { getDb } from './db';
import { responses, submissions, surveyRounds } from './schema';
import { guardianSheetHeader, guardianSheetRows, t1SheetHeader, t1SheetRows } from './sheet-rows';

// Best-effort copy of submitted batches to the "Survey Responses" sheet (SURVEY_SHEET_ID).
// A submission is claimed (mirror_claimed_at) before appending, so the after-submit copy and the
// daily retry never append it twice. Success sets mirrored_at only if the claim is still ours: a
// status change meanwhile clears both columns (REQUEUE_MIRROR), so the new status is copied too.
// A failed append releases the claim; a claim left by a killed function expires after 15 minutes.
// Values are written RAW, so text is never evaluated as a formula.

const CLAIM_TTL_MS = 15 * 60 * 1000;

const isPending = (now: Date) =>
  and(
    eq(submissions.status, 'submitted'),
    isNull(submissions.mirroredAt),
    or(isNull(submissions.mirrorClaimedAt), lt(submissions.mirrorClaimedAt, new Date(now.getTime() - CLAIM_TTL_MS)))
  );

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
  const claimAt = new Date();
  const [claimed] = await db
    .update(submissions)
    .set({ mirrorClaimedAt: claimAt })
    .where(and(eq(submissions.id, submissionId), isPending(claimAt)))
    .returning();
  if (!claimed) return true; // Someone else is copying it.
  const ours = and(eq(submissions.id, submissionId), eq(submissions.mirrorClaimedAt, claimAt));
  try {
    const [[round], rows, replacement] = await Promise.all([
      db.select().from(surveyRounds).where(eq(surveyRounds.id, claimed.roundId)),
      db.select().from(responses).where(eq(responses.submissionId, claimed.id)),
      claimed.supersededBy && claimed.kind === 'T1'
        ? db.select({ teacherKey: submissions.teacherKey }).from(submissions).where(eq(submissions.id, claimed.supersededBy))
        : Promise.resolve([]),
    ]);
    const title = tabName(round.slug);
    let values: (string | number)[][];
    if (claimed.kind === 'T1') {
      const setAside = Boolean(replacement[0] && replacement[0].teacherKey !== claimed.teacherKey);
      await ensureTab(spreadsheetId, title, t1SheetHeader(round.snapshot), knownTabs);
      values = t1SheetRows(round.snapshot, { ...claimed, submittedAt: claimed.submittedAt!, setAside }, rows);
    } else {
      // A guardian form has one response (one child).
      await ensureTab(spreadsheetId, title, guardianSheetHeader(round.snapshot), knownTabs);
      values = rows.flatMap((row) => guardianSheetRows(round.snapshot, { ...claimed, submittedAt: claimed.submittedAt! }, row));
    }
    // A withdrawn by-level batch has no students: nothing to append (the earlier batch is re-copied as replaced).
    if (values.length) {
      await getSheetsClient().spreadsheets.values.append({
        spreadsheetId,
        range: `'${title}'!A1`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values },
      });
    }
    await db.update(submissions).set({ mirroredAt: new Date(), mirrorClaimedAt: null }).where(ours);
    return true;
  } catch (error) {
    console.error('[survey] sheet copy failed', submissionId, error instanceof Error ? error.message : error);
    await db.update(submissions).set({ mirrorClaimedAt: null }).where(ours);
    return false;
  }
}

/** Copies submitted batches not yet in the sheet (new, or whose status changed). */
export async function mirrorPending({ roundId, limit = 200, budgetMs = 40_000 }: { roundId?: string; limit?: number; budgetMs?: number } = {}) {
  const start = Date.now();
  const spreadsheetId = process.env.SURVEY_SHEET_ID;
  if (!spreadsheetId || !sheetsConfigured()) return { mirrored: 0, failed: 0, skipped: 'Sheets not configured' as const };
  const pending = await getDb()
    .select({ id: submissions.id })
    .from(submissions)
    .where(and(isPending(new Date()), roundId ? eq(submissions.roundId, roundId) : undefined))
    .orderBy(asc(submissions.submittedAt))
    .limit(limit);
  const knownTabs = new Set<string>();
  let mirrored = 0;
  let failed = 0;
  // One at a time keeps the order in the sheet and stays inside the Sheets write quota.
  for (const { id } of pending) {
    // Stay inside the function's time limit; the rest is copied on the next run.
    if (Date.now() - start > budgetMs) break;
    if (await mirrorOne(spreadsheetId, id, knownTabs)) mirrored++;
    else failed++;
  }
  return { mirrored, failed };
}
