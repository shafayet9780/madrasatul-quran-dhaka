import type { AnswerValue } from './answers';
import { longDate, num, txt, type Locale } from './display';
import type { FormField } from './form-config';
import { formatMobile, normaliseMobile } from './normalise';

export type AnswerLabels = { yes: string; no: string; notGiven: string; fileAttached: (type: string) => string };

/** One answer as text, the way the review page, the PDF and the admin show it. */
export function answerText(field: FormField, value: AnswerValue | undefined, locale: Locale, labels: AnswerLabels): string {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) return labels.notGiven;
  const option = (v: string) => txt(field.options.find((o) => o.value === v)?.label, locale) || v;
  if (typeof value === 'object' && !Array.isArray(value)) return labels.fileAttached(value.type === 'application/pdf' ? 'PDF' : 'JPG');
  if (Array.isArray(value)) return value.map(option).join(', ');
  const s = String(value);
  switch (field.type) {
    case 'select':
    case 'radio':
      return option(s);
    case 'yesno':
      return s === 'yes' ? labels.yes : s === 'no' ? labels.no : s;
    case 'date':
      return longDate(s, locale);
    case 'tel': {
      const canonical = normaliseMobile(s);
      return num(canonical ? formatMobile(canonical) : s, locale);
    }
    case 'number':
      return num(s, locale);
    default:
      return s;
  }
}
