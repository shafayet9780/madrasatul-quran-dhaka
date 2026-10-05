import type { NextRequest } from 'next/server';
import { authorizeRound, rateLimited, json, readBody, requestMeta } from '@/lib/survey/survey-request';
import { saveDraft } from '@/lib/survey/t1';
import { draftRequestSchema } from '@/lib/survey/t1-types';

// Autosave: the client sends changed student rows, debounced.
export async function POST(request: NextRequest, { params }: { params: Promise<{ roundId: string }> }) {
  const limited = await rateLimited(request, 'draft');
  if (limited) return limited;
  const { round, response } = await authorizeRound(request, (await params).roundId);
  if (response) return response;
  const body = await readBody(request, draftRequestSchema);
  if (!body) return json({ reason: 'invalid' }, 400);
  const { rows, ...key } = body;
  const result = await saveDraft(round, key, rows, requestMeta(request));
  return json(result, result.ok ? 200 : result.reason === 'closed' ? 403 : 400);
}
