import type { NextRequest } from 'next/server';
import { authorizeRound, json, readBody } from '@/lib/survey/survey-request';
import { teacherOverview } from '@/lib/survey/t1';
import { overviewRequestSchema } from '@/lib/survey/t1-types';

export async function POST(request: NextRequest, { params }: { params: Promise<{ roundId: string }> }) {
  const { round, response } = await authorizeRound(request, (await params).roundId);
  if (response) return response;
  const body = await readBody(request, overviewRequestSchema);
  if (!body || !round.snapshot.teachers.some((t) => t.key === body.teacherKey)) return json({ reason: 'invalid' }, 400);
  return json({ items: await teacherOverview(round, body.teacherKey) });
}
