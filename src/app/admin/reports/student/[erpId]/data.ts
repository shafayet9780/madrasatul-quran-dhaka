import 'server-only';
import { chosenRoundId } from '@/lib/survey/admin-shell';
import { gapFlag, sharedAreaGap } from '@/lib/survey/guardian-report-math';
import { allReportRounds, studentGuardian } from '@/lib/survey/guardian-reports';
import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import { GUARDIAN_AREAS } from '@/lib/survey/report-math';
import { pickRound, studentReport } from '@/lib/survey/reports';

// One student's three reviews for the student page and its internal print.

/** 8801712345678 → ০১৭১২-৩৪৫৬৭৮; a foreign number keeps its country code: +৪৯১৬৩… */
function localMobile(mobile: string | null) {
  if (!mobile) return null;
  if (!mobile.startsWith('8801')) return bn(`+${mobile}`);
  const local = mobile.replace(/^88/, '');
  return bn(`${local.slice(0, 5)}-${local.slice(5)}`);
}

export function average(marks: (number | null)[]): number | null {
  const counted = marks.filter((m) => m !== null);
  return counted.length ? counted.reduce((sum, m) => sum + m, 0) / counted.length : null;
}

export const submittedBy = (form: { who: string | null; relation: string | null }) => `${form.who ?? ''}${form.relation ? ` (${form.relation})` : ''}`;

export async function studentPageData(erpId: string, requestedRound: string | undefined) {
  const all = await allReportRounds();
  const round = pickRound(
    all.filter((r) => r.kind === 'T1'),
    await chosenRoundId(requestedRound)
  );
  if (!round) return { round: null } as const;
  const report = await studentReport(round, erpId);
  if (!report) return { round, report: null } as const;
  const { student } = report;
  const guardian = await studentGuardian(round, all, erpId, student, { verifiedOnly: false });
  const marked = (list: { areaKey: string; mean: number | null }[]) => new Map(list.filter((a) => a.mean !== null).map((a) => [a.areaKey, a.mean!]));
  // Guardian against teachers on the areas both rated (the গড় row and the flag).
  const shared = sharedAreaGap(marked(guardian.areas), marked(report.areas));
  const guardianAreas = new Map(guardian.areas.map((a) => [a.areaKey, a]));
  const teacherAreas = new Map(report.areas.map((a) => [a.areaKey, a]));
  const areas = [...new Set([...report.areas.map((a) => a.areaKey), ...guardian.areas.map((a) => a.areaKey)])].map((key) => {
    const g = guardianAreas.get(key);
    const t = teacherAreas.get(key);
    return { key, name: (t ?? g)!.name, guardian: g?.mean ?? null, teacher: t?.mean ?? null };
  });
  // The comparison: areas both surveys ask about (the teacher questions about the guardian stay out).
  const t1Questions = round.snapshot.template.questions;
  const t1AreaKeys = new Set(t1Questions.map((q) => q.areaKey));
  const g2AreaKeys = new Set(guardian.g2?.snapshot.template.questions.filter((q) => !q.unscored).map((q) => q.areaKey) ?? []);
  const compared = areas.filter((a) => t1AreaKeys.has(a.key) && g2AreaKeys.has(a.key) && !GUARDIAN_AREAS.has(a.key));
  const guardianOnly = areas.filter((a) => !compared.includes(a) && a.guardian !== null && a.teacher === null);
  const teacherOnly = areas.filter((a) => !compared.includes(a) && a.teacher !== null && a.guardian === null);
  const teacherTotal = shared?.teacher ?? average(compared.map((a) => a.teacher));

  // Attention: the flags, then whatever has not come in yet.
  const flags = [...report.flags, gapFlag(shared, bn)].filter((f) => f !== null);
  const teacherMissing = report.grid.filter((row) => !row.marks).map((row) => row.subject);
  const missing = [
    teacherMissing.length ? `শিক্ষক (${teacherMissing.join(', ')})` : null,
    guardian.g2 && !guardian.form ? 'অভিভাবক · শিক্ষার্থী' : null,
    guardian.g1 && !guardian.g1Form ? 'অভিভাবক · ক্লাস পরিচালনা' : null,
  ].filter((m) => m !== null);

  // A kept duplicate gives a subject two columns; count subjects, not columns.
  const rated = new Set(report.grid.filter((row) => row.marks).map((row) => row.subject)).size;
  const subjectCount = new Set(report.grid.map((row) => row.subject)).size;
  // A teacher's average for the child leaves out the questions about the guardian (as everywhere else).
  const childQuestion = t1Questions.map((q) => !GUARDIAN_AREAS.has(q.areaKey));
  // The class-management review: the guardian's average per subject (the guardian's copy shows these).
  const g1Averages = guardian.g1Subjects.map((s) => ({
    ...s,
    mean: average(guardian.g1Answers.map((q) => q.marks.get(s.key)).map((m) => (m === 'na' || m === undefined ? null : m))),
  }));

  return {
    round,
    report,
    student,
    guardian,
    shared,
    compared,
    guardianOnly,
    teacherOnly,
    teacherTotal,
    flags,
    missing,
    teacherMissing,
    rated,
    subjectCount,
    t1Questions,
    childQuestion,
    g1Averages,
    father: localMobile(student.fatherMobile),
    mother: localMobile(student.motherMobile),
    classHref: `/admin/reports/class?${new URLSearchParams({ round: round.id, class: student.classKey, section: student.sectionKey })}`,
  };
}

export type StudentPage = Extract<Awaited<ReturnType<typeof studentPageData>>, { student: unknown }>;
