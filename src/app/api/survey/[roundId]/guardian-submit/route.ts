import type { NextRequest } from 'next/server';
import { submitGuardian } from '@/lib/survey/guardian';
import { guardianSubmitSchema } from '@/lib/survey/guardian-types';
import { authorizeRound, json, rateLimited, readBody, requestMeta } from '@/lib/survey/survey-request';

/** Submits a guardian's G1/G2 form; allowed in the grace period so a form on screen can still be sent. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ roundId: string }> }) {
  const limited = await rateLimited(request, 'submit');
  if (limited) return limited;
  const { round, response } = await authorizeRound(request, (await params).roundId);
  if (response) return response;
  if (round.kind === 'T1') return json({ reason: 'invalid' }, 404);
  const body = await readBody(request, guardianSubmitSchema);
  if (!body) return json({ ok: false, reason: 'invalid' }, 400);
  const result = await submitGuardian(round, body, requestMeta(request));
  return json(result, result.ok ? 200 : result.reason === 'closed' ? 403 : 422);
}
