import type { NextRequest } from 'next/server';
import { authorizeRound, json, readBody } from '@/lib/survey/survey-request';
import { loadBatch } from '@/lib/survey/t1';
import { batchKeySchema } from '@/lib/survey/t1-types';

export async function POST(request: NextRequest, { params }: { params: Promise<{ roundId: string }> }) {
  const { round, response } = await authorizeRound(request, (await params).roundId, { allowGrace: false });
  if (response) return response;
  const body = await readBody(request, batchKeySchema);
  const batch = body && (await loadBatch(round, body));
  return batch ? json(batch) : json({ reason: 'invalid' }, 400);
}
