import { formatSheetTime } from './dates';
import { answerText } from './guardian-logic';
import { questionLabel, referenceNumber } from './labels';
import { titleCase } from './normalise';
import { classifyAnswer, compareStudents, type RoundSnapshot } from './snapshot';

// Rows for the "Survey Responses" Google Sheet: one tab per round, one row per student,
// appended again whenever a submission's status changes (append-only history).

export type SheetStatus = 'current' | 'superseded' | 'set-aside' | 'duplicate';

const STATUS_LABEL: Record<SheetStatus, string> = {
  current: 'বর্তমান',
  superseded: 'পুরনো (সংশোধিত)',
  'set-aside': 'বাদ (অ্যাডমিন সিদ্ধান্ত)',
  duplicate: 'ডুপ্লিকেট',
};

export function t1SheetHeader(snapshot: RoundSnapshot): string[] {
  return [
    'জমার সময়',
    'রেফারেন্স',
    'অবস্থা',
    'শিক্ষক',
    'শ্রেণি',
    'শাখা',
    'বিষয়',
    'রোল',
    'শিক্ষার্থী ID',
    'শিক্ষার্থী',
    ...snapshot.template.questions.map((q, i) => `${i + 1}. ${questionLabel(q)}`),
    'নোট',
  ];
}

/** `setAside`: superseded by another teacher's batch (the admin kept that one). */
export function sheetStatus(submission: { supersededBy: string | null; duplicateFlag: boolean; setAside?: boolean }): SheetStatus {
  if (submission.supersededBy) return submission.setAside ? 'set-aside' : 'superseded';
  return submission.duplicateFlag ? 'duplicate' : 'current';
}

export function t1SheetRows(
  snapshot: RoundSnapshot,
  submission: {
    id: string;
    submittedAt: Date;
    supersededBy: string | null;
    duplicateFlag: boolean;
    teacherName: string | null;
    classKey: string;
    sectionKey: string;
    subjectName: string | null;
    setAside?: boolean;
  },
  responses: { studentErpId: string; studentName: string; roll: number | null; answers: Record<string, unknown>; note: string | null }[]
): (string | number)[][] {
  const cls = snapshot.classes.find((c) => c.key === submission.classKey);
  const section = cls?.sections.find((s) => s.key === submission.sectionKey);
  const status = STATUS_LABEL[sheetStatus(submission)];
  return responses
    .map((r) => ({ ...r, name: titleCase(r.studentName), erpId: r.studentErpId }))
    .sort(compareStudents)
    .map((r) => [
      formatSheetTime(submission.submittedAt),
      referenceNumber(submission.id, false),
      status,
      submission.teacherName ?? '',
      cls?.name ?? submission.classKey,
      section?.name ?? '',
      submission.subjectName ?? '',
      r.roll ?? '',
      r.erpId,
      r.name,
      ...snapshot.template.questions.map((q) => (typeof r.answers[q.key] === 'number' ? (r.answers[q.key] as number) : '')),
      r.note ?? '',
    ]);
}

/** Guardian rounds: G2 one row per form; G1 one row per form and subject of the child's class. */
export function guardianSheetHeader(snapshot: RoundSnapshot): string[] {
  return [
    'জমার সময়',
    'রেফারেন্স',
    'অবস্থা',
    'শ্রেণি',
    'শাখা',
    'রোল',
    'শিক্ষার্থী ID',
    'শিক্ষার্থী',
    'প্রদানকারী',
    'সম্পর্ক',
    'মোবাইল',
    'যাচাই',
    ...(snapshot.template.kind === 'G1' ? ['বিষয়'] : []),
    ...snapshot.template.questions.map((q, i) => `${i + 1}. ${questionLabel(q)}`),
    'মন্তব্য',
  ];
}

export function guardianSheetRows(
  snapshot: RoundSnapshot,
  submission: {
    id: string;
    submittedAt: Date;
    supersededBy: string | null;
    classKey: string;
    sectionKey: string;
    submitterName: string | null;
    submitterRelation: string | null;
    submitterMobile: string | null;
    verified: boolean | null;
    comment: string | null;
  },
  response: { studentErpId: string; studentName: string; roll: number | null; answers: Record<string, unknown> }
): (string | number)[][] {
  const { template } = snapshot;
  const cls = snapshot.classes.find((c) => c.key === submission.classKey);
  const section = cls?.sections.find((s) => s.key === submission.sectionKey);
  const front = [
    formatSheetTime(submission.submittedAt),
    referenceNumber(submission.id, false),
    // The newer form may be another guardian's, so not "corrected": just earlier.
    submission.supersededBy ? 'আগের' : STATUS_LABEL.current,
    cls?.name ?? submission.classKey,
    section?.name ?? '',
    response.roll ?? '',
    response.studentErpId,
    titleCase(response.studentName),
    submission.submitterName ?? '',
    submission.submitterRelation ?? '',
    submission.submitterMobile ? `+${submission.submitterMobile}` : '',
    submission.verified ? 'যাচাইকৃত' : 'অযাচাইকৃত',
  ];
  const comment = submission.comment ?? '';
  if (template.kind !== 'G1') {
    return [[...front, ...template.questions.map((q) => answerText(q, template.scale, response.answers[q.key]) ?? ''), comment]];
  }
  return (cls?.subjects ?? []).map((subject) => [
    ...front,
    subject.name,
    ...template.questions.map((q) => {
      const answer = classifyAnswer(q, template.scale, (response.answers[q.key] as Record<string, unknown> | undefined)?.[subject.key]);
      return answer.kind === 'mark' ? answer.mark : '';
    }),
    comment,
  ]);
}
