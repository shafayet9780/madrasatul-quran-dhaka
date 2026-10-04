import type { NextRequest } from 'next/server';
import { authorizeRound, json, readBody, requestMeta } from '@/lib/survey/survey-request';
import { submitBatch } from '@/lib/survey/t1';
import { submitRequestSchema } from '@/lib/survey/t1-types';

export async function POST(request: NextRequest, { params }: { params: Promise<{ roundId: string }> }) {
  const { round, response } = await authorizeRound(request, (await params).roundId);
  if (response) return response;
  const body = await readBody(request, submitRequestSchema);
  if (!body) return json({ reason: 'invalid' }, 400);
  const { acknowledgedDuplicates, ...key } = body;
  const result = await submitBatch(round, key, acknowledgedDuplicates, requestMeta(request));
  // Business outcomes (incomplete, duplicate, closed) are 200/409-style answers the client renders.
  return json(result, result.ok ? 200 : result.reason === 'closed' ? 403 : 409);
}
