import type { NextRequest } from 'next/server';
import { surveyAccess } from '@/lib/survey/round-status';
import { authorizeRound, json, readBody } from '@/lib/survey/survey-request';
import { loadBatch } from '@/lib/survey/t1';
import { batchKeySchema } from '@/lib/survey/t1-types';

export async function POST(request: NextRequest, { params }: { params: Promise<{ roundId: string }> }) {
  const { round, response } = await authorizeRound(request, (await params).roundId);
  if (response) return response;
  const body = await readBody(request, batchKeySchema);
  const batch = body && (await loadBatch(round, body));
  if (!batch) return json({ reason: 'invalid' }, 400);
  // During the grace period a teacher may reopen work already started (e.g. reload on review), not a new class.
  if (batch.status === 'new' && surveyAccess(round) === 'grace') return json({ reason: 'closed' }, 403);
  return json(batch);
}
