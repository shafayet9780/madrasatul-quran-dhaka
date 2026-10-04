import 'server-only';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { buildCoverage, deviceLabel, duplicateGroups, type BatchSummary } from './coverage';
import { getDb } from './db';
import { batchLabel } from './labels';
import { answerItems, REQUEUE_MIRROR, responses, students, submissions, surveyRounds } from './schema';

export async function listT1Rounds() {
  return getDb()
    .select({ id: surveyRounds.id, label: surveyRounds.label, opensAt: surveyRounds.opensAt, closesAt: surveyRounds.closesAt })
    .from(surveyRounds)
    .where(eq(surveyRounds.kind, 'T1'))
    .orderBy(desc(surveyRounds.opensAt));
}

export async function loadTracker(roundId: string) {
  const db = getDb();
  const [round] = await db.select().from(surveyRounds).where(eq(surveyRounds.id, roundId)).limit(1);
  if (!round || round.kind !== 'T1') return null;
  const rows = await db
    .select({
      id: submissions.id,
      status: submissions.status,
      supersededBy: submissions.supersededBy,
      duplicateFlag: submissions.duplicateFlag,
      teacherName: submissions.teacherName,
      classKey: submissions.classKey,
      sectionKey: submissions.sectionKey,
      subjectKey: submissions.subjectKey,
      subjectName: submissions.subjectName,
      updatedAt: submissions.updatedAt,
      submittedAt: submissions.submittedAt,
      userAgent: submissions.userAgent,
    })
    .from(submissions)
    .where(and(eq(submissions.roundId, roundId), eq(submissions.kind, 'T1')));
  const batches: BatchSummary[] = rows;
  const coverage = buildCoverage(round.snapshot, batches);

  // Draft progress: students in the class-section now with every required question answered.
  const draftRows = rows.filter((r) => r.status === 'draft');
  const [saved, roster] = await Promise.all([
    draftRows.length
      ? db
          .select({ submissionId: responses.submissionId, studentErpId: responses.studentErpId, answers: responses.answers })
          .from(responses)
          .where(inArray(responses.submissionId, draftRows.map((d) => d.id)))
      : Promise.resolve([]),
    db
      .select({ erpId: students.erpId, classKey: students.classKey, sectionKey: students.sectionKey })
      .from(students)
      .where(eq(students.active, true)),
  ]);
  const { questions, scale } = round.snapshot.template;
  const complete = (answers: Record<string, unknown>) => questions.every((q) => !q.required || scale.includes(answers[q.key] as number));
  const placeOf = new Map(roster.map((s) => [s.erpId, `${s.classKey}|${s.sectionKey}`]));
  const drafts = draftRows
    .map((d) => {
      const place = `${d.classKey}|${d.sectionKey}`;
      return {
        id: d.id,
        title: batchLabel(round.snapshot, d, 'short'),
        teacherName: d.teacherName ?? '',
        done: saved.filter((r) => r.submissionId === d.id && placeOf.get(r.studentErpId) === place && complete(r.answers)).length,
        total: roster.filter((s) => `${s.classKey}|${s.sectionKey}` === place).length,
        updatedAt: d.updatedAt,
        device: deviceLabel(d.userAgent),
      };
    })
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  const duplicates = duplicateGroups(batches).map((group) => ({
    title: batchLabel(round.snapshot, group[0], 'short'),
    batches: group.map((b) => ({ id: b.id, teacherName: b.teacherName ?? '', submittedAt: b.submittedAt! })),
  }));

  return { round, coverage, drafts, duplicates };
}

/**
 * Resolves a duplicate class + subject. `keepId` set: the other batches stop counting (superseded by
 * the kept one, their report rows removed). `keepId` null: all are kept and unflagged.
 * Every touched batch is re-copied to the Sheet with its new status.
 */
export async function resolveDuplicate(roundId: string, batchIds: string[], keepId: string | null): Promise<string | null> {
  const db = getDb();
  const group = await db
    .select({ id: submissions.id, classKey: submissions.classKey, sectionKey: submissions.sectionKey, subjectKey: submissions.subjectKey })
    .from(submissions)
    .where(
      and(
        eq(submissions.roundId, roundId),
        eq(submissions.kind, 'T1'),
        eq(submissions.status, 'submitted'),
        isNull(submissions.supersededBy),
        inArray(submissions.id, batchIds)
      )
    );
  const sameBatch = group.every((g) => g.classKey === group[0]?.classKey && g.sectionKey === group[0].sectionKey && g.subjectKey === group[0].subjectKey);
  if (group.length !== batchIds.length || group.length < 2 || !sameBatch || (keepId && !batchIds.includes(keepId))) {
    return 'তালিকাটি বদলে গেছে; পাতাটি আবার লোড করুন।';
  }
  const now = new Date();
  if (!keepId) {
    await db.update(submissions).set({ duplicateFlag: false, ...REQUEUE_MIRROR, updatedAt: now }).where(inArray(submissions.id, batchIds));
    return null;
  }
  const dropped = batchIds.filter((id) => id !== keepId);
  // Each statement re-checks its precondition, so two admins deciding at once cannot set both aside:
  // whoever commits second finds the kept batch no longer current and changes nothing.
  const keepStillCurrent = sql`EXISTS (SELECT 1 FROM submissions k WHERE k.id = ${keepId} AND k.superseded_by IS NULL)`;
  const setAsideByUs = db.select({ id: submissions.id }).from(submissions).where(and(inArray(submissions.id, dropped), eq(submissions.supersededBy, keepId)));
  const statements: BatchItem<'pg'>[] = [
    db
      .update(submissions)
      .set({ supersededBy: keepId, ...REQUEUE_MIRROR, updatedAt: now })
      .where(and(inArray(submissions.id, dropped), isNull(submissions.supersededBy), keepStillCurrent)),
    db.delete(answerItems).where(inArray(answerItems.submissionId, setAsideByUs)),
    db.update(responses).set({ isCurrent: false }).where(inArray(responses.submissionId, setAsideByUs)),
    db.update(submissions).set({ duplicateFlag: false, ...REQUEUE_MIRROR, updatedAt: now }).where(and(eq(submissions.id, keepId), isNull(submissions.supersededBy))),
  ];
  await db.batch(statements as [BatchItem<'pg'>, ...BatchItem<'pg'>[]]);
  const after = await db.select({ supersededBy: submissions.supersededBy }).from(submissions).where(inArray(submissions.id, dropped));
  return after.every((row) => row.supersededBy === keepId) ? null : 'অন্য কেউ এইমাত্র সিদ্ধান্ত নিয়েছেন; পাতাটি আবার লোড করুন।';
}
