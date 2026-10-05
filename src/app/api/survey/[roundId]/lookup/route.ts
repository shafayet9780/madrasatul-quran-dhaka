import type { NextRequest } from 'next/server';
import { lookupChildren } from '@/lib/survey/guardian';
import { lookupValue } from '@/lib/survey/guardian-logic';
import { lookupRequestSchema, type LookupResponse } from '@/lib/survey/guardian-types';
import { authorizeRound, json, rateLimited, readBody, requestMeta, valueLimited } from '@/lib/survey/survey-request';

/**
 * A guardian finds their child by student ID or a parent's mobile, only within the chosen
 * class-section. Returns names and rolls only; "no such ID" and "ID in another class" look the same.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ roundId: string }> }) {
  const limited = await rateLimited(request, 'guardianLookup');
  if (limited) return limited;
  const { round, response } = await authorizeRound(request, (await params).roundId, { allowGrace: false });
  if (response) return response;
  if (round.kind === 'T1') return json({ reason: 'invalid' }, 404);
  const body = await readBody(request, lookupRequestSchema);
  const cls = body && round.snapshot.classes.find((c) => c.key === body.classKey);
  const sectionOk = cls && (cls.sections.length ? cls.sections.some((s) => s.key === body!.sectionKey) : body!.sectionKey === '');
  if (!body || !sectionOk) return json({ reason: 'invalid' }, 400);

  const value = lookupValue(body.by, body.value);
  if (!value) return json({ children: [] } satisfies LookupResponse);
  const valueLimit = await valueLimited(value);
  if (valueLimit) return valueLimit;
  const children = await lookupChildren(round, { ...body, value }, requestMeta(request).ip);
  return json({ children } satisfies LookupResponse);
}
