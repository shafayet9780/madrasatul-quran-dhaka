import 'server-only';
import { and, asc, eq, inArray, isNull, lte, ne, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getDb } from './db';
import { questionLabel } from './labels';
import { titleCase, toBengaliDigits as bn } from './normalise';
import {
  areaMeans,
  roundMeans,
  studentAggregates,
  studentAreaMeans,
  studentFlags,
  type MarkRow,
} from './report-math';
import { answerItems, responses, students, submissions, surveyRounds } from './schema';
import { classLabel as classLabelOf, compareStudents, type RoundSnapshot } from './snapshot';
import { leniency, straightLining, summarise } from './stats';

type Round = typeof surveyRounds.$inferSelect;

export async function t1Rounds() {
  return getDb().select().from(surveyRounds).where(eq(surveyRounds.kind, 'T1')).orderBy(asc(surveyRounds.opensAt));
}

/** The requested round, else the newest one that has opened. */
export function pickRound(rounds: Round[], requested?: string, now = new Date()): Round | undefined {
  return rounds.find((r) => r.id === requested) ?? [...rounds].reverse().find((r) => r.opensAt <= now) ?? rounds[rounds.length - 1];
}

/** Teacher (T1) marks of these rounds, optionally for one class-section or some students. */
export async function t1Marks(roundIds: string[], where: { classKey?: string; sectionKey?: string; erpIds?: string[] } = {}): Promise<MarkRow[]> {
  if (!roundIds.length || (where.erpIds && !where.erpIds.length)) return [];
  const rows = await getDb()
    .select({
      roundId: answerItems.roundId,
      submissionId: answerItems.submissionId,
      teacherKey: answerItems.teacherKey,
      studentErpId: answerItems.studentErpId,
      subjectKey: answerItems.subjectKey,
      questionKey: answerItems.questionKey,
      areaKey: answerItems.areaKey,
      mark: answerItems.mark,
    })
    .from(answerItems)
    .where(
      and(
        inArray(answerItems.roundId, roundIds),
        eq(answerItems.kind, 'T1'),
        where.classKey ? eq(answerItems.classKey, where.classKey) : undefined,
        where.sectionKey !== undefined ? eq(answerItems.sectionKey, where.sectionKey) : undefined,
        where.erpIds ? inArray(answerItems.studentErpId, where.erpIds) : undefined
      )
    );
  return rows.map((r) => ({ ...r, mark: r.mark === null ? null : Number(r.mark) }));
}

const lowest = (snapshot: RoundSnapshot) => Math.min(...snapshot.template.scale);

/** The student's mean in their latest earlier round with marks (a skipped round is passed over). */
function previousMean(trend: { roundId: string; mean: number | null }[], roundId: string) {
  const earlier = trend.filter((p) => p.roundId !== roundId);
  return earlier.length ? earlier[earlier.length - 1].mean : null;
}
const areaList = (snapshot: RoundSnapshot) => snapshot.areas.filter((a) => a.group === 'student');

/** Rounds up to and including this one, oldest first (for trends and "previous round"). */
async function roundsUpTo(round: Round) {
  return getDb()
    .select({ id: surveyRounds.id, label: surveyRounds.label })
    .from(surveyRounds)
    .where(and(eq(surveyRounds.kind, 'T1'), lte(surveyRounds.opensAt, round.opensAt)))
    .orderBy(asc(surveyRounds.opensAt));
}

/** Class-sections of a round with how many students have marks and their mean (reports index). */
export async function classOverview(round: Round) {
  const groups = await getDb()
    .select({
      classKey: answerItems.classKey,
      sectionKey: answerItems.sectionKey,
      students: sql<number>`count(DISTINCT ${answerItems.studentErpId})`.mapWith(Number),
      mean: sql<number | null>`avg(${answerItems.mark})`.mapWith((v) => (v === null ? null : Number(v))),
    })
    .from(answerItems)
    .where(and(eq(answerItems.roundId, round.id), eq(answerItems.kind, 'T1')))
    .groupBy(answerItems.classKey, answerItems.sectionKey);
  return round.snapshot.classes.flatMap((cls) =>
    (cls.sections.length ? cls.sections.map((s) => s.key) : ['']).map((sectionKey) => {
      const group = groups.find((g) => g.classKey === cls.key && g.sectionKey === sectionKey);
      return { classKey: cls.key, sectionKey, label: classLabelOf(round.snapshot, cls.key, sectionKey), students: group?.students ?? 0, mean: group?.mean ?? null };
    })
  );
}

/** Every student with T1 marks in a round, plus the active roster (search on the reports index). */
export async function searchableStudents(round: Round) {
  const db = getDb();
  const [rated, roster] = await Promise.all([
    db
      .selectDistinct({ erpId: responses.studentErpId, name: responses.studentName, classKey: responses.classKey, sectionKey: responses.sectionKey, roll: responses.roll })
      .from(responses)
      .where(and(eq(responses.roundId, round.id), eq(responses.isCurrent, true))),
    db
      .select({ erpId: students.erpId, name: students.name, classKey: students.classKey, sectionKey: students.sectionKey, roll: students.roll })
      .from(students)
      .where(eq(students.active, true)),
  ]);
  const byId = new Map([...roster, ...rated].map((s) => [s.erpId, s]));
  return [...byId.values()]
    .map((s) => ({ erpId: s.erpId, name: titleCase(s.name), roll: s.roll, label: classLabelOf(round.snapshot, s.classKey, s.sectionKey) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** R3 (teacher part): one class-section in one round. */
export async function classReport(round: Round, classKey: string, sectionKey: string) {
  const { snapshot } = round;
  const cls = snapshot.classes.find((c) => c.key === classKey);
  if (!cls || (cls.sections.length ? !cls.sections.some((s) => s.key === sectionKey) : sectionKey !== '')) return null;
  const db = getDb();
  const history = await roundsUpTo(round);
  const current = await t1Marks([round.id], { classKey, sectionKey });

  // Students rated in this class in this round (their snapshot), plus anyone on the roster now.
  const [snapshots, roster, batches] = await Promise.all([
    db
      .select({ erpId: responses.studentErpId, name: responses.studentName, roll: responses.roll })
      .from(responses)
      .where(and(eq(responses.roundId, round.id), eq(responses.kind, 'T1'), eq(responses.isCurrent, true), eq(responses.classKey, classKey), eq(responses.sectionKey, sectionKey))),
    db
      .select({ erpId: students.erpId, name: students.name, roll: students.roll })
      .from(students)
      .where(and(eq(students.active, true), eq(students.classKey, classKey), eq(students.sectionKey, sectionKey))),
    db
      .selectDistinct({ subjectKey: submissions.subjectKey })
      .from(submissions)
      .where(
        and(
          eq(submissions.roundId, round.id),
          eq(submissions.kind, 'T1'),
          eq(submissions.status, 'submitted'),
          isNull(submissions.supersededBy),
          eq(submissions.classKey, classKey),
          eq(submissions.sectionKey, sectionKey)
        )
      ),
  ]);
  // Reports follow the snapshot: someone who moved here after being rated in another class-section
  // this round belongs to that class's report, not this one.
  const ratedHere = new Set(snapshots.map((s) => s.erpId));
  const newcomers = roster.filter((s) => !ratedHere.has(s.erpId)).map((s) => s.erpId);
  const ratedElsewhere = newcomers.length
    ? new Set(
        (
          await db
            .selectDistinct({ erpId: responses.studentErpId })
            .from(responses)
            .where(
              and(
                eq(responses.roundId, round.id),
                eq(responses.kind, 'T1'),
                eq(responses.isCurrent, true),
                inArray(responses.studentErpId, newcomers),
                or(ne(responses.classKey, classKey), ne(responses.sectionKey, sectionKey))
              )
            )
        ).map((r) => r.erpId)
      )
    : new Set<string>();
  const people = new Map([...roster.filter((s) => !ratedElsewhere.has(s.erpId)), ...snapshots].map((s) => [s.erpId, s]));
  const ids = [...people.keys()];
  const past = await t1Marks(history.map((h) => h.id), { erpIds: ids });
  const aggregates = studentAggregates(current, lowest(snapshot));

  const rows = [...people.values()]
    .map((s) => {
      const agg = aggregates.get(s.erpId);
      const trend = roundMeans(past, history, s.erpId);
      return {
        erpId: s.erpId,
        name: titleCase(s.name),
        roll: s.roll,
        mean: agg?.mean ?? null,
        n: agg?.n ?? 0,
        teachers: agg?.teachers ?? 0,
        trend: trend.map((p) => ({ label: p.label, mean: p.mean! })),
        flags: studentFlags(agg, previousMean(trend, round.id), bn, lowest(snapshot)),
      };
    })
    .sort(compareStudents);

  const all = summarise(current.map((r) => r.mark));
  return {
    label: classLabelOf(snapshot, classKey, sectionKey),
    rows,
    areas: areaMeans(current, areaList(snapshot).map((a) => a.key)).map((a) => ({ ...a, name: snapshot.areas.find((x) => x.key === a.areaKey)!.name })),
    kpis: {
      mean: all.mean,
      n: all.n,
      topShare: all.topShare,
      ratedStudents: aggregates.size,
      flagged: rows.filter((r) => r.flags.length).length,
      subjectsCovered: batches.length,
      subjectsTotal: cls.subjects.length,
    },
    rounds: history.length,
  };
}

/** R4 (teacher part): one student, as of one round. */
export async function studentReport(round: Round, erpId: string) {
  const db = getDb();
  const [student] = await db.select().from(students).where(eq(students.erpId, erpId)).limit(1);
  const [snap] = await db
    .select({ name: responses.studentName, roll: responses.roll, classKey: responses.classKey, sectionKey: responses.sectionKey })
    .from(responses)
    .where(and(eq(responses.roundId, round.id), eq(responses.studentErpId, erpId), eq(responses.isCurrent, true)))
    .limit(1);
  if (!student && !snap) return null;
  const place = snap ?? { name: student!.name, roll: student!.roll, classKey: student!.classKey, sectionKey: student!.sectionKey };
  const { snapshot } = round;
  const history = await roundsUpTo(round);
  const replacement = alias(submissions, 'replacement');
  const [mine, classRows, notes, log] = await Promise.all([
    t1Marks(history.map((h) => h.id), { erpIds: [erpId] }),
    t1Marks([round.id], { classKey: place.classKey, sectionKey: place.sectionKey }),
    db
      .select({ note: responses.note, teacherName: submissions.teacherName, subjectName: submissions.subjectName, submittedAt: submissions.submittedAt })
      .from(responses)
      .innerJoin(submissions, eq(submissions.id, responses.submissionId))
      .where(and(eq(responses.roundId, round.id), eq(responses.studentErpId, erpId), eq(responses.isCurrent, true))),
    db
      .select({
        roundLabel: surveyRounds.label,
        teacherName: submissions.teacherName,
        subjectName: submissions.subjectName,
        submittedAt: submissions.submittedAt,
        supersededBy: submissions.supersededBy,
        duplicateFlag: submissions.duplicateFlag,
        teacherKey: submissions.teacherKey,
        replacementTeacher: replacement.teacherKey,
      })
      .from(responses)
      .innerJoin(submissions, eq(submissions.id, responses.submissionId))
      .innerJoin(surveyRounds, eq(surveyRounds.id, responses.roundId))
      .leftJoin(replacement, eq(replacement.id, submissions.supersededBy))
      .where(and(eq(responses.studentErpId, erpId), eq(responses.kind, 'T1'), eq(submissions.status, 'submitted')))
      .orderBy(asc(submissions.submittedAt)),
  ]);
  const current = mine.filter((r) => r.roundId === round.id);
  const agg = studentAggregates(current, lowest(snapshot)).get(erpId);
  const trend = roundMeans(mine, history);
  const areas = areaList(snapshot).map((a) => a.key);
  const classMeans = areaMeans(classRows, areas);

  // Subject × question grid: one row per subject and teacher (a kept duplicate shows twice).
  const cls = snapshot.classes.find((c) => c.key === place.classKey);
  const submissionIds = [...new Set(current.map((r) => r.submissionId))];
  const teacherOf = submissionIds.length
    ? await db
        .select({ id: submissions.id, teacherName: submissions.teacherName, subjectKey: submissions.subjectKey })
        .from(submissions)
        .where(inArray(submissions.id, submissionIds))
    : [];
  const grid = (cls?.subjects ?? []).flatMap((subject) => {
    const batches = teacherOf.filter((t) => t.subjectKey === subject.key);
    if (!batches.length) return [{ subject: subject.name, teacher: '', marks: null as (number | null)[] | null }];
    return batches.map((b) => ({
      subject: subject.name,
      teacher: b.teacherName ?? '',
      marks: snapshot.template.questions.map((q) => current.find((r) => r.submissionId === b.id && r.questionKey === q.key)?.mark ?? null),
    }));
  });

  return {
    student: {
      erpId,
      name: titleCase(place.name),
      roll: place.roll,
      label: classLabelOf(snapshot, place.classKey, place.sectionKey),
      classKey: place.classKey,
      sectionKey: place.sectionKey,
      fatherName: student?.fatherName ?? null,
      fatherMobile: student?.fatherMobile ?? null,
      motherMobile: student?.motherMobile ?? null,
      active: student?.active ?? false,
    },
    mean: agg?.mean ?? null,
    teachers: agg?.teachers ?? 0,
    classMean: summarise(classRows.map((r) => r.mark)).mean,
    flags: studentFlags(agg, previousMean(trend, round.id), bn, lowest(snapshot)),
    areas: studentAreaMeans(current, erpId, areas).map((a, i) => ({
      ...a,
      name: snapshot.areas.find((x) => x.key === a.areaKey)!.name,
      classMean: classMeans[i].mean,
    })),
    trend: trend.map((p) => ({ label: p.label, mean: p.mean! })),
    questions: snapshot.template.questions.map((q, i) => ({ n: i + 1, label: questionLabel(q) })),
    grid,
    notes: notes.filter((n) => n.note).map((n) => ({ ...n, note: n.note! })),
    log: log.map((l) => ({
      ...l,
      status: l.supersededBy
        ? l.replacementTeacher && l.replacementTeacher !== l.teacherKey
          ? ('set-aside' as const)
          : ('superseded' as const)
        : l.duplicateFlag
          ? ('duplicate' as const)
          : ('current' as const),
    })),
  };
}

/** R5: each teacher's marking in one round. */
export async function raterReport(round: Round) {
  const db = getDb();
  const [rows, batches] = await Promise.all([
    t1Marks([round.id]),
    db
      .select({ id: submissions.id, teacherKey: submissions.teacherKey, teacherName: submissions.teacherName, classKey: submissions.classKey, sectionKey: submissions.sectionKey, subjectKey: submissions.subjectKey })
      .from(submissions)
      .where(and(eq(submissions.roundId, round.id), eq(submissions.kind, 'T1'), eq(submissions.status, 'submitted'), isNull(submissions.supersededBy))),
  ]);
  const { scale } = round.snapshot.template;
  const len = new Map(leniency(rows.filter((r) => r.mark !== null && r.teacherKey).map((r) => ({ teacherKey: r.teacherKey!, studentId: r.studentErpId, mark: r.mark! }))).map((l) => [l.teacherKey, l]));
  const teachers = [...new Set(batches.map((b) => b.teacherKey!))];

  return teachers
    .map((teacherKey) => {
      const own = batches.filter((b) => b.teacherKey === teacherKey);
      const ownRows = rows.filter((r) => r.teacherKey === teacherKey);
      const summary = summarise(ownRows.map((r) => r.mark));
      const flatBatches = own
        .map((b) => {
          const perStudent = new Map<string, number[]>();
          for (const r of ownRows.filter((x) => x.submissionId === b.id && x.mark !== null)) perStudent.set(r.studentErpId, [...(perStudent.get(r.studentErpId) ?? []), r.mark!]);
          return { label: classLabelOf(round.snapshot, b.classKey, b.sectionKey), result: straightLining([...perStudent.values()]) };
        })
        .filter((b) => b.result.flagged);
      return {
        teacherKey,
        name: own[0].teacherName ?? teacherKey,
        batches: own.length,
        students: new Set(ownRows.map((r) => r.studentErpId)).size,
        mean: summary.mean,
        n: summary.n,
        distribution: scale.map((mark) => ({ mark, count: summary.distribution.get(mark) ?? 0 })),
        leniency: len.get(teacherKey) ?? null,
        flatBatches: flatBatches.map((b) => ({ label: b.label, mark: b.result.mark, share: b.result.share })),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'bn'));
}
