import 'server-only';
import { randomBytes, randomUUID } from 'node:crypto';
import { and, eq, inArray, isNull, ne, notInArray, or, sql, type SQL } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { getDb } from './db';
import { titleCase } from './normalise';
import { surveyAccess } from './round-status';
import { answerItems, responses, students, submissions, surveyRounds } from './schema';
import { compareStudents } from './snapshot';
import { findMissing, resolveBatch, t1AnswerItems, validRowAnswers } from './t1-logic';
import type { BatchKeyInput, BatchState, DraftRow, DuplicateBatch, OverviewItem, RosterStudent, SubmitResult } from './t1-types';

type Round = typeof surveyRounds.$inferSelect;
type BatchKey = BatchKeyInput & { roundId: string };
export type RequestMeta = { ip: string | null; userAgent: string | null };

const isCurrent = and(eq(submissions.status, 'submitted'), isNull(submissions.supersededBy));

function ownBatch(key: BatchKey): SQL {
  return and(
    eq(submissions.roundId, key.roundId),
    eq(submissions.kind, 'T1'),
    eq(submissions.teacherKey, key.teacherKey),
    eq(submissions.classKey, key.classKey),
    eq(submissions.sectionKey, key.sectionKey),
    eq(submissions.subjectKey, key.subjectKey)
  )!;
}

/** Current batches of other teachers for the same class-section and subject. */
function otherBatches(key: BatchKey): SQL {
  return and(
    eq(submissions.roundId, key.roundId),
    eq(submissions.kind, 'T1'),
    ne(submissions.teacherKey, key.teacherKey),
    eq(submissions.classKey, key.classKey),
    eq(submissions.sectionKey, key.sectionKey),
    eq(submissions.subjectKey, key.subjectKey),
    isCurrent
  )!;
}

export async function loadRoster(classKey: string, sectionKey: string): Promise<RosterStudent[]> {
  const rows = await getDb()
    .select({ erpId: students.erpId, name: students.name, roll: students.roll })
    .from(students)
    .where(and(eq(students.classKey, classKey), eq(students.sectionKey, sectionKey), eq(students.active, true)));
  return rows.map((r) => ({ ...r, name: titleCase(r.name) })).sort(compareStudents);
}

async function describeDuplicates(key: BatchKey): Promise<DuplicateBatch[]> {
  const db = getDb();
  const others = await db
    .select({ id: submissions.id, teacherName: submissions.teacherName, submittedAt: submissions.submittedAt })
    .from(submissions)
    .where(otherBatches(key));
  if (!others.length) return [];
  const counts = await db
    .select({ submissionId: responses.submissionId, n: sql<number>`count(*)`.mapWith(Number) })
    .from(responses)
    .where(inArray(responses.submissionId, others.map((o) => o.id)))
    .groupBy(responses.submissionId);
  return others.map((o) => ({
    submissionId: o.id,
    teacherName: o.teacherName ?? '',
    submittedAt: o.submittedAt!.toISOString(),
    students: counts.find((c) => c.submissionId === o.id)?.n ?? 0,
  }));
}

/** Students of the class-section with this teacher's saved marks (draft first, else the submitted batch). */
export async function loadBatch(round: Round, input: BatchKeyInput): Promise<BatchState | null> {
  if (!resolveBatch(round.snapshot, input)) return null;
  const key = { ...input, roundId: round.id };
  const db = getDb();
  const [roster, own, duplicates] = await Promise.all([
    loadRoster(key.classKey, key.sectionKey),
    db
      .select()
      .from(submissions)
      .where(and(ownBatch(key), or(eq(submissions.status, 'draft'), isCurrent))),
    describeDuplicates(key),
  ]);
  const draft = own.find((s) => s.status === 'draft');
  const current = own.find((s) => s.status === 'submitted');
  const source = draft ?? current;
  const saved = source
    ? await db
        .select({ studentErpId: responses.studentErpId, answers: responses.answers, note: responses.note })
        .from(responses)
        .where(eq(responses.submissionId, source.id))
    : [];

  return {
    students: roster,
    answers: Object.fromEntries(saved.map((r) => [r.studentErpId, r.answers as Record<string, number>])),
    notes: Object.fromEntries(saved.filter((r) => r.note).map((r) => [r.studentErpId, r.note!])),
    status: draft ? 'draft' : current ? 'submitted' : 'new',
    submitted: current ? { at: current.submittedAt!.toISOString(), receiptToken: current.receiptToken! } : null,
    duplicates,
  };
}

export type SaveResult = { ok: true; savedAt: string } | { ok: false; reason: 'closed' | 'invalid' };

/**
 * Autosave: merges marks (and notes when sent) into this teacher's draft for the batch.
 * The first save after a submission starts the draft as a copy of the submitted batch.
 */
export async function saveDraft(round: Round, input: BatchKeyInput, rows: DraftRow[], meta: RequestMeta, now = new Date()): Promise<SaveResult> {
  const access = surveyAccess(round, now);
  if (access !== 'open' && access !== 'grace') return { ok: false, reason: 'closed' };
  const names = resolveBatch(round.snapshot, input);
  if (!names) return { ok: false, reason: 'invalid' };
  const key = { ...input, roundId: round.id };
  const db = getDb();

  const roster = await db
    .select({ erpId: students.erpId, name: students.name, roll: students.roll })
    .from(students)
    .where(
      and(
        eq(students.classKey, key.classKey),
        eq(students.sectionKey, key.sectionKey),
        eq(students.active, true),
        inArray(students.erpId, rows.map((r) => r.studentErpId))
      )
    );
  const byId = new Map(roster.map((s) => [s.erpId, s]));
  const valid = rows.map((row) => ({ row, answers: validRowAnswers(round.snapshot, row), student: byId.get(row.studentErpId) }));
  if (valid.some((v) => !v.answers || !v.student)) return { ok: false, reason: 'invalid' };

  const newId = randomUUID();
  const [current] = await db.select({ id: submissions.id }).from(submissions).where(and(ownBatch(key), isCurrent));
  // Create the draft (no-op when one exists) and, only if it was just created, copy the submitted batch into it.
  await db.batch([
    db
      .insert(submissions)
      .values({
        id: newId,
        roundId: key.roundId,
        kind: 'T1',
        status: 'draft',
        teacherKey: key.teacherKey,
        teacherName: names.teacherName,
        classKey: key.classKey,
        sectionKey: key.sectionKey,
        subjectKey: key.subjectKey,
        subjectName: names.subjectName,
        clientIp: meta.ip,
        userAgent: meta.userAgent,
      })
      .onConflictDoNothing(),
    db.execute(sql`
      INSERT INTO responses (submission_id, round_id, kind, teacher_key, subject_key, student_erp_id, student_name, class_key, section_key, roll, answers, note)
      SELECT ${newId}, round_id, kind, teacher_key, subject_key, student_erp_id, student_name, class_key, section_key, roll, answers, note
      FROM responses
      WHERE submission_id = ${current?.id ?? null} AND EXISTS (SELECT 1 FROM submissions WHERE id = ${newId})
    `),
  ]);
  const [draft] = await db.select({ id: submissions.id }).from(submissions).where(and(ownBatch(key), eq(submissions.status, 'draft')));
  if (!draft) return { ok: false, reason: 'invalid' };

  const upserts = valid.map(({ row, answers, student }) =>
    db
      .insert(responses)
      .values({
        submissionId: draft.id,
        roundId: key.roundId,
        kind: 'T1',
        teacherKey: key.teacherKey,
        subjectKey: key.subjectKey,
        studentErpId: student!.erpId,
        studentName: student!.name,
        classKey: key.classKey,
        sectionKey: key.sectionKey,
        roll: student!.roll,
        answers: answers!,
        note: row.note?.trim() || null,
      })
      .onConflictDoUpdate({
        target: [responses.submissionId, responses.studentErpId],
        set: {
          answers: sql`${responses.answers} || excluded.answers`,
          note: row.note === undefined ? sql`${responses.note}` : sql`excluded.note`,
          updatedAt: now,
        },
      })
  );
  const statements: BatchItem<'pg'>[] = [
    ...upserts,
    db.update(submissions).set({ updatedAt: now, clientIp: meta.ip, userAgent: meta.userAgent }).where(eq(submissions.id, draft.id)),
  ];
  await db.batch(statements as [BatchItem<'pg'>, ...BatchItem<'pg'>[]]);
  return { ok: true, savedAt: now.toISOString() };
}

/**
 * Submits the teacher's draft in one transaction: checks completeness against the current roster,
 * re-checks other teachers' batches, supersedes the teacher's earlier batch and any earlier response
 * for these students in this subject (section moves), then writes the report rows.
 */
export async function submitBatch(
  round: Round,
  input: BatchKeyInput,
  acknowledged: string[],
  meta: RequestMeta,
  now = new Date()
): Promise<SubmitResult> {
  const access = surveyAccess(round, now);
  if (access !== 'open' && access !== 'grace') return { ok: false, reason: 'closed' };
  const names = resolveBatch(round.snapshot, input);
  if (!names) return { ok: false, reason: 'empty' };
  const key = { ...input, roundId: round.id };
  const db = getDb();

  const own = await db.select().from(submissions).where(and(ownBatch(key), or(eq(submissions.status, 'draft'), isCurrent)));
  const draft = own.find((s) => s.status === 'draft');
  const current = own.find((s) => s.status === 'submitted');
  if (!draft) return current ? { ok: true, receiptToken: current.receiptToken! } : { ok: false, reason: 'empty' };

  const [roster, drafted, duplicates] = await Promise.all([
    loadRoster(key.classKey, key.sectionKey),
    db
      .select({ id: responses.id, studentErpId: responses.studentErpId, answers: responses.answers })
      .from(responses)
      .where(eq(responses.submissionId, draft.id)),
    describeDuplicates(key),
  ]);
  if (!roster.length) return { ok: false, reason: 'empty' };
  const missing = findMissing(round.snapshot, roster, new Map(drafted.map((r) => [r.studentErpId, r.answers])));
  if (missing.length) return { ok: false, reason: 'incomplete', missing };
  if (duplicates.some((d) => !acknowledged.includes(d.submissionId))) return { ok: false, reason: 'duplicate', duplicates };

  const rosterIds = roster.map((s) => s.erpId);
  const kept = drafted.filter((r) => rosterIds.includes(r.studentErpId));
  const earlierForStudents = and(
    eq(responses.roundId, key.roundId),
    eq(responses.kind, 'T1'),
    eq(responses.teacherKey, key.teacherKey),
    eq(responses.subjectKey, key.subjectKey),
    eq(responses.isCurrent, true),
    inArray(responses.studentErpId, rosterIds)
  )!;
  const receiptToken = randomBytes(12).toString('base64url');
  const items = t1AnswerItems(round.snapshot, { submissionId: draft.id, roundId: key.roundId, ...input }, kept);

  const statements: BatchItem<'pg'>[] = [];
  if (current) {
    statements.push(
      db.update(submissions).set({ supersededBy: draft.id, mirroredAt: null, updatedAt: now }).where(eq(submissions.id, current.id)),
      db.delete(answerItems).where(eq(answerItems.submissionId, current.id))
    );
  }
  statements.push(
    db.delete(answerItems).where(inArray(answerItems.responseId, db.select({ id: responses.id }).from(responses).where(earlierForStudents))),
    db
      .update(responses)
      .set({ isCurrent: false })
      .where(current ? or(earlierForStudents, eq(responses.submissionId, current.id)) : earlierForStudents),
    db.delete(responses).where(and(eq(responses.submissionId, draft.id), notInArray(responses.studentErpId, rosterIds))),
    // Snapshot each student as they are now, so later promotions never rewrite this batch.
    db.execute(sql`
      UPDATE responses r SET is_current = true, student_name = s.name, roll = s.roll,
        class_key = s.class_key, section_key = s.section_key, updated_at = ${now}
      FROM students s WHERE r.submission_id = ${draft.id} AND s.erp_id = r.student_erp_id
    `),
    db
      .update(submissions)
      .set({
        status: 'submitted',
        submittedAt: now,
        updatedAt: now,
        receiptToken,
        duplicateFlag: duplicates.length > 0,
        teacherName: names.teacherName,
        subjectName: names.subjectName,
        mirroredAt: null,
        clientIp: meta.ip,
        userAgent: meta.userAgent,
      })
      .where(eq(submissions.id, draft.id))
  );
  if (duplicates.length) {
    statements.push(
      db
        .update(submissions)
        .set({ duplicateFlag: true, mirroredAt: null })
        .where(inArray(submissions.id, duplicates.map((d) => d.submissionId)))
    );
  }
  if (items.length) statements.push(db.insert(answerItems).values(items));

  try {
    await db.batch(statements as [BatchItem<'pg'>, ...BatchItem<'pg'>[]]);
  } catch (error) {
    // A concurrent submit of the same batch won the race (unique index); the client can retry.
    if ((error as { code?: string }).code === '23505') return { ok: false, reason: 'conflict' };
    throw error;
  }
  return { ok: true, receiptToken };
}

/** This teacher's batches in the round, for the class picker and the resume card. */
export async function teacherOverview(round: Round, teacherKey: string): Promise<OverviewItem[]> {
  const db = getDb();
  const own = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.roundId, round.id),
        eq(submissions.kind, 'T1'),
        eq(submissions.teacherKey, teacherKey),
        or(eq(submissions.status, 'draft'), isCurrent)
      )
    );
  if (!own.length) return [];
  const [saved, roster] = await Promise.all([
    db
      .select({ submissionId: responses.submissionId, studentErpId: responses.studentErpId, answers: responses.answers })
      .from(responses)
      .where(inArray(responses.submissionId, own.map((s) => s.id))),
    db
      .select({ erpId: students.erpId, classKey: students.classKey, sectionKey: students.sectionKey })
      .from(students)
      .where(eq(students.active, true)),
  ]);
  const placeOf = new Map(roster.map((s) => [s.erpId, `${s.classKey}|${s.sectionKey}`]));
  const { questions, scale } = round.snapshot.template;
  const complete = (answers: Record<string, unknown>) => questions.every((q) => !q.required || scale.includes(answers[q.key] as number));

  // A draft over a submitted batch is what the teacher is working on, so it wins.
  const byBatch = new Map<string, (typeof own)[number]>();
  for (const s of own) {
    const id = `${s.classKey}|${s.sectionKey}|${s.subjectKey}`;
    if (!byBatch.has(id) || s.status === 'draft') byBatch.set(id, s);
  }
  return [...byBatch.values()]
    .map((s) => ({
      classKey: s.classKey,
      sectionKey: s.sectionKey,
      subjectKey: s.subjectKey,
      status: s.status,
      // Progress counts only students currently in the class-section.
      done: saved.filter((r) => r.submissionId === s.id && placeOf.get(r.studentErpId) === `${s.classKey}|${s.sectionKey}` && complete(r.answers)).length,
      total: roster.filter((r) => r.classKey === s.classKey && r.sectionKey === s.sectionKey).length,
      updatedAt: s.updatedAt.toISOString(),
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export type Receipt = {
  submission: typeof submissions.$inferSelect;
  round: Round;
  rows: { erpId: string; name: string; roll: number | null; answers: Record<string, unknown>; note: string | null }[];
  /** Receipt token of the submission that replaced this one, if it was edited later. */
  replacedBy: string | null;
};

export async function loadReceipt(token: string): Promise<Receipt | null> {
  const db = getDb();
  const [submission] = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.receiptToken, token), eq(submissions.status, 'submitted')))
    .limit(1);
  if (!submission) return null;
  const [[round], saved, replacement] = await Promise.all([
    db.select().from(surveyRounds).where(eq(surveyRounds.id, submission.roundId)),
    db.select().from(responses).where(eq(responses.submissionId, submission.id)),
    submission.supersededBy
      ? db.select({ token: submissions.receiptToken }).from(submissions).where(eq(submissions.id, submission.supersededBy))
      : Promise.resolve([]),
  ]);
  const rows = saved
    .map((r) => ({ erpId: r.studentErpId, name: titleCase(r.studentName), roll: r.roll, answers: r.answers, note: r.note }))
    .sort(compareStudents);
  return { submission, round, rows, replacedBy: replacement[0]?.token ?? null };
}
