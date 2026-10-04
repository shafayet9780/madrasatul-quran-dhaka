import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from './db';
import { allow, SURVEY_LIMITS } from './rate-limit';
import { surveyAccess } from './round-status';
import { surveyRounds } from './schema';
import type { RequestMeta } from './t1';
import { SURVEY_KEY_HEADER } from './t1-types';

type Round = typeof surveyRounds.$inferSelect;

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
  roundId: string,
  /** Grace after closing only lets someone finish: save and submit, not open a class. */
  { allowGrace = true }: { allowGrace?: boolean } = {}
): Promise<{ round: Round; response?: never } | { round?: never; response: NextResponse }> {
  if (!z.uuid().safeParse(roundId).success) return { response: json({ reason: 'invalid' }, 404) };
  const [round] = await getDb().select().from(surveyRounds).where(eq(surveyRounds.id, roundId)).limit(1);
  if (!round || !keyMatches(request.headers.get(SURVEY_KEY_HEADER), round.linkKey)) {
    return { response: json({ reason: 'invalid' }, 404) };
  }
  const access = surveyAccess(round);
  if (access === 'scheduled' || access === 'closed' || (access === 'grace' && !allowGrace)) {
    return { response: json({ reason: access === 'grace' ? 'closed' : access }, 403) };
  }
  return { round };
}

/** 429 when this IP has used up its budget for the action (spec §8), else null. */
export async function rateLimited(request: NextRequest, action: keyof typeof SURVEY_LIMITS): Promise<NextResponse | null> {
  const { limit, windowMs } = SURVEY_LIMITS[action];
  const ip = requestMeta(request).ip ?? 'unknown';
  return (await allow(`survey:${action}:${ip}`, limit, windowMs)) ? null : json({ reason: 'rate-limited' }, 429);
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
