import type { NextRequest } from 'next/server';
import { normaliseTeacherId } from '@/lib/survey/normalise';
import { authorizeRound, rateLimited, json, readBody } from '@/lib/survey/survey-request';
import { teacherLookupSchema, type TeacherIdentity } from '@/lib/survey/t1-types';

/** A teacher starts by typing their ERP ID; the round's teacher list never reaches the browser. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ roundId: string }> }) {
  const limited = await rateLimited(request, 'lookup');
  if (limited) return limited;
  // Allowed in the grace period so a receipt's edit link works on another device; the batch route
  // still refuses to open new work after closing.
  const { round, response } = await authorizeRound(request, (await params).roundId);
  if (response) return response;
  const body = await readBody(request, teacherLookupSchema);
  if (!body) return json({ reason: 'invalid' }, 400);
  const id = normaliseTeacherId(body.teacherId).toLowerCase();
  const teacher = id ? round.snapshot.teachers.find((t) => t.key === id) : undefined;
  if (!teacher) return json({ reason: 'not-found' }, 404);
  return json({ key: teacher.key, name: teacher.name } satisfies TeacherIdentity);
}
