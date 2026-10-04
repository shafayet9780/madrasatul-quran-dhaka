import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from './db';
import { surveyAccess } from './round-status';
import { surveyRounds } from './schema';
import type { RequestMeta } from './t1';

type Round = typeof surveyRounds.$inferSelect;

export const SURVEY_KEY_HEADER = 'x-survey-key';

export function keyMatches(given: string | null | undefined, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/**
 * The round behind a survey API call, checked against the link key sent in a header
 * (kept out of URLs and logs). Unknown round and wrong key look the same.
 */
export async function authorizeRound(
  request: NextRequest,
  roundId: string
): Promise<{ round: Round; response?: never } | { round?: never; response: NextResponse }> {
  if (!z.uuid().safeParse(roundId).success) return { response: json({ reason: 'invalid' }, 404) };
  const [round] = await getDb().select().from(surveyRounds).where(eq(surveyRounds.id, roundId)).limit(1);
  if (!round || !keyMatches(request.headers.get(SURVEY_KEY_HEADER), round.linkKey)) {
    return { response: json({ reason: 'invalid' }, 404) };
  }
  const access = surveyAccess(round);
  if (access === 'scheduled' || access === 'closed') return { response: json({ reason: access }, 403) };
  return { round };
}

export async function readBody<T>(request: NextRequest, schema: z.ZodType<T>): Promise<T | null> {
  try {
    const parsed = schema.safeParse(await request.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function requestMeta(request: NextRequest): RequestMeta {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return { ip: forwarded || request.headers.get('x-real-ip'), userAgent: request.headers.get('user-agent')?.slice(0, 300) ?? null };
}
