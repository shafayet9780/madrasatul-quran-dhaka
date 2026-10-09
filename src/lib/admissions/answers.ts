import { parseIsoDate } from './age';
import { allFields, type FormField, type FormSection, type FormSnapshot } from './form-config';
import { normaliseEmail, normaliseMobile, toAsciiDigits } from './normalise';

// Answers are stored per field key. The same rules run in the browser (inline errors, chapter
// status) and on the server (autosave, submit), so they can never disagree.

/** A document uploaded to the private store and linked to the application. */
export type FileAnswer = { key: string; name: string; size: number; type: string };
export type AnswerValue = string | string[] | number | FileAnswer;
export type Answers = Record<string, AnswerValue>;

export type AnswerError = 'required' | 'invalid' | 'invalid_option' | 'invalid_mobile' | 'invalid_email' | 'invalid_date' | 'invalid_number';

const MAX_TEXT = 500;
const MAX_LONG_TEXT = 3000;

const isFileAnswer = (v: unknown): v is FileAnswer =>
  !!v && typeof v === 'object' && !Array.isArray(v) && typeof (v as FileAnswer).key === 'string' && typeof (v as FileAnswer).name === 'string';

const optionValues = (f: FormField) => new Set(f.options.map((o) => o.value));

/** Whether a field is shown, given the answers so far (show-when on an earlier choice/yes-no field). */
export function isVisible(field: FormField, answers: Answers): boolean {
  if (!field.showWhen) return true;
  const answer = answers[field.showWhen.field];
  const given = Array.isArray(answer) ? answer : typeof answer === 'string' ? [answer] : [];
  return given.some((v) => field.showWhen!.values.includes(v));
}

function isEmpty(v: AnswerValue | undefined): boolean {
  return v == null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
}

/**
 * Autosave: keep what the guardian typed, even if not yet valid, but only for known fields and in
 * the right shape. Choice values must be real options; files must be file records; text is capped.
 * `isOwnFile` lets the server reject file records that do not belong to this application.
 */
export function sanitizeDraft(snapshot: FormSnapshot, input: Record<string, unknown>, isOwnFile: (f: FileAnswer) => boolean = () => true): Answers {
  const out: Answers = {};
  for (const f of allFields(snapshot)) {
    if (!(f.key in input)) continue;
    const v = input[f.key];
    if (v == null || v === '') continue;
    switch (f.type) {
      case 'checkbox': {
        if (!Array.isArray(v)) break;
        const allowed = optionValues(f);
        const values = [...new Set(v.filter((x): x is string => typeof x === 'string' && allowed.has(x)))];
        if (values.length) out[f.key] = values;
        break;
      }
      case 'select':
      case 'radio':
        if (typeof v === 'string' && optionValues(f).has(v)) out[f.key] = v;
        break;
      case 'yesno':
        if (v === 'yes' || v === 'no') out[f.key] = v;
        break;
      case 'file':
        if (isFileAnswer(v) && isOwnFile(v)) out[f.key] = { key: v.key, name: String(v.name).slice(0, 200), size: Number(v.size) || 0, type: String(v.type).slice(0, 100) };
        break;
      case 'number':
        if (typeof v === 'number' && Number.isFinite(v)) out[f.key] = v;
        else if (typeof v === 'string') out[f.key] = v.slice(0, 20);
        break;
      default:
        if (typeof v === 'string') out[f.key] = v.slice(0, f.type === 'textarea' ? MAX_LONG_TEXT : MAX_TEXT);
    }
  }
  return out;
}

/** Checks one field's answer; returns the normalised value or an error. Visibility is the caller's job. */
export function checkField(f: FormField, v: AnswerValue | undefined): { value?: AnswerValue; error?: AnswerError } {
  if (isEmpty(v)) return f.required ? { error: 'required' } : {};
  switch (f.type) {
    case 'text':
    case 'textarea':
      return typeof v === 'string' ? { value: v.trim() } : { error: 'invalid' };
    case 'number': {
      const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(toAsciiDigits(v).trim()) : NaN;
      return Number.isFinite(n) ? { value: n } : { error: 'invalid_number' };
    }
    case 'email': {
      const email = typeof v === 'string' ? normaliseEmail(v) : null;
      return email ? { value: email } : { error: 'invalid_email' };
    }
    case 'tel': {
      const mobile = typeof v === 'string' ? normaliseMobile(v) : null;
      return mobile ? { value: mobile } : { error: 'invalid_mobile' };
    }
    case 'date': {
      const date = typeof v === 'string' ? parseIsoDate(v) : null;
      return date ? { value: v as string } : { error: 'invalid_date' };
    }
    case 'select':
    case 'radio':
      return typeof v === 'string' && optionValues(f).has(v) ? { value: v } : { error: 'invalid_option' };
    case 'checkbox': {
      const allowed = optionValues(f);
      return Array.isArray(v) && v.every((x) => allowed.has(x)) ? { value: v } : { error: 'invalid_option' };
    }
    case 'yesno':
      return v === 'yes' || v === 'no' ? { value: v } : { error: 'invalid_option' };
    case 'file':
      return isFileAnswer(v) ? { value: v } : { error: 'invalid' };
  }
}

export type SectionCheck = { errors: Record<string, AnswerError>; values: Answers; required: number; answered: number };

/** Full check of one chapter: required visible fields, formats, normalised values. Hidden fields are dropped. */
export function checkSection(section: FormSection, answers: Answers): SectionCheck {
  const result: SectionCheck = { errors: {}, values: {}, required: 0, answered: 0 };
  for (const f of section.fields) {
    if (!isVisible(f, answers)) continue;
    const { value, error } = checkField(f, answers[f.key]);
    if (f.required) result.required += 1;
    if (f.required && !error) result.answered += 1;
    if (error) result.errors[f.key] = error;
    else if (value !== undefined) result.values[f.key] = value;
  }
  return result;
}

export type ChapterStatus = 'done' | 'in_progress' | 'not_started';

/** Hub status per chapter: done when it has no errors; in progress when anything is answered. */
export function chapterStatus(section: FormSection, answers: Answers): { status: ChapterStatus; required: number; answered: number } {
  const check = checkSection(section, answers);
  const touched = section.fields.some((f) => !isEmpty(answers[f.key]));
  const status: ChapterStatus = Object.keys(check.errors).length === 0 ? 'done' : touched ? 'in_progress' : 'not_started';
  return { status, required: check.required, answered: check.answered };
}

/** Submit: every chapter checked; returns all errors and the clean answers that will be stored. */
export function checkAll(snapshot: FormSnapshot, answers: Answers): { errors: Record<string, AnswerError>; values: Answers } {
  const errors: Record<string, AnswerError> = {};
  const values: Answers = {};
  for (const s of snapshot.sections) {
    const check = checkSection(s, answers);
    Object.assign(errors, check.errors);
    Object.assign(values, check.values);
  }
  return { errors, values };
}

