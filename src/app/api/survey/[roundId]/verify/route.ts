import type { NextRequest } from 'next/server';
import { verifyMobile } from '@/lib/survey/guardian';
import { verifyRequestSchema, type VerifyResponse } from '@/lib/survey/guardian-types';
import { normaliseStudentId } from '@/lib/survey/normalise';
import { authorizeRound, json, rateLimited, readBody, valueLimited } from '@/lib/survey/survey-request';

/**
 * Live "verified / unverified" line while the guardian types their mobile. Submit decides again
 * on the server; this only answers yes or no, limited per student so mobiles cannot be guessed.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ roundId: string }> }) {
  const limited = await rateLimited(request, 'guardianLookup');
  if (limited) return limited;
  const { round, response } = await authorizeRound(request, (await params).roundId, { allowGrace: false });
  if (response) return response;
  if (round.kind === 'T1') return json({ reason: 'invalid' }, 404);
  const body = await readBody(request, verifyRequestSchema);
  if (!body) return json({ reason: 'invalid' }, 400);
  const studentErpId = normaliseStudentId(body.studentErpId);
  const valueLimit = await valueLimited(`verify:${studentErpId}`);
  if (valueLimit) return valueLimit;
  return json({ verified: await verifyMobile(studentErpId, body.mobile) } satisfies VerifyResponse);
}
