import 'server-only';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { z } from 'zod';
import { buildCoverage, deviceLabel, duplicateGroups, type BatchSummary } from './coverage';
import { getDb } from './db';
import { batchLabel } from './labels';
import { titleCase } from './normalise';
import { classSections, compareStudents } from './snapshot';
import { answerItems, REQUEUE_MIRROR, responses, students, submissions, surveyRounds } from './schema';

/** Every opened round, newest first: the tracker shows teacher and guardian rounds alike. */
export async function listTrackerRounds() {
  return getDb()
    .select({ id: surveyRounds.id, kind: surveyRounds.kind, label: surveyRounds.label, opensAt: surveyRounds.opensAt, closesAt: surveyRounds.closesAt })
    .from(surveyRounds)
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
    await db.update(submissions).set({ duplicateFlag: false, duplicateResolvedAt: now, ...REQUEUE_MIRROR, updatedAt: now }).where(inArray(submissions.id, batchIds));
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
    db
      .update(submissions)
      .set({ duplicateFlag: false, duplicateResolvedAt: now, ...REQUEUE_MIRROR, updatedAt: now })
      .where(and(eq(submissions.id, keepId), isNull(submissions.supersededBy))),
  ];
  await db.batch(statements as [BatchItem<'pg'>, ...BatchItem<'pg'>[]]);
  const after = await db.select({ supersededBy: submissions.supersededBy }).from(submissions).where(inArray(submissions.id, dropped));
  return after.every((row) => row.supersededBy === keepId) ? null : 'অন্য কেউ এইমাত্র সিদ্ধান্ত নিয়েছেন; পাতাটি আবার লোড করুন।';
}

export type GuardianChild = { erpId: string; name: string; roll: number | null; fatherMobile: string | null; motherMobile: string | null };
export type GuardianForm = { submissionId: string; current: boolean; who: string; relation: string; mobile: string | null; verified: boolean; submittedAt: Date };

/**
 * Guardian round (G1/G2) progress: per class-section, who has a current form; children still
 * without one (with the ERP parent mobiles, for one reminder per guardian); unverified current
 * forms; children with more than one form (the newest counts).
 */
export async function loadGuardianTracker(roundId: string) {
  if (!z.uuid().safeParse(roundId).success) return null;
  const db = getDb();
  const [round] = await db.select().from(surveyRounds).where(eq(surveyRounds.id, roundId)).limit(1);
  if (!round || round.kind === 'T1') return null;
  const [roster, formRows] = await Promise.all([
    db
      .select({ erpId: students.erpId, name: students.name, roll: students.roll, classKey: students.classKey, sectionKey: students.sectionKey, fatherMobile: students.fatherMobile, motherMobile: students.motherMobile })
      .from(students)
      .where(eq(students.active, true)),
    db
      .select({
        studentErpId: responses.studentErpId,
        current: responses.isCurrent,
        submissionId: submissions.id,
        who: submissions.submitterName,
        relation: submissions.submitterRelation,
        mobile: submissions.submitterMobile,
        verified: submissions.verified,
        submittedAt: submissions.submittedAt,
      })
      .from(responses)
      .innerJoin(submissions, eq(responses.submissionId, submissions.id))
      .where(and(eq(responses.roundId, roundId), eq(submissions.status, 'submitted'))),
  ]);
  const forms = new Map<string, GuardianForm[]>();
  for (const f of formRows) {
    const list = forms.get(f.studentErpId) ?? [];
    list.push({ submissionId: f.submissionId, current: f.current, who: f.who ?? '', relation: f.relation ?? '', mobile: f.mobile, verified: Boolean(f.verified), submittedAt: f.submittedAt! });
    forms.set(f.studentErpId, list);
  }
  const child = (s: (typeof roster)[number]): GuardianChild => ({ erpId: s.erpId, name: titleCase(s.name), roll: s.roll, fatherMobile: s.fatherMobile, motherMobile: s.motherMobile });
  const places = classSections(round.snapshot).map((place) => {
    const here = roster.filter((s) => s.classKey === place.classKey && s.sectionKey === place.sectionKey);
    const answered = (s: (typeof roster)[number]) => forms.get(s.erpId)?.some((f) => f.current) ?? false;
    return {
      ...place,
      total: here.length,
      done: here.filter(answered).length,
      pending: here
        .filter((s) => !answered(s))
        .map(child)
        .sort(compareStudents),
    };
  });
  const placeLabel = new Map(places.map((p) => [`${p.classKey}|${p.sectionKey}`, p.label]));
  const inRound = roster.filter((s) => placeLabel.has(`${s.classKey}|${s.sectionKey}`));
  const latestFirst = (a: GuardianForm, b: GuardianForm) => b.submittedAt.getTime() - a.submittedAt.getTime();
  const unverified = inRound
    .flatMap((s) => (forms.get(s.erpId) ?? []).filter((f) => f.current && !f.verified).map((f) => ({ ...f, child: child(s), place: placeLabel.get(`${s.classKey}|${s.sectionKey}`)! })))
    .sort(latestFirst);
  const multiple = inRound
    .filter((s) => (forms.get(s.erpId)?.length ?? 0) > 1)
    .map((s) => ({ child: child(s), place: placeLabel.get(`${s.classKey}|${s.sectionKey}`)!, forms: [...forms.get(s.erpId)!].sort(latestFirst) }))
    .sort((a, b) => latestFirst(a.forms[0], b.forms[0]));
  const done = places.reduce((n, p) => n + p.done, 0);
  const total = places.reduce((n, p) => n + p.total, 0);
  return { round, places, done, total, verified: done - unverified.length, unverified, multiple };
}
