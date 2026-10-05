import 'server-only';
import { and, eq, inArray, lt, or } from 'drizzle-orm';
import { getDb } from './db';
import { inputTail, isVerified } from './guardian-logic';
import type { LookupRequest, MatchedChild } from './guardian-types';
import { titleCase } from './normalise';
import { responses, students, submissions, surveyLookups, surveyRounds } from './schema';
import { compareStudents } from './snapshot';

type Round = typeof surveyRounds.$inferSelect;

/**
 * Active students of the chosen class-section with this ERP ID or this father/mother mobile
 * (`value` already normalised), with the date of a current submission in this round.
 * Every lookup is logged with the last 4 characters of the value only.
 */
export async function lookupChildren(round: Round, request: LookupRequest, ip: string | null): Promise<MatchedChild[]> {
  const db = getDb();
  const { classKey, sectionKey, by, value } = request;
  const match = by === 'id' ? eq(students.erpId, value) : or(eq(students.fatherMobile, value), eq(students.motherMobile, value));
  const rows = (
    await db
      .select({ erpId: students.erpId, name: students.name, roll: students.roll })
      .from(students)
      .where(and(eq(students.active, true), eq(students.classKey, classKey), eq(students.sectionKey, sectionKey), match))
  ).sort(compareStudents);

  const current = rows.length
    ? await db
        .select({ erpId: responses.studentErpId, submittedAt: submissions.submittedAt })
        .from(responses)
        .innerJoin(submissions, eq(responses.submissionId, submissions.id))
        .where(and(eq(responses.roundId, round.id), eq(responses.isCurrent, true), inArray(responses.studentErpId, rows.map((r) => r.erpId))))
    : [];
  const submittedAt = new Map(current.map((c) => [c.erpId, c.submittedAt?.toISOString() ?? null]));

  await db.insert(surveyLookups).values({ roundId: round.id, classKey, sectionKey, by, inputTail: inputTail(value), matched: rows.map((r) => r.erpId), ip });

  return rows.map((r) => ({ erpId: r.erpId, name: titleCase(r.name), roll: r.roll, submittedAt: submittedAt.get(r.erpId) ?? null }));
}

/** Whether this mobile is the active student's father or mother mobile (false for an unknown student). */
export async function verifyMobile(studentErpId: string, mobile: string): Promise<boolean> {
  const [student] = await getDb()
    .select({ fatherMobile: students.fatherMobile, motherMobile: students.motherMobile })
    .from(students)
    .where(and(eq(students.erpId, studentErpId), eq(students.active, true)))
    .limit(1);
  return student ? isVerified(mobile, student) : false;
}

const LOOKUP_KEEP_MS = 90 * 24 * 60 * 60 * 1000;

/** The lookup log is for investigating abuse; 90 days is enough. */
export async function pruneLookups(now = new Date()) {
  const result = await getDb()
    .delete(surveyLookups)
    .where(lt(surveyLookups.createdAt, new Date(now.getTime() - LOOKUP_KEEP_MS)))
    .returning({ id: surveyLookups.id });
  return result.length;
}
