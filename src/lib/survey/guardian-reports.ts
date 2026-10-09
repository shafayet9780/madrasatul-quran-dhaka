import 'server-only';
import { and, asc, eq, inArray, isNotNull, isNull, ne } from 'drizzle-orm';
import { getDb } from './db';
import { cellStats, childAreaMeans, childWeightedMean, cohortDelta, gapFlag, optionCounts, pairedRound, perStudentMeans, questionDistributions, resolveRounds, roundHistory, sharedAreaGap, type GuardianItem } from './guardian-report-math';

export { pickKindRound, previousRound, resolveRounds } from './guardian-report-math';
import { questionLabel } from './labels';
import { titleCase, toBengaliDigits as bn } from './normalise';
import { areaMeans, childRows, dropSince, GUARDIAN_AREAS, studentAggregates, studentAreaMeans, studentFlags } from './report-math';
import { MIN_N, summarise } from './stats';
import { t1Marks } from './reports';
import { answerItems, responses, students, submissions, surveyRounds } from './schema';
import { classLabel, classSections, type RoundSnapshot } from './snapshot';

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
      isNa: answerItems.isNa,
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

/** Comments of the current forms of a guardian round, in one class-section or the whole school (null), oldest first. */
export async function guardianComments(roundId: string, at: Place | null, { verifiedOnly }: ReportOptions) {
  const rows = await getDb()
    .select({
      who: submissions.submitterName,
      relation: submissions.submitterRelation,
      verified: submissions.verified,
      submittedAt: submissions.submittedAt,
      text: submissions.comment,
      child: responses.studentName,
      erpId: responses.studentErpId,
      classKey: responses.classKey,
      sectionKey: responses.sectionKey,
    })
    .from(submissions)
    .innerJoin(responses, eq(responses.submissionId, submissions.id))
    .where(
      and(
        eq(submissions.roundId, roundId),
        eq(submissions.status, 'submitted'),
        isNull(submissions.supersededBy),
        isNotNull(submissions.comment),
        at ? eq(responses.classKey, at.classKey) : undefined,
        at ? eq(responses.sectionKey, at.sectionKey) : undefined,
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

/**
 * Who teaches each class-section × subject, as the teachers' review of the same period shows it
 * (there are no fixed assignments): the teachers with a counted batch there, joined.
 */
async function subjectTeachers(t1: Round | undefined) {
  if (!t1) return new Map<string, string>();
  const rows = await getDb()
    .selectDistinct({ classKey: submissions.classKey, sectionKey: submissions.sectionKey, subjectKey: submissions.subjectKey, name: submissions.teacherName })
    .from(submissions)
    .where(and(eq(submissions.roundId, t1.id), eq(submissions.kind, 'T1'), eq(submissions.status, 'submitted'), isNull(submissions.supersededBy)));
  const names = new Map<string, string[]>();
  for (const r of rows) {
    const key = `${r.classKey}|${r.sectionKey}|${r.subjectKey}`;
    if (r.name) names.set(key, [...(names.get(key) ?? []), r.name]);
  }
  return new Map([...names].map(([key, list]) => [key, list.join(', ')]));
}

/** R2: class × subject means of a G1 round (optionally one area), change against another G1 round. */
export async function teachingQuality(g1: Round, compare: Round | undefined, options: ReportOptions & { areaKey?: string }, rounds: Round[] = [], t1?: Round) {
  // Teacher names come from the teacher round given (the overview's), else the one paired by date.
  const [all, teacherOf] = await Promise.all([guardianItems([g1.id, compare?.id], options), subjectTeachers(t1 ?? pairedRound(g1, rounds, 'T1'))]);
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
        return { subjectKey: s.key, ...cellStats(here(now)), delta: change(here(now), here(before)), teacher: teacherOf.get(`${p.classKey}|${p.sectionKey}|${s.key}`) ?? null };
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

/**
 * Classes page: per class-section, today's roster and how many of those children have a current
 * form in the guardian (G2) round paired with the teacher round (counted as on the overview).
 */
export async function classResponses(t1: Round, rounds: Round[]) {
  const { g2 } = resolveRounds(t1, rounds, {});
  const [guardian, roster] = await Promise.all([
    g2 ? guardianItems([g2.id], { verifiedOnly: false }) : Promise.resolve([]),
    getDb().select({ erpId: students.erpId, classKey: students.classKey, sectionKey: students.sectionKey }).from(students).where(eq(students.active, true)),
  ]);
  const answered = new Set(guardian.map((i) => i.studentErpId));
  const byPlace = new Map(
    classSections(t1.snapshot).map((p) => {
      const here = roster.filter((s) => same(s, p));
      return [`${p.classKey}|${p.sectionKey}`, { total: here.length, answered: here.filter((s) => answered.has(s.erpId)).length }] as const;
    })
  );
  return { g2: g2 ?? null, byPlace };
}

/** R1: one teacher round with its paired guardian rounds; the comparison is the previous teacher round's. */
export async function overviewReport(t1: Round, rounds: Round[], picked: { g1?: string; g2?: string; compare?: string }, options: ReportOptions) {
  const { g1, g2, compareT1, cg1, cg2 } = resolveRounds(t1, rounds, picked);
  const pairs = roundHistory(t1, rounds, { g1, g2 });
  const history = pairs.map((p) => p.t1);
  const [teacher, guardian, heat, roster] = await Promise.all([
    // Teachers' marks about the child only (the guardian questions are left out, GUARDIAN_AREAS).
    t1Marks([...new Set([...history.map((r) => r.id), compareT1?.id].filter((id): id is string => Boolean(id)))]).then(childRows),
    guardianItems([g1?.id, g2?.id, cg1?.id, cg2?.id, ...pairs.flatMap((p) => [p.g1?.id, p.g2?.id])], options),
    g1 ? teachingQuality(g1, cg1, options, rounds, t1) : Promise.resolve(null),
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

  // Needs attention (spec §7 flags): teacher flags, and guardian and teachers far apart on the
  // areas both rated. As on the class and student pages: a drop compares the same subjects with
  // the child's latest earlier round with marks.
  const lowest = Math.min(...t1.snapshot.template.scale);
  const teacherNow = perStudentMeans(of(teacher, t1.id));
  const guardianNow = perStudentMeans(of(guardian, g2?.id));
  const teacherAreas = childAreaMeans(of(teacher, t1.id));
  const guardianAreas = childAreaMeans(of(guardian, g2?.id));
  const aggregates = studentAggregates(of(teacher, t1.id), lowest);
  const historyIds = history.map((r) => r.id);
  const questionName = (key: string) => {
    const question = t1.snapshot.template.questions.find((q) => q.key === key);
    return question ? questionLabel(question) : key;
  };
  const inRound = [...new Set([...teacherNow.keys(), ...guardianNow.keys()])].filter((erpId) => placeOf.get(erpId));
  const attention = inRound
    .map((erpId) => {
      const reasons = studentFlags(aggregates.get(erpId), dropSince(teacher, historyIds, erpId), bn, lowest, questionName).map((f) => f.label);
      const gap = gapFlag(sharedAreaGap(guardianAreas.get(erpId), teacherAreas.get(erpId)), bn);
      if (gap) reasons.push(gap.label);
      const student = roster.find((s) => s.erpId === erpId)!;
      return reasons.length ? { erpId, name: titleCase(student.name), place: placeOf.get(erpId)!.label, reasons } : null;
    })
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .sort((a, b) => b.reasons.length - a.reasons.length || a.name.localeCompare(b.name));

  // Each tile says how many children it rests on, the share of low answers and the comparison group.
  const kpi = (now: { studentErpId: string; mark: number | null }[], before: { studentErpId: string; mark: number | null }[]) => {
    const change = cohortDelta(perStudentMeans(now), perStudentMeans(before));
    const children = perStudentMeans(now).size;
    return { mean: childWeightedMean(now), children, lowShare: summarise(now.map((i) => i.mark)).lowShare, delta: change.delta, cohort: change.cohort };
  };
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

/** R3 guardian part: each child's G2 average, form status and gap to the teachers, guardian area means, G1 for the class. */
export async function classGuardian(t1: Round, rounds: Round[], at: Place, options: ReportOptions) {
  const { g1, g2 } = resolveRounds(t1, rounds, {});
  const [items, forms, teacher] = await Promise.all([
    guardianItems([g1?.id, g2?.id], options, at),
    guardianForms([g2?.id], { place: at, currentOnly: true }),
    t1Marks([t1.id], at).then(childRows),
  ]);
  const g2Items = items.filter((i) => i.roundId === g2?.id);
  const g1Items = items.filter((i) => i.roundId === g1?.id);
  const subjects = (g1?.snapshot.classes.find((c) => c.key === at.classKey)?.subjects ?? [])
    .map((s) => ({ name: s.name, ...cellStats(g1Items.filter((i) => i.subjectKey === s.key)) }))
    .filter((s) => s.reliable && s.mean !== null);
  const areas = studentAreas(t1, g2);
  const guardianAreas = childAreaMeans(g2Items);
  const teacherAreas = childAreaMeans(teacher);
  return {
    means: perStudentMeans(g2Items),
    /** Guardian against teachers on the areas both rated, per child (the gap, flag and scatter use this). */
    shared: new Map([...guardianAreas.keys()].map((erpId) => [erpId, sharedAreaGap(guardianAreas.get(erpId), teacherAreas.get(erpId))])),
    status: new Map(forms.map((f) => [f.erpId, f.verified ? ('verified' as const) : ('unverified' as const)])),
    g2: { round: g2, ...cellStats(g2Items), mean: childWeightedMean(g2Items) },
    g1: { round: g1, ...cellStats(g1Items), mean: childWeightedMean(g1Items), lowest: [...subjects].sort((a, b) => a.mean! - b.mean!)[0] ?? null },
    areas: areaMeans(g2Items, areas.map((a) => a.key)).map((a, i) => ({ ...a, name: areas[i].name })),
  };
}

/** R4 guardian part and the guardian print: one child's G2 and G1 answers, areas, trend and form history. */
export async function studentGuardian(t1: Round, rounds: Round[], erpId: string, place: Place, options: ReportOptions) {
  const { g1, g2 } = resolveRounds(t1, rounds, {});
  const pairs = roundHistory(t1, rounds, { g1, g2 });
  const guardianRounds = rounds.filter((r) => r.kind !== 'T1');
  const [mine, classItems, forms] = await Promise.all([
    guardianItems([...pairs.map((p) => p.g2?.id), g1?.id], options, { erpIds: [erpId] }),
    guardianItems([g2?.id], options, place),
    guardianForms(guardianRounds.map((r) => r.id), { erpId, currentOnly: false }),
  ]);
  const now = mine.filter((i) => i.roundId === g2?.id);
  const areas = studentAreas(t1, g2);
  const keys = areas.map((a) => a.key);
  const classMeans = areaMeans(classItems, keys);
  const form = forms.find((f) => f.roundId === g2?.id && !f.supersededBy);
  const g1Form = forms.find((f) => f.roundId === g1?.id && !f.supersededBy);
  const g1Items = mine.filter((i) => i.roundId === g1?.id);
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
          return {
            label: questionLabel(q),
            question: q.text,
            answer: !item ? null : (option?.label ?? (item.isNa ? (q.naLabel ?? 'প্রযোজ্য নয়') : item.mark === null ? null : bn(item.mark))),
            mark: item?.mark ?? null,
            unscored: q.unscored,
          };
        })
      : [],
    form: form ?? null,
    /** The class-management review this child's guardian gave: questions × the class's subjects. */
    g1,
    g1Form: g1Form ?? null,
    g1Subjects: g1?.snapshot.classes.find((c) => c.key === place.classKey)?.subjects.map((s) => ({ key: s.key, name: s.name })) ?? [],
    g1Answers: g1Form
      ? g1!.snapshot.template.questions.map((q) => ({
          question: q.text,
          hint: q.hint ?? null,
          marks: new Map(g1Items.filter((i) => i.questionKey === q.key).map((i) => [i.subjectKey, i.isNa ? ('na' as const) : i.mark])),
        }))
      : [],
    trend: pairs.map((p) => ({ roundId: p.t1.id, label: p.t1.label, mean: childWeightedMean(mine.filter((i) => i.roundId === p.g2?.id)) })),
    log: forms.map((f) => ({ ...f, roundLabel: roundOf.get(f.roundId)?.label ?? '' })),
  };
}

/** Class rows with the guardian average, the gap on shared areas (guardian − teachers, marks), form status and the gap flag. */
export function withGuardian<R extends { erpId: string; mean: number | null; flags: { kind: string; label: string }[] }>(rows: R[], guardian: Awaited<ReturnType<typeof classGuardian>>) {
  return rows.map((r) => {
    const g = guardian.means.get(r.erpId) ?? null;
    const shared = guardian.shared.get(r.erpId) ?? null;
    const flag = gapFlag(shared, bn);
    return {
      ...r,
      guardian: g,
      shared,
      gap: shared?.gap ?? null,
      form: guardian.status.get(r.erpId) ?? ('none' as const),
      flags: flag ? [...r.flags, flag] : r.flags,
    };
  });
}

/**
 * School-wide (or one class-section) results per question for a teacher round and its guardian
 * rounds: T1 and G1 average, low share and n, weakest first (most low answers); G2 answer counts;
 * all guardian comments, newest first.
 */
export async function questionResults(t1: Round, rounds: Round[], picked: { g1?: string; g2?: string }, at: Place | null, options: ReportOptions) {
  const { g1, g2 } = resolveRounds(t1, rounds, picked);
  const where = at ?? {};
  const [teacher, guardian, g1Comments, g2Comments] = await Promise.all([
    t1Marks([t1.id], where),
    guardianItems([g1?.id, g2?.id], options, where),
    g1 ? guardianComments(g1.id, at, options) : Promise.resolve([]),
    g2 ? guardianComments(g2.id, at, options) : Promise.resolve([]),
  ]);
  // Questions with fewer than 3 children are hidden on the page, so they sort last.
  type Sortable = { lowShare: number | null; mean: number | null; children: number };
  const shown = (q: Sortable) => (q.children >= MIN_N ? (q.lowShare ?? -1) : -2);
  const weakestFirst = (a: Sortable, b: Sortable) => shown(b) - shown(a) || (a.mean ?? 99) - (b.mean ?? 99);
  const perQuestion = <T extends { questionKey: string; studentErpId: string; mark: number | null }>(round: Round | undefined, list: T[]) =>
    (round?.snapshot.template.questions ?? [])
      .map((q) => {
        const here = list.filter((i) => i.questionKey === q.key);
        return {
          key: q.key,
          label: questionLabel(q),
          text: q.text,
          area: round!.snapshot.areas.find((a) => a.key === q.areaKey)?.name ?? '',
          aboutGuardian: GUARDIAN_AREAS.has(q.areaKey),
          ...summarise(here.map((i) => i.mark)),
          children: new Set(here.filter((i) => i.mark !== null).map((i) => i.studentErpId)).size,
        };
      })
      .sort(weakestFirst);
  const g2Items = guardian.filter((i) => i.roundId === g2?.id);
  const place = (c: { classKey: string; sectionKey: string }, round: Round) => classLabel(round.snapshot, c.classKey, c.sectionKey);
  return {
    g1,
    g2,
    teacher: perQuestion(t1, teacher),
    teaching: perQuestion(g1, guardian.filter((i) => i.roundId === g1?.id)),
    child: (g2?.snapshot.template.questions ?? []).map((q) => {
      const here = g2Items.filter((i) => i.questionKey === q.key);
      return {
        key: q.key,
        label: questionLabel(q),
        unscored: q.unscored,
        ...summarise(here.map((i) => i.mark)),
        answered: new Set(here.map((i) => i.studentErpId)).size,
        options: optionCounts(here, [q]),
      };
    }),
    comments: [...g1Comments.map((c) => ({ ...c, kind: 'G1' as const, place: place(c, g1!) })), ...g2Comments.map((c) => ({ ...c, kind: 'G2' as const, place: place(c, g2!) }))].sort(
      (a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0)
    ),
  };
}
