import 'server-only';
import { del, list, put } from '@vercel/blob';
import { getDb } from './db';
import { answerItems, importRuns, responses, students, submissions, surveyRounds } from './schema';

const PREFIX = 'survey-backups/';
const KEEP = 30;

/**
 * Nightly JSON copy of every survey table to a private Vercel Blob store (the Neon free plan only
 * keeps 6 hours of history). Student data never goes to the site's public store, so this needs its
 * own private store, connected with the env prefix PG_BACKUP_BLOB. Keeps the latest 30 days.
 */
export async function backupSurveyTables(now = new Date()) {
  const token = process.env.PG_BACKUP_BLOB_READ_WRITE_TOKEN;
  if (!token) return { skipped: 'PG_BACKUP_BLOB_READ_WRITE_TOKEN is not set (private Blob store)' as const };
  const db = getDb();
  const [studentRows, roundRows, submissionRows, responseRows, itemRows, importRows] = await Promise.all([
    db.select().from(students),
    db.select().from(surveyRounds),
    db.select().from(submissions),
    db.select().from(responses),
    db.select().from(answerItems),
    db.select().from(importRuns),
  ]);
  const body = JSON.stringify({
    takenAt: now.toISOString(),
    tables: {
      students: studentRows,
      survey_rounds: roundRows,
      submissions: submissionRows,
      responses: responseRows,
      answer_items: itemRows,
      import_runs: importRows,
    },
  });
  const pathname = `${PREFIX}${now.toISOString().slice(0, 10)}.json`;
  await put(pathname, body, { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, token });

  const { blobs } = await list({ prefix: PREFIX, limit: 1000, token });
  const old = blobs
    .sort((a, b) => b.pathname.localeCompare(a.pathname))
    .slice(KEEP)
    .map((b) => b.url);
  if (old.length) await del(old, { token });
  return { pathname, bytes: body.length, removed: old.length };
}
