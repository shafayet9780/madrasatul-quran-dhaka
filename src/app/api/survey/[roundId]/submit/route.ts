import { after, type NextRequest } from 'next/server';
import { authorizeRound, rateLimited, json, readBody, requestMeta } from '@/lib/survey/survey-request';
import { mirrorPending } from '@/lib/survey/sheets-mirror';
import { submitBatch } from '@/lib/survey/t1';
import { submitRequestSchema } from '@/lib/survey/t1-types';

// Headroom for the after-submit Sheet copy (Sheets auth, a new tab, the append).
export const maxDuration = 30;

export async function POST(request: NextRequest, { params }: { params: Promise<{ roundId: string }> }) {
  const limited = await rateLimited(request, 'submit');
  if (limited) return limited;
  const { round, response } = await authorizeRound(request, (await params).roundId);
  if (response) return response;
  const body = await readBody(request, submitRequestSchema);
  if (!body) return json({ reason: 'invalid' }, 400);
  const { acknowledgedDuplicates, ...key } = body;
  const result = await submitBatch(round, key, acknowledgedDuplicates, requestMeta(request));
  // Copy to the Sheet after responding (never fails the submit); the daily job retries failures.
  if (result.ok) after(() => mirrorPending({ roundId: round.id, limit: 20, budgetMs: 15_000 }).catch(() => undefined));
  // Business outcomes (incomplete, duplicate, closed) are 200/409-style answers the client renders.
  return json(result, result.ok ? 200 : result.reason === 'closed' ? 403 : 409);
}
