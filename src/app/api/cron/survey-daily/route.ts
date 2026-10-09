import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCleanupRequest } from '@/lib/downloads/cleanup';
import { retryConfirmationEmails } from '@/lib/admissions/mail';
import { reconcilePending } from '@/lib/admissions/payments';
import { copyPendingToSheet } from '@/lib/admissions/sheet-copy';
import { getSiteUrl } from '@/lib/site-url';
import { backupSurveyTables } from '@/lib/survey/backup';
import { pruneDryRuns } from '@/lib/survey/erp-import-server';
import { pruneLookups } from '@/lib/survey/guardian';
import { pruneRateLimits } from '@/lib/survey/rate-limit';
import { mirrorPending } from '@/lib/survey/sheets-mirror';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Daily (vercel.json): retry Sheet copies that failed, back up the survey tables to Blob,
// settle admission fee payments whose browser never came back, retry confirmation emails, and drop import dry runs and
// rate-limit windows older than a day. (Hobby allows two cron jobs, so admissions share this one.)
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Scheduled jobs are not configured' }, { status: 503 });
  if (!isAuthorizedCleanupRequest(request.headers.get('authorization'), secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result: Record<string, unknown> = {};
  let ok = true;
  // In production an unconfigured copy or backup must show as a failed run, not a quiet success.
  const production = process.env.VERCEL_ENV === 'production';
  // Backup first: it must not be cut off by a long Sheet backlog. The Sheet retry then gets a
  // budget that leaves room inside the 60 s limit.
  try {
    result.backup = await backupSurveyTables();
    if (production && 'skipped' in (result.backup as object)) ok = false;
  } catch (error) {
    ok = false;
    result.backup = { error: error instanceof Error ? error.message : 'failed' };
  }
  try {
    result.sheet = await mirrorPending({ budgetMs: 15_000 });
    if (production && 'skipped' in (result.sheet as object)) ok = false;
  } catch (error) {
    ok = false;
    result.sheet = { error: error instanceof Error ? error.message : 'failed' };
  }
  // Admissions: each step has its own budget and its own error, so one slow or failing step does
  // not hide the others or push the run past the time limit.
  const paidNow: string[] = [];
  try {
    result.admissionsPayments = await reconcilePending(30, 40, undefined, 10_000, (id) => paidNow.push(id));
  } catch (error) {
    ok = false;
    result.admissionsPayments = { error: error instanceof Error ? error.message : 'failed' };
  }
  try {
    result.admissionsEmails = await retryConfirmationEmails(getSiteUrl(), 10_000, undefined, paidNow);
  } catch (error) {
    ok = false;
    result.admissionsEmails = { error: error instanceof Error ? error.message : 'failed' };
  }
  try {
    result.admissionsSheet = await copyPendingToSheet({ budgetMs: 6_000 });
  } catch (error) {
    ok = false;
    result.admissionsSheet = { error: error instanceof Error ? error.message : 'failed' };
  }
  try {
    result.prunedDryRuns = await pruneDryRuns();
    result.prunedRateLimits = await pruneRateLimits();
    result.prunedLookups = await pruneLookups();
  } catch (error) {
    ok = false;
    result.prunedDryRuns = { error: error instanceof Error ? error.message : 'failed' };
  }
  return NextResponse.json(result, { status: ok ? 200 : 500 });
}
