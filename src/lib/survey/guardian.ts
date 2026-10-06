import 'server-only';
import { randomBytes, randomUUID } from 'node:crypto';
import { and, eq, inArray, lt, or } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { getDb } from './db';
import { guardianAnswerItems, inputTail, isVerified, relationText } from './guardian-logic';
import type { GuardianSubmitInput, GuardianSubmitResult, LookupRequest, MatchedChild } from './guardian-types';
import { normaliseMobile, titleCase } from './normalise';
import { surveyAccess } from './round-status';
import { answerItems, REQUEUE_MIRROR, responses, students, submissions, surveyLookups, surveyRounds } from './schema';
import { compareStudents } from './snapshot';
import type { RequestMeta } from './t1';

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

/** Whether this canonical mobile is the active student's father or mother mobile (false for an unknown student). */
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
    .where(lt(surveyLookups.createdAt, new Date(now.getTime() - LOOKUP_KEEP_MS)));
  return result.rowCount ?? 0;
}

/**
 * A guardian's G1/G2 form. Everything is checked again here: the child must be active in the
 * chosen class, `verified` is computed from the typed mobile, and the newest submission for the
 * child counts (the earlier one is kept, superseded). A repeated submit returns the same receipt.
 */
export async function submitGuardian(round: Round, input: GuardianSubmitInput, meta: RequestMeta, now = new Date()): Promise<GuardianSubmitResult> {
  const access = surveyAccess(round, now);
  if (access !== 'open' && access !== 'grace') return { ok: false, reason: 'closed' };
  const db = getDb();

  // Exactly as the lookup returned it.
  const erpId = input.studentErpId.trim();
  const [again] = await db
    .select({ token: submissions.receiptToken, roundId: submissions.roundId, mobile: submissions.submitterMobile, erpId: responses.studentErpId })
    .from(submissions)
    .leftJoin(responses, eq(responses.submissionId, submissions.id))
    .where(eq(submissions.id, input.submissionId))
    .limit(1);
  if (again) {
    // The same form sent again (double tap, lost answer): its receipt, and only to the same sender.
    const same = again.roundId === round.id && again.erpId === erpId && again.mobile === normaliseMobile(input.submitter.mobile);
    return same && again.token ? { ok: true, receiptToken: again.token } : { ok: false, reason: 'invalid' };
  }

  const [student] = await db
    .select()
    .from(students)
    .where(and(eq(students.erpId, erpId), eq(students.active, true), eq(students.classKey, input.classKey), eq(students.sectionKey, input.sectionKey)))
    .limit(1);
  if (!student) return { ok: false, reason: 'invalid' };

  const name = input.submitter.name.trim();
  const relation = relationText(input.submitter.relation, input.submitter.relationOther);
  const mobile = normaliseMobile(input.submitter.mobile);
  if (!name || !relation || !mobile) return { ok: false, reason: 'submitter' };

  const { items, missing, clean } = guardianAnswerItems(round.snapshot, student.classKey, input.answers);
  if (missing.length) return { ok: false, reason: 'incomplete', missing };

  const verified = isVerified(mobile, student);
  const comment = input.comment.trim() || null;
  return writeSubmission();

  async function writeSubmission(retried = false): Promise<GuardianSubmitResult> {
    const [current] = await db
      .select({ responseId: responses.id, submissionId: responses.submissionId })
      .from(responses)
      .where(and(eq(responses.roundId, round.id), eq(responses.studentErpId, erpId), eq(responses.isCurrent, true)))
      .limit(1);
    const receiptToken = randomBytes(12).toString('base64url');
    const responseId = randomUUID();
    const statements: BatchItem<'pg'>[] = [
      db.insert(submissions).values({
        id: input.submissionId,
        roundId: round.id,
        kind: round.kind,
        status: 'submitted',
        submittedAt: now,
        receiptToken,
        submitterName: name,
        submitterRelation: relation,
        submitterMobile: mobile,
        verified,
        classKey: student.classKey,
        sectionKey: student.sectionKey,
        comment,
        clientIp: meta.ip,
        userAgent: meta.userAgent,
      }),
    ];
    if (current) {
      // The earlier response stops counting before the new one becomes current (one current per child).
      statements.push(
        db.update(responses).set({ isCurrent: false }).where(eq(responses.id, current.responseId)),
        db.update(submissions).set({ supersededBy: input.submissionId, ...REQUEUE_MIRROR, updatedAt: now }).where(eq(submissions.id, current.submissionId)),
        db.delete(answerItems).where(eq(answerItems.responseId, current.responseId))
      );
    }
    statements.push(
      db.insert(responses).values({
        id: responseId,
        submissionId: input.submissionId,
        roundId: round.id,
        kind: round.kind,
        studentErpId: erpId,
        studentName: student.name,
        classKey: student.classKey,
        sectionKey: student.sectionKey,
        roll: student.roll,
        answers: clean,
        isCurrent: true,
        updatedAt: now,
      })
    );
    if (items.length) {
      statements.push(
        db.insert(answerItems).values(
          items.map((item) => ({
            ...item,
            submissionId: input.submissionId,
            responseId,
            roundId: round.id,
            kind: round.kind,
            studentErpId: erpId,
            classKey: student.classKey,
            sectionKey: student.sectionKey,
            verified,
          }))
        )
      );
    }
    try {
      await db.batch(statements as [BatchItem<'pg'>, ...BatchItem<'pg'>[]]);
      return { ok: true, receiptToken };
    } catch (error) {
      if ((error as { code?: string }).code !== '23505') throw error;
      // The same form submitted twice at once: hand back the receipt that won.
      const [winner] = await db.select({ token: submissions.receiptToken }).from(submissions).where(eq(submissions.id, input.submissionId)).limit(1);
      if (winner?.token) return { ok: true, receiptToken: winner.token };
      // Another guardian's form for this child became current meanwhile: supersede it instead.
      if (!retried) return writeSubmission(true);
      throw error;
    }
  }
}
