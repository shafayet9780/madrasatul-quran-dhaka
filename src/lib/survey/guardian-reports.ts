import 'server-only';
import { and, asc, eq, inArray, isNotNull, isNull, ne } from 'drizzle-orm';
import { getDb } from './db';
import { cellStats, childWeightedMean, cohortDelta, gapFlag, gapPoints, perStudentMeans, questionDistributions, resolveRounds, roundHistory, type GuardianItem } from './guardian-report-math';

export { pickKindRound, previousRound, resolveRounds } from './guardian-report-math';
import { questionLabel } from './labels';
import { titleCase, toBengaliDigits as bn } from './normalise';
import { areaMeans, studentAggregates, studentAreaMeans, studentFlags } from './report-math';
import { t1Marks } from './reports';
import { answerItems, responses, students, submissions, surveyRounds } from './schema';
import { classSections, type RoundSnapshot } from './snapshot';

// Guardian reports (spec §7): R1 overview, R2 teaching quality from G1, and the guardian parts of
// R3 class and R4 student (a teacher round with the guardian rounds paired to it by date). Aggregates read answer_items of current forms only.
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
  const pairs = roundHistory(t1, rounds, { g1, g2 });
  const history = pairs.map((p) => p.t1);
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
      const gap = gapFlag(g, t, bn);
      if (gap) reasons.push(gap.label);
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


/** Guardian forms of one child (all statuses), or the current ones of a class-section, oldest first. */
async function guardianForms(roundIds: (string | undefined)[], where: { erpId?: string; place?: Place; currentOnly: boolean }) {
  const ids = [...new Set(roundIds.filter((id): id is string => Boolean(id)))];
  if (!ids.length) return [];
  return getDb()
    .select({
      roundId: submissions.roundId,
      kind: submissions.kind,
      erpId: responses.studentErpId,
      who: submissions.submitterName,
      relation: submissions.submitterRelation,
      verified: submissions.verified,
      submittedAt: submissions.submittedAt,
      supersededBy: submissions.supersededBy,
      comment: submissions.comment,
    })
    .from(submissions)
    .innerJoin(responses, eq(responses.submissionId, submissions.id))
    .where(
      and(
        inArray(submissions.roundId, ids),
        ne(submissions.kind, 'T1'),
        eq(submissions.status, 'submitted'),
        where.currentOnly ? isNull(submissions.supersededBy) : undefined,
        where.erpId ? eq(responses.studentErpId, where.erpId) : undefined,
        where.place ? and(eq(responses.classKey, where.place.classKey), eq(responses.sectionKey, where.place.sectionKey)) : undefined
      )
    )
    .orderBy(asc(submissions.submittedAt));
}

/** Student areas of a teacher round and its G2 round, teacher areas first. */
function studentAreas(t1: Round, g2: Round | undefined) {
  const all = [...t1.snapshot.areas, ...(g2?.snapshot.areas ?? [])].filter((a) => a.group === 'student');
  return all.filter((a, i) => all.findIndex((b) => b.key === a.key) === i);
}

/** R3 guardian part: each child's G2 average and form status, guardian area means, G1 for the class. */
export async function classGuardian(t1: Round, rounds: Round[], at: Place, options: ReportOptions) {
  const { g1, g2 } = resolveRounds(t1, rounds, {});
  const [items, forms] = await Promise.all([guardianItems([g1?.id, g2?.id], options, at), guardianForms([g2?.id], { place: at, currentOnly: true })]);
  const g2Items = items.filter((i) => i.roundId === g2?.id);
  const g1Items = items.filter((i) => i.roundId === g1?.id);
  const subjects = (g1?.snapshot.classes.find((c) => c.key === at.classKey)?.subjects ?? [])
    .map((s) => ({ name: s.name, ...cellStats(g1Items.filter((i) => i.subjectKey === s.key)) }))
    .filter((s) => s.reliable && s.mean !== null);
  const areas = studentAreas(t1, g2);
  return {
    means: perStudentMeans(g2Items),
    status: new Map(forms.map((f) => [f.erpId, f.verified ? ('verified' as const) : ('unverified' as const)])),
    g2: { round: g2, ...cellStats(g2Items), mean: childWeightedMean(g2Items) },
    g1: { round: g1, ...cellStats(g1Items), mean: childWeightedMean(g1Items), lowest: [...subjects].sort((a, b) => a.mean! - b.mean!)[0] ?? null },
    areas: areaMeans(g2Items, areas.map((a) => a.key)).map((a, i) => ({ ...a, name: areas[i].name })),
  };
}

/** R4 guardian part and the guardian print: one child's G2 answers, areas, trend and form history. */
export async function studentGuardian(t1: Round, rounds: Round[], erpId: string, place: Place, options: ReportOptions) {
  const { g1, g2 } = resolveRounds(t1, rounds, {});
  const pairs = roundHistory(t1, rounds, { g1, g2 });
  const guardianRounds = rounds.filter((r) => r.kind !== 'T1');
  const [mine, classItems, forms] = await Promise.all([
    guardianItems(pairs.map((p) => p.g2?.id), options, { erpIds: [erpId] }),
    guardianItems([g2?.id], options, place),
    guardianForms(guardianRounds.map((r) => r.id), { erpId, currentOnly: false }),
  ]);
  const now = mine.filter((i) => i.roundId === g2?.id);
  const areas = studentAreas(t1, g2);
  const keys = areas.map((a) => a.key);
  const classMeans = areaMeans(classItems, keys);
  const form = forms.find((f) => f.roundId === g2?.id && !f.supersededBy);
  const roundOf = new Map(guardianRounds.map((r) => [r.id, r]));
  return {
    g2,
    mean: childWeightedMean(now),
    classMean: childWeightedMean(classItems),
    areas: studentAreaMeans(now, erpId, keys).map((a, i) => ({ ...a, name: areas[i].name, classMean: classMeans[i].mean })),
    answers: g2
      ? g2.snapshot.template.questions.map((q) => {
          const item = now.find((i) => i.questionKey === q.key);
          const option = q.options.find((o) => o.key === item?.optionKey);
          return { label: questionLabel(q), answer: !item ? null : (option?.label ?? (item.mark === null ? (q.naLabel ?? 'প্রযোজ্য নয়') : bn(item.mark))), mark: item?.mark ?? null };
        })
      : [],
    form: form ?? null,
    trend: pairs.map((p) => ({ roundId: p.t1.id, label: p.t1.label, mean: childWeightedMean(mine.filter((i) => i.roundId === p.g2?.id)) })),
    log: forms.map((f) => ({ ...f, roundLabel: roundOf.get(f.roundId)?.label ?? '' })),
  };
}

/** Class rows with the guardian average, the gap (guardian − teachers, score points), form status and the gap flag. */
export function withGuardian<R extends { erpId: string; mean: number | null; flags: { kind: string; label: string }[] }>(rows: R[], guardian: Awaited<ReturnType<typeof classGuardian>>) {
  return rows.map((r) => {
    const g = guardian.means.get(r.erpId) ?? null;
    const flag = gapFlag(g, r.mean, bn);
    return {
      ...r,
      guardian: g,
      gap: gapPoints(g, r.mean),
      form: guardian.status.get(r.erpId) ?? ('none' as const),
      flags: flag ? [...r.flags, flag] : r.flags,
    };
  });
}
