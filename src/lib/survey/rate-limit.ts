import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb } from './db';

/**
 * Fixed-window counter in Postgres (spec §8): returns false once `limit` requests for `key`
 * happened inside the current window. One upsert per call; no extra service.
 */
export async function allow(key: string, limit: number, windowMs: number, now = new Date()): Promise<boolean> {
  const windowStart = new Date(now.getTime() - windowMs);
  const result = await getDb().execute<{ count: number }>(sql`
    INSERT INTO rate_limits (key, window_start, count) VALUES (${key}, ${now}, 1)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start < ${windowStart} THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE WHEN rate_limits.window_start < ${windowStart} THEN ${now} ELSE rate_limits.window_start END
    RETURNING count
  `);
  return Number(result.rows[0]?.count ?? 0) <= limit;
}

const MINUTE = 60 * 1000;

/**
 * Per-IP budgets for the survey API (a teacher marking a class sends a few dozen autosaves;
 * these only stop scripted abuse). Shared school Wi-Fi is one IP, so the limits are generous.
 */
export const SURVEY_LIMITS = {
  read: { limit: 600, windowMs: 10 * MINUTE },
  // Typing an ERP ID. The school shares one IP, so this allows a staff meeting, not guessing at speed.
  lookup: { limit: 60, windowMs: 10 * MINUTE },
  draft: { limit: 3000, windowMs: 10 * MINUTE },
  submit: { limit: 120, windowMs: 10 * MINUTE },
} as const;

/** Old windows are useless after a day; the daily job removes them. */
export async function pruneRateLimits(now = new Date()) {
  const result = await getDb().execute(sql`DELETE FROM rate_limits WHERE window_start < ${new Date(now.getTime() - 24 * 60 * MINUTE)}`);
  return result.rowCount ?? 0;
}
