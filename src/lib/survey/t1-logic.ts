import type { RoundSnapshot } from './snapshot';
import type { BatchKeyInput, DraftRow, MissingMarks, RosterStudent } from './t1-types';

/** Checks a batch key against the round's lists; returns the display names or null. */
export function resolveBatch(snapshot: RoundSnapshot, key: BatchKeyInput) {
  const teacher = snapshot.teachers.find((t) => t.key === key.teacherKey);
  const cls = snapshot.classes.find((c) => c.key === key.classKey);
  if (!teacher || !cls) return null;
  const sectionOk = cls.sections.length ? cls.sections.some((s) => s.key === key.sectionKey) : key.sectionKey === '';
  const subject = cls.subjects.find((s) => s.key === key.subjectKey);
  if (!sectionOk || !subject) return null;
  return { teacherName: teacher.name, subjectName: subject.name };
}

/** Keeps only answers to rating questions with marks on the scale; null when anything is invalid. */
export function validRowAnswers(snapshot: RoundSnapshot, row: DraftRow): Record<string, number> | null {
  const { questions, scale } = snapshot.template;
  const answers: Record<string, number> = {};
  for (const [questionKey, mark] of Object.entries(row.answers ?? {})) {
    const question = questions.find((q) => q.key === questionKey);
    if (!question || question.type !== 'marks' || !scale.includes(mark)) return null;
    answers[questionKey] = mark;
  }
  return answers;
}

/** Students without a valid mark, per required question, in roster order. */
export function findMissing(
  snapshot: RoundSnapshot,
  roster: RosterStudent[],
  answers: Map<string, Record<string, unknown>>
): MissingMarks[] {
  const { questions, scale } = snapshot.template;
  return questions
    .filter((q) => q.required)
    .map((q) => ({
      questionKey: q.key,
      students: roster
        .filter((s) => !scale.includes(answers.get(s.erpId)?.[q.key] as number))
        .map((s) => ({ erpId: s.erpId, name: s.name })),
    }))
    .filter((m) => m.students.length > 0);
}

type ItemContext = {
  submissionId: string;
  roundId: string;
  teacherKey: string;
  classKey: string;
  sectionKey: string;
  subjectKey: string;
};

/** Flat report rows for a submitted T1 batch: one per student × answered question. */
export function t1AnswerItems(
  snapshot: RoundSnapshot,
  context: ItemContext,
  responses: { id: string; studentErpId: string; answers: Record<string, unknown> }[]
) {
  const { questions, scale } = snapshot.template;
  return responses.flatMap((response) =>
    questions
      .filter((q) => scale.includes(response.answers[q.key] as number))
      .map((q) => ({
        ...context,
        kind: 'T1' as const,
        responseId: response.id,
        studentErpId: response.studentErpId,
        questionKey: q.key,
        areaKey: q.areaKey,
        optionKey: null,
        mark: response.answers[q.key] as number,
        isNa: false,
      }))
  );
}
