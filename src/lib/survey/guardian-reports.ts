import 'server-only';
import { and, asc, eq, inArray, isNotNull, isNull, ne } from 'drizzle-orm';
import { getDb } from './db';
import { cellStats, childWeightedMean, cohortDelta, pairedRound, perStudentMeans, questionDistributions, resolveRounds, type GuardianItem } from './guardian-report-math';

export { pickKindRound, previousRound, resolveRounds } from './guardian-report-math';
import { questionLabel } from './labels';
import { titleCase, toBengaliDigits as bn } from './normalise';
import { FLAGS, studentAggregates, studentFlags } from './report-math';
import { t1Marks } from './reports';
import { answerItems, responses, students, submissions, surveyRounds } from './schema';
import { classSections, type RoundSnapshot } from './snapshot';

// Guardian reports (spec §7): R2 teaching quality from G1 and R1 overview (T1 round with the
// guardian rounds paired to it by date). Aggregates read answer_items of current forms only.
// Changes between rounds use the shared cohort; school-wide means weigh every child once.

type Round = typeof surveyRounds.$inferSelect;
export type ReportOptions = { verifiedOnly: boolean };
type Place = { classKey: string; sectionKey: string };

/** Every opened round, oldest first. */
export async function allReportRounds(): Promise<Round[]> {
  return getDb().select().from(surveyRounds).orderBy(asc(surveyRounds.opensAt));
}

export async function guardianItems(roundIds: (string | undefined)[], { verifiedOnly }: ReportOptions, where: Partial<Place> & { erpIds?: string[] } = {}): Promise<GuardianItem[]> {
  const ids = [...new Set(roundIds.filter((id): id is string => Boolean(id)))];
  if (!ids.length || (where.erpIds && !where.erpIds.length)) return [];
  const rows = await getDb()
    .select({
      roundId: answerItems.roundId,
      studentErpId: answerItems.studentErpId,
      classKey: answerItems.classKey,
      sectionKey: answerItems.sectionKey,
      subjectKey: answerItems.subjectKey,
      questionKey: answerItems.questionKey,
      areaKey: answerItems.areaKey,
      mark: answerItems.mark,
      optionKey: answerItems.optionKey,
    })
    .from(answerItems)
    .where(
      and(
        inArray(answerItems.roundId, ids),
        ne(answerItems.kind, 'T1'),
        verifiedOnly ? eq(answerItems.verified, true) : undefined,
        where.classKey ? eq(answerItems.classKey, where.classKey) : undefined,
        where.sectionKey !== undefined ? eq(answerItems.sectionKey, where.sectionKey) : undefined,
        where.erpIds ? inArray(answerItems.studentErpId, where.erpIds) : undefined
      )
    );
  return rows.map((r) => ({ ...r, mark: r.mark === null ? null : Number(r.mark) }));
}

/** Comments of the current forms of a guardian round in one class-section, oldest first. */
export async function guardianComments(roundId: string, at: Place, { verifiedOnly }: ReportOptions) {
  const rows = await getDb()
    .select({
      who: submissions.submitterName,
      relation: submissions.submitterRelation,
      verified: submissions.verified,
      submittedAt: submissions.submittedAt,
      text: submissions.comment,
      child: responses.studentName,
      erpId: responses.studentErpId,
    })
    .from(submissions)
    .innerJoin(responses, eq(responses.submissionId, submissions.id))
    .where(
      and(
        eq(submissions.roundId, roundId),
        eq(submissions.status, 'submitted'),
        isNull(submissions.supersededBy),
        isNotNull(submissions.comment),
        eq(responses.classKey, at.classKey),
        eq(responses.sectionKey, at.sectionKey),
        verifiedOnly ? eq(submissions.verified, true) : undefined
      )
    )
    .orderBy(asc(submissions.submittedAt));
  return rows.map((c) => ({ ...c, child: titleCase(c.child) }));
}

const same = (i: Place, p: Place) => i.classKey === p.classKey && i.sectionKey === p.sectionKey;
const change = (now: GuardianItem[], before: GuardianItem[]) => cohortDelta(perStudentMeans(now), perStudentMeans(before)).delta;

/** Subjects of every class, in class order, each once (the heatmap's columns). */
function subjectColumns(snapshot: RoundSnapshot) {
  const seen = new Map<string, string>();
  for (const cls of snapshot.classes) for (const s of cls.subjects) if (!seen.has(s.key)) seen.set(s.key, s.name);
  return [...seen].map(([key, name]) => ({ key, name }));
}

/** R2: class × subject means of a G1 round (optionally one area), change against another G1 round. */
export async function teachingQuality(g1: Round, compare: Round | undefined, options: ReportOptions & { areaKey?: string }) {
  const all = await guardianItems([g1.id, compare?.id], options);
  const items = all.filter((i) => !options.areaKey || i.areaKey === options.areaKey);
  const now = items.filter((i) => i.roundId === g1.id);
  const before = items.filter((i) => i.roundId === compare?.id);
  const subjects = subjectColumns(g1.snapshot);
  const rows = classSections(g1.snapshot).map((p) => {
    const cls = g1.snapshot.classes.find((c) => c.key === p.classKey)!;
    return {
      ...p,
      cells: subjects.map((s) => {
        if (!cls.subjects.some((x) => x.key === s.key)) return null;
        const here = (list: GuardianItem[]) => list.filter((i) => same(i, p) && i.subjectKey === s.key);
        return { subjectKey: s.key, ...cellStats(here(now)), delta: change(here(now), here(before)) };
      }),
    };
  });
  const areas = g1.snapshot.areas
    .filter((a) => a.group === 'teaching')
    .map((a) => {
      const inArea = (list: GuardianItem[]) => list.filter((i) => i.areaKey === a.key);
      return { key: a.key, name: a.name, mean: childWeightedMean(inArea(all.filter((i) => i.roundId === g1.id))), delta: change(inArea(all.filter((i) => i.roundId === g1.id)), inArea(all.filter((i) => i.roundId === compare?.id))) };
    });
  return { subjects, rows, areas, respondents: new Set(now.filter((i) => i.mark !== null).map((i) => i.studentErpId)).size };
}

/** R2 side panel: one class-section × subject, with per-question marks and the class's comments. */
export async function teachingCell(g1: Round, compare: Round | undefined, at: Place & { subjectKey: string }, options: ReportOptions) {
  const items = (await guardianItems([g1.id, compare?.id], options, at)).filter((i) => i.subjectKey === at.subjectKey);
  const now = items.filter((i) => i.roundId === g1.id);
  const [roster, comments] = await Promise.all([
    getDb()
      .select({ erpId: students.erpId })
      .from(students)
      .where(and(eq(students.active, true), eq(students.classKey, at.classKey), eq(students.sectionKey, at.sectionKey))),
    guardianComments(g1.id, at, options),
  ]);
  const questions = g1.snapshot.template.questions;
  return {
    ...cellStats(now),
    // Today's roster; respondents are counted where the child was when the form came in.
    classSize: roster.length,
    delta: change(now, items.filter((i) => i.roundId === compare?.id)),
    questions: questionDistributions(now, questions.map((q) => q.key), g1.snapshot.template.scale).map((d, i) => ({ ...d, label: questionLabel(questions[i]) })),
    comments,
  };
}

/** R1: one teacher round with its paired guardian rounds; the comparison is the previous teacher round's. */
export async function overviewReport(t1: Round, rounds: Round[], picked: { g1?: string; g2?: string; compare?: string }, options: ReportOptions) {
  const { g1, g2, compareT1, cg1, cg2 } = resolveRounds(t1, rounds, picked);
  // Trend: each earlier teacher round with its own guardian rounds; a guardian round already shown
  // with a later teacher round is not repeated.
  const history = rounds.filter((r) => r.kind === 'T1' && r.opensAt <= t1.opensAt);
  const used = new Set<string>();
  const pairs = [...history].reverse().map((r) => {
    const take = (round: Round | undefined) => (round && !used.has(round.id) ? (used.add(round.id), round) : undefined);
    return { t1: r, g1: take(r.id === t1.id ? g1 : pairedRound(r, rounds, 'G1')), g2: take(r.id === t1.id ? g2 : pairedRound(r, rounds, 'G2')) };
  }).reverse();
  const [teacher, guardian, heat, roster] = await Promise.all([
    t1Marks([...new Set([...history.map((r) => r.id), compareT1?.id].filter((id): id is string => Boolean(id)))]),
    guardianItems([g1?.id, g2?.id, cg1?.id, cg2?.id, ...pairs.flatMap((p) => [p.g1?.id, p.g2?.id])], options),
    g1 ? teachingQuality(g1, cg1, options) : Promise.resolve(null),
    getDb()
      .select({ erpId: students.erpId, name: students.name, classKey: students.classKey, sectionKey: students.sectionKey })
      .from(students)
      .where(eq(students.active, true)),
  ]);
  const of = <T extends { roundId: string }>(list: T[], roundId: string | undefined) => (roundId ? list.filter((i) => i.roundId === roundId) : []);

  // Response by class-section: children of today's roster with a current G1 / G2 form.
  const answered = (roundId: string | undefined) => new Set(of(guardian, roundId).map((i) => i.studentErpId));
  const g1Done = answered(g1?.id);
  const g2Done = answered(g2?.id);
  const progress = classSections(t1.snapshot).map((p) => {
    const here = roster.filter((s) => same(s, p));
    return { ...p, total: here.length, g1: here.filter((s) => g1Done.has(s.erpId)).length, g2: here.filter((s) => g2Done.has(s.erpId)).length };
  });
  const placeOf = new Map(roster.map((s) => [s.erpId, progress.find((p) => same(s, p))]));
  const sum = (key: 'total' | 'g1' | 'g2') => progress.reduce((n, p) => n + p[key], 0);

  // Needs attention (spec §7 flags): teacher flags, and guardian and teachers far apart.
  const lowest = Math.min(...t1.snapshot.template.scale);
  const teacherNow = perStudentMeans(of(teacher, t1.id));
  // As on the class and student pages: a drop is against the child's latest earlier round with marks.
  const earlierMeans = history
    .filter((r) => r.id !== t1.id)
    .reverse()
    .map((r) => perStudentMeans(of(teacher, r.id)));
  const previousMean = (erpId: string) => earlierMeans.find((m) => m.has(erpId))?.get(erpId) ?? null;
  const guardianNow = perStudentMeans(of(guardian, g2?.id));
  const aggregates = studentAggregates(of(teacher, t1.id), lowest);
  const inRound = [...new Set([...teacherNow.keys(), ...guardianNow.keys()])].filter((erpId) => placeOf.get(erpId));
  const attention = inRound
    .map((erpId) => {
      const t = teacherNow.get(erpId) ?? null;
      const g = guardianNow.get(erpId) ?? null;
      const reasons = studentFlags(aggregates.get(erpId), previousMean(erpId), bn, lowest).map((f) => f.label);
      if (g !== null && t !== null && Math.abs(g - t) >= FLAGS.guardianTeacherGap) reasons.push(`অভিভাবক ও শিক্ষকের মতে ${bn(Math.abs(g - t).toFixed(1))} পার্থক্য`);
      const student = roster.find((s) => s.erpId === erpId)!;
      return reasons.length ? { erpId, name: titleCase(student.name), place: placeOf.get(erpId)!.label, reasons } : null;
    })
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .sort((a, b) => b.reasons.length - a.reasons.length || a.name.localeCompare(b.name));

  const kpi = (now: { studentErpId: string; mark: number | null }[], before: { studentErpId: string; mark: number | null }[]) => ({
    mean: childWeightedMean(now),
    delta: cohortDelta(perStudentMeans(now), perStudentMeans(before)).delta,
  });
  return {
    g1,
    g2,
    compareT1,
    kpis: {
      teaching: kpi(of(guardian, g1?.id), of(guardian, cg1?.id)),
      guardian: kpi(of(guardian, g2?.id), of(guardian, cg2?.id)),
      teacher: kpi(of(teacher, t1.id), of(teacher, compareT1?.id)),
      response: { g1: sum('g1'), g2: sum('g2'), total: sum('total') },
    },
    heat,
    progress,
    trend: pairs.map((p) => ({ label: p.t1.label, teacher: childWeightedMean(of(teacher, p.t1.id)), guardian: childWeightedMean(of(guardian, p.g2?.id)), teaching: childWeightedMean(of(guardian, p.g1?.id)) })),
    attention,
    assessed: inRound.length,
  };
}

