import type { AnswerValue, Answers } from './answers';
import { fieldWithRole, type FormSnapshot, type Role } from './form-config';
import { normaliseEmail, normaliseMobile } from './normalise';

/** Columns copied from role answers on every save (search, list, PDF header, ERP export). */
export type RoleColumns = {
  primaryMobile: string;
  email: string;
  studentNameBn: string | null;
  studentNameEn: string | null;
  dateOfBirth: string | null;
  classValue: string | null;
  fatherName: string | null;
  motherName: string | null;
  secondaryMobile: string | null;
};

const asText = (v: AnswerValue | undefined) => (typeof v === 'string' && v.trim() ? v.trim() : null);

export function roleAnswer(snapshot: FormSnapshot, answers: Answers, role: Role): AnswerValue | undefined {
  const field = fieldWithRole(snapshot, role);
  return field ? answers[field.key] : undefined;
}

export function roleColumns(snapshot: FormSnapshot, answers: Answers): RoleColumns {
  const text = (role: Role) => asText(roleAnswer(snapshot, answers, role));
  const mobile = (role: Role) => {
    const raw = text(role);
    return raw ? (normaliseMobile(raw) ?? raw) : null;
  };
  const email = text('email');
  return {
    primaryMobile: mobile('primaryMobile') ?? '',
    email: email ? (normaliseEmail(email) ?? email.toLowerCase()) : '',
    studentNameBn: text('studentNameBn'),
    studentNameEn: text('studentNameEn'),
    dateOfBirth: text('dateOfBirth'),
    classValue: text('classApplied'),
    fatherName: text('fatherName'),
    motherName: text('motherName'),
    secondaryMobile: mobile('secondaryMobile'),
  };
}

/** The class code (for the application ID) of the chosen class option, if any. */
export function classCodeFor(snapshot: FormSnapshot, answers: Answers): string | null {
  const field = fieldWithRole(snapshot, 'classApplied');
  const value = field ? answers[field.key] : undefined;
  return field?.options.find((o) => o.value === value)?.code ?? null;
}
