import type { LookupRequest } from './guardian-types';
import { normaliseMobile, normaliseStudentId } from './normalise';
import { classifyAnswer, type RoundSnapshot } from './snapshot';

/** The typed ID or mobile in the stored form, or null when it cannot match anything. */
export function lookupValue(by: LookupRequest['by'], input: string): string | null {
  if (by === 'mobile') return normaliseMobile(input);
  const id = normaliseStudentId(input);
  return /^[0-9A-Za-z]{1,20}$/.test(id) ? id : null;
}

/** What the lookup log keeps of a typed value: the last 4 characters only. */
export function inputTail(value: string): string {
  return value.slice(-4);
}

/**
 * Verified = the submitter's mobile is the student's father or mother mobile from the ERP.
 * `mobile` is already canonical (normaliseMobile once, where it was typed): normalising a foreign
 * number twice loses it, because the canonical form has no "+".
 */
export function isVerified(mobile: string | null, student: { fatherMobile: string | null; motherMobile: string | null }): boolean {
  return Boolean(mobile && (mobile === student.fatherMobile || mobile === student.motherMobile));
}

export type AnswerItemValue = { questionKey: string; subjectKey: string; areaKey: string; optionKey: string | null; mark: number | null; isNa: boolean };

/**
 * Checks a guardian's answers against the round's template and returns one answer item per
 * question (G2) or per question × subject of the child's class (G1), or what is still missing.
 */
export function guardianAnswerItems(
  snapshot: Pick<RoundSnapshot, 'template' | 'classes'>,
  classKey: string,
  answers: Record<string, unknown>
): { items: AnswerItemValue[]; missing: string[]; clean: Record<string, unknown> } {
  const { template } = snapshot;
  const items: AnswerItemValue[] = [];
  const missing: string[] = [];
  const clean: Record<string, unknown> = {};
  const subjects = template.kind === 'G1' ? (snapshot.classes.find((c) => c.key === classKey)?.subjects ?? []) : [];
  for (const question of template.questions) {
    const given = answers[question.key];
    if (template.kind === 'G1') {
      const bySubject = given && typeof given === 'object' ? (given as Record<string, unknown>) : {};
      const kept: Record<string, unknown> = {};
      for (const subject of subjects) {
        const answer = classifyAnswer(question, template.scale, bySubject[subject.key]);
        if (answer.kind === 'invalid') {
          if (question.required) missing.push(`${question.key}|${subject.key}`);
          continue;
        }
        kept[subject.key] = bySubject[subject.key];
        items.push({ questionKey: question.key, subjectKey: subject.key, areaKey: question.areaKey, optionKey: null, mark: answer.kind === 'mark' ? answer.mark : null, isNa: answer.kind === 'na' });
      }
      if (Object.keys(kept).length) clean[question.key] = kept;
      continue;
    }
    const answer = classifyAnswer(question, template.scale, given);
    if (answer.kind === 'invalid') {
      if (question.required) missing.push(question.key);
      continue;
    }
    clean[question.key] = given;
    items.push({
      questionKey: question.key,
      subjectKey: '',
      areaKey: question.areaKey,
      optionKey: answer.kind === 'mark' && question.type === 'options' ? String(given) : null,
      mark: answer.kind === 'mark' ? answer.mark : null,
      isNa: answer.kind === 'na',
    });
  }
  return { items, missing, clean };
}

/** The relation as stored and printed: পিতা / মাতা, or what the guardian wrote. Null when "other" is empty. */
export function relationText(relation: 'father' | 'mother' | 'other', other: string): string | null {
  if (relation === 'father') return 'পিতা';
  if (relation === 'mother') return 'মাতা';
  return other.trim() || null;
}
