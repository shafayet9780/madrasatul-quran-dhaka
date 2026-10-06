import 'server-only';
import { and, asc, eq, inArray, isNotNull, isNull, ne } from 'drizzle-orm';
import { getDb } from './db';
import { cellStats, delta, pairedRound, perStudentMeans, questionDistributions, type GuardianItem } from './guardian-report-math';
import { questionLabel } from './labels';
import { titleCase, toBengaliDigits as bn } from './normalise';
import { studentAggregates, studentFlags } from './report-math';
import { t1Marks } from './reports';
import { answerItems, responses, students, submissions, surveyRounds } from './schema';
import { classSections, type RoundSnapshot } from './snapshot';
import { summarise } from './stats';

// Guardian reports (spec §7): R2 teaching quality from G1 and R1 overview (T1 round with the
// guardian rounds paired to it by date). Aggregates read answer_items of current forms only.

type Round = typeof surveyRounds.$inferSelect;
export type ReportOptions = { verifiedOnly: boolean };

/** Every opened round, oldest first. */
export async function allReportRounds(): Promise<Round[]> {
  return getDb().select().from(surveyRounds).orderBy(asc(surveyRounds.opensAt));
}

/** The requested round of a kind, else the newest that has opened. */
export function pickKindRound(rounds: Round[], kind: Round['kind'], requested?: string, now = new Date()): Round | undefined {
  const own = rounds.filter((r) => r.kind === kind);
  return own.find((r) => r.id === requested) ?? [...own].reverse().find((r) => r.opensAt <= now) ?? own[own.length - 1];
}

/** The same kind's round before this one (the default "compare with"). */
export function previousRound(rounds: Round[], round: Round): Round | undefined {
  return [...rounds].reverse().find((r) => r.kind === round.kind && r.opensAt < round.opensAt);
}

export async function guardianItems(roundIds: (string | undefined)[], { verifiedOnly }: ReportOptions): Promise<GuardianItem[]> {
  const ids = roundIds.filter((id): id is string => Boolean(id));
  if (!ids.length) return [];
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
    })
    .from(answerItems)
    .where(and(inArray(answerItems.roundId, ids), ne(answerItems.kind, 'T1'), verifiedOnly ? eq(answerItems.verified, true) : undefined));
  return rows.map((r) => ({ ...r, mark: r.mark === null ? null : Number(r.mark) }));
}

const place = (i: { classKey: string; sectionKey: string }, p: { classKey: string; sectionKey: string }) => i.classKey === p.classKey && i.sectionKey === p.sectionKey;

/** Subjects of every class, in class order, each once (the heatmap's columns). */
function subjectColumns(snapshot: RoundSnapshot) {
  const seen = new Map<string, string>();
  for (const cls of snapshot.classes) for (const s of cls.subjects) if (!seen.has(s.key)) seen.set(s.key, s.name);
  return [...seen].map(([key, name]) => ({ key, name }));
}

/** R2: class × subject means of a G1 round (optionally one area), Δ against another G1 round. */
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
        const here = (list: GuardianItem[]) => list.filter((i) => place(i, p) && i.subjectKey === s.key);
        const stats = cellStats(here(now));
        return { subjectKey: s.key, ...stats, delta: delta(stats.mean, cellStats(here(before)).mean) };
      }),
    };
  });
  const areas = g1.snapshot.areas
    .filter((a) => a.group === 'teaching')
    .map((a) => ({ key: a.key, name: a.name, mean: cellStats(all.filter((i) => i.roundId === g1.id && i.areaKey === a.key)).mean, before: cellStats(all.filter((i) => i.roundId === compare?.id && i.areaKey === a.key)).mean }));
  return { subjects, rows, areas, respondents: new Set(now.map((i) => i.studentErpId)).size };
}

/** R2 side panel: one class-section × subject, with per-question marks and the class's comments. */
export async function teachingCell(g1: Round, compare: Round | undefined, at: { classKey: string; sectionKey: string; subjectKey: string }, options: ReportOptions) {
  const items = (await guardianItems([g1.id, compare?.id], options)).filter((i) => place(i, at) && i.subjectKey === at.subjectKey);
  const now = items.filter((i) => i.roundId === g1.id);
  const stats = cellStats(now);
  const db = getDb();
  const [roster, commented] = await Promise.all([
    db
      .select({ erpId: students.erpId })
      .from(students)
      .where(and(eq(students.active, true), eq(students.classKey, at.classKey), eq(students.sectionKey, at.sectionKey))),
    db
      .select({
        who: submissions.submitterName,
        relation: submissions.submitterRelation,
        verified: submissions.verified,
        submittedAt: submissions.submittedAt,
        text: submissions.comment,
        child: responses.studentName,
      })
      .from(submissions)
      .innerJoin(responses, eq(responses.submissionId, submissions.id))
      .where(
        and(
          eq(submissions.roundId, g1.id),
          eq(submissions.status, 'submitted'),
          isNull(submissions.supersededBy),
          isNotNull(submissions.comment),
          eq(responses.classKey, at.classKey),
          eq(responses.sectionKey, at.sectionKey),
          options.verifiedOnly ? eq(submissions.verified, true) : undefined
        )
      )
      .orderBy(asc(submissions.submittedAt)),
  ]);
  const questions = g1.snapshot.template.questions;
  return {
    ...stats,
    classSize: roster.length,
    delta: delta(stats.mean, cellStats(items.filter((i) => i.roundId === compare?.id)).mean),
    questions: questionDistributions(now, questions.map((q) => q.key), g1.snapshot.template.scale).map((d, i) => ({ ...d, label: questionLabel(questions[i]) })),
    comments: commented.map((c) => ({ ...c, child: titleCase(c.child) })),
  };
}

/** Guardian (G2) and teacher (T1) averages at least this far apart (2 marks = a 33-point band, spec §7). */
const GAP_MARKS = 2;
/** A guardian (G2) average this low is listed for attention. */
const LOW_GUARDIAN_MEAN = 5.5;

/** R1: one teacher round with its paired guardian rounds; the comparison is the previous teacher round's. */
export async function overviewReport(t1: Round, rounds: Round[], picked: { g1?: string; g2?: string; compare?: string }, options: ReportOptions) {
  const byId = (id: string | undefined, kind: Round['kind']) => rounds.find((r) => r.id === id && r.kind === kind);
  const g1 = byId(picked.g1, 'G1') ?? pairedRound(t1, rounds, 'G1');
  const g2 = byId(picked.g2, 'G2') ?? pairedRound(t1, rounds, 'G2');
  // 'none' = no comparison; otherwise the picked earlier teacher round, else the previous one.
  const compareT1 = picked.compare === 'none' ? undefined : (byId(picked.compare, 'T1') ?? previousRound(rounds, t1));
  const cg1 = compareT1 && pairedRound(compareT1, rounds, 'G1');
  const cg2 = compareT1 && pairedRound(compareT1, rounds, 'G2');
  const history = rounds.filter((r) => r.kind === 'T1' && r.opensAt <= t1.opensAt);
  const pairs = history.map((r) => ({ t1: r, g1: r.id === t1.id ? g1 : pairedRound(r, rounds, 'G1'), g2: r.id === t1.id ? g2 : pairedRound(r, rounds, 'G2') }));
  const [teacher, guardian, heat] = await Promise.all([
    t1Marks([...new Set([...history.map((r) => r.id), compareT1?.id].filter((id): id is string => Boolean(id)))]),
    guardianItems([...new Set([g1?.id, g2?.id, cg1?.id, cg2?.id, ...pairs.flatMap((p) => [p.g1?.id, p.g2?.id])])], options),
    g1 ? teachingQuality(g1, cg1, options) : Promise.resolve(null),
  ]);
  const meanOf = (roundId: string | undefined, from: { roundId: string; mark: number | null }[]) => (roundId ? summarise(from.filter((i) => i.roundId === roundId).map((i) => i.mark)).mean : null);

  // Response by class-section: children with a current G1 / G2 form among the active roster.
  const roster = await getDb()
    .select({ erpId: students.erpId, name: students.name, roll: students.roll, classKey: students.classKey, sectionKey: students.sectionKey })
    .from(students)
    .where(eq(students.active, true));
  const answered = (roundId: string | undefined) => new Set(guardian.filter((i) => i.roundId === roundId).map((i) => i.studentErpId));
  const g1Done = answered(g1?.id);
  const g2Done = answered(g2?.id);
  const progress = classSections(t1.snapshot).map((p) => {
    const here = roster.filter((s) => place(s, p));
    return { ...p, total: here.length, g1: here.filter((s) => g1Done.has(s.erpId)).length, g2: here.filter((s) => g2Done.has(s.erpId)).length };
  });
  const total = progress.reduce((n, p) => n + p.total, 0);

  // Needs attention: teacher flags, a low guardian average, or guardian and teachers far apart.
  const lowest = Math.min(...t1.snapshot.template.scale);
  const current = studentAggregates(teacher.filter((r) => r.roundId === t1.id), lowest);
  const before = compareT1 ? studentAggregates(teacher.filter((r) => r.roundId === compareT1.id), lowest) : new Map();
  const guardianMeans = perStudentMeans(guardian.filter((i) => i.roundId === g2?.id));
  const names = new Map(roster.map((s) => [s.erpId, s]));
  const attention = [...new Set([...current.keys(), ...guardianMeans.keys()])]
    .map((erpId) => {
      const t = current.get(erpId);
      const g = guardianMeans.get(erpId) ?? null;
      const reasons = studentFlags(t, before.get(erpId)?.mean ?? null, bn, lowest).map((f) => f.label);
      if (g !== null && g <= LOW_GUARDIAN_MEAN) reasons.push(`অভিভাবকের চোখে গড় ${bn(g.toFixed(1))}`);
      if (g !== null && t?.mean != null && Math.abs(g - t.mean) >= GAP_MARKS) reasons.push(`অভিভাবক ও শিক্ষকের মতে ${bn(Math.abs(g - t.mean).toFixed(1))} পার্থক্য`);
      const student = names.get(erpId);
      return student && reasons.length ? { erpId, name: titleCase(student.name), place: progress.find((p) => place(student, p))?.label ?? '', reasons } : null;
    })
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .sort((a, b) => b.reasons.length - a.reasons.length || a.name.localeCompare(b.name));

  const kpi = (now: number | null, then: number | null) => ({ mean: now, delta: delta(now, then) });
  return {
    g1,
    g2,
    compareT1,
    kpis: {
      teaching: kpi(meanOf(g1?.id, guardian), meanOf(cg1?.id, guardian)),
      guardian: kpi(meanOf(g2?.id, guardian), meanOf(cg2?.id, guardian)),
      teacher: kpi(meanOf(t1.id, teacher), meanOf(compareT1?.id, teacher)),
      response: { g1: g1Done.size, g2: g2Done.size, total },
    },
    heat,
    progress,
    trend: pairs.map((p) => ({ label: p.t1.label, teacher: meanOf(p.t1.id, teacher), guardian: meanOf(p.g2?.id, guardian), teaching: meanOf(p.g1?.id, guardian) })),
    attention,
    assessed: new Set([...current.keys(), ...guardianMeans.keys()]).size,
  };
}
