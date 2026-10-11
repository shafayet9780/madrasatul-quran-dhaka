import { parseIsoDate } from './age';
import { FILE_MISSING, allFields, type FormField, type FormSection, type FormSnapshot } from './form-config';
import { normaliseEmail, normaliseMobile, toAsciiDigits } from './normalise';

// Answers are stored per field key. The same rules run in the browser (inline errors, chapter
// status) and on the server (autosave, submit), so they can never disagree.

/** A document uploaded to the private store and linked to the application. */
export type FileAnswer = { key: string; name: string; size: number; type: string };
export type AnswerValue = string | string[] | number | FileAnswer;
export type Answers = Record<string, AnswerValue>;

export type AnswerError = 'required' | 'invalid' | 'invalid_option' | 'invalid_mobile' | 'invalid_email' | 'invalid_date' | 'invalid_number' | 'class_requirement';

const MAX_TEXT = 500;
const MAX_LONG_TEXT = 3000;

const isFileAnswer = (v: unknown): v is FileAnswer =>
  !!v && typeof v === 'object' && !Array.isArray(v) && typeof (v as FileAnswer).key === 'string' && typeof (v as FileAnswer).name === 'string';

const optionValues = (f: FormField) => new Set(f.options.map((o) => o.value));

/** A file field answered with "don't have it now". */
export const isMissingFile = (f: FormField, v: unknown) => f.type === 'file' && !!f.allowMissing && v === FILE_MISSING;

/**
 * Ticking a checkbox option. Options marked "only this choice": ticking one keeps only it; ticking
 * another option drops it. (Unticking is a plain removal.)
 */
export function tickChoice(f: FormField, current: string[], added: string): string[] {
  const exclusive = new Set(f.options.filter((o) => o.exclusive).map((o) => o.value));
  if (exclusive.has(added)) return [added];
  return [...current.filter((v) => !exclusive.has(v)), added];
}

/** Whether a "show only when" condition holds for the answers (no condition always holds). */
export function conditionMet(condition: FormField['showWhen'], answers: Answers): boolean {
  if (!condition) return true;
  const answer = answers[condition.field];
  const given = Array.isArray(answer) ? answer : typeof answer === 'string' ? [answer] : [];
  return given.some((v) => condition.values.includes(v));
}

/** Whether a field is shown, given the answers so far (show-when on an earlier choice/yes-no field). */
export function isVisible(field: FormField, answers: Answers): boolean {
  return conditionMet(field.showWhen, answers);
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
      case 'transportStop':
        if (typeof v === 'string' && optionValues(f).has(v)) out[f.key] = v;
        break;
      case 'yesno':
        if (v === 'yes' || v === 'no') out[f.key] = v;
        break;
      case 'file':
        if (isMissingFile(f, v)) out[f.key] = FILE_MISSING;
        else if (isFileAnswer(v) && isOwnFile(v)) out[f.key] = { key: v.key, name: String(v.name).slice(0, 200), size: Number(v.size) || 0, type: String(v.type).slice(0, 100) };
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
    case 'transportStop':
      return typeof v === 'string' && optionValues(f).has(v) ? { value: v } : { error: 'invalid_option' };
    case 'checkbox': {
      const allowed = optionValues(f);
      if (!Array.isArray(v) || !v.every((x) => allowed.has(x))) return { error: 'invalid_option' };
      // An "only this choice" option cannot be combined with others.
      const exclusive = f.options.filter((o) => o.exclusive).map((o) => o.value);
      return v.length > 1 && v.some((x) => exclusive.includes(x)) ? { error: 'invalid_option' } : { value: v };
    }
    case 'yesno':
      return v === 'yes' || v === 'no' ? { value: v } : { error: 'invalid_option' };
    case 'file':
      return isFileAnswer(v) || isMissingFile(f, v) ? { value: v } : { error: 'invalid' };
  }
}

type Text = FormField['label'];
export type BrokenRequirement = { className: Text; message: Text };

/**
 * Requirements of the chosen class (Studio: class option → Requirements) that the answers break,
 * by the question that shows the message: the question itself when it is answered, else the class
 * (an unanswered required question gets its usual "required" first).
 */
export function classRequirementErrors(fields: FormField[], answers: Answers): Map<string, BrokenRequirement> {
  const out = new Map<string, BrokenRequirement>();
  const classField = fields.find((f) => f.role === 'classApplied');
  const chosen = classField?.options.find((o) => o.value === answers[classField.key]);
  for (const r of chosen?.requires ?? []) {
    if (conditionMet(r, answers)) continue;
    const target = fields.find((f) => f.key === r.field);
    const shown = !!target && isVisible(target, answers);
    const answered = !isEmpty(answers[r.field]);
    const on = shown && answered ? r.field : shown && target.required ? null : classField!.key;
    if (on && !out.has(on)) out.set(on, { className: chosen!.label, message: r.message });
  }
  return out;
}

/**
 * Class options a guardian cannot choose: a requirement's question that comes before the class is
 * answered otherwise (girls only, and "ছেলে" was chosen). A question after the class shows its own
 * message instead, since it may be one the class hides.
 */
export function blockedClasses(fields: FormField[], answers: Answers): string[] {
  const at = fields.findIndex((f) => f.role === 'classApplied');
  if (at < 0) return [];
  const before = new Map(fields.slice(0, at).map((f) => [f.key, f]));
  const breaks = (r: { field: string; values: string[] }) => {
    const target = before.get(r.field);
    return !!target && isVisible(target, answers) && !isEmpty(answers[r.field]) && !conditionMet(r, answers);
  };
  return fields[at].options.filter((o) => (o.requires ?? []).some(breaks)).map((o) => o.value);
}

export type SectionCheck = { errors: Record<string, AnswerError>; values: Answers; required: number; answered: number };

/**
 * Full check of one chapter: required visible fields, formats, normalised values, and the chosen
 * class's requirements when `fields` (every field of the form) is given. Hidden fields are dropped.
 */
export function checkSection(section: FormSection, answers: Answers, fields?: FormField[]): SectionCheck {
  const result: SectionCheck = { errors: {}, values: {}, required: 0, answered: 0 };
  const broken = fields ? classRequirementErrors(fields, answers) : new Map<string, BrokenRequirement>();
  for (const f of section.fields) {
    if (!isVisible(f, answers)) continue;
    const checked = checkField(f, answers[f.key]);
    const { value } = checked;
    const error = checked.error ?? (broken.has(f.key) ? ('class_requirement' as const) : undefined);
    if (f.required) result.required += 1;
    if (f.required && !error) result.answered += 1;
    if (error) result.errors[f.key] = error;
    else if (value !== undefined) result.values[f.key] = value;
  }
  return result;
}

export type ChapterStatus = 'done' | 'in_progress' | 'not_started';

/** Hub status per chapter: done when it has no errors; in progress when anything is answered. */
export function chapterStatus(section: FormSection, answers: Answers, fields?: FormField[]): { status: ChapterStatus; required: number; answered: number } {
  const check = checkSection(section, answers, fields);
  const touched = section.fields.some((f) => !isEmpty(answers[f.key]));
  const status: ChapterStatus = Object.keys(check.errors).length === 0 ? 'done' : touched ? 'in_progress' : 'not_started';
  return { status, required: check.required, answered: check.answered };
}

/** Submit: every chapter checked; returns all errors and the clean answers that will be stored. */
export function checkAll(snapshot: FormSnapshot, answers: Answers): { errors: Record<string, AnswerError>; values: Answers } {
  const errors: Record<string, AnswerError> = {};
  const values: Answers = {};
  const fields = allFields(snapshot);
  for (const s of snapshot.sections) {
    const check = checkSection(s, answers, fields);
    Object.assign(errors, check.errors);
    Object.assign(values, check.values);
  }
  return { errors, values };
}

