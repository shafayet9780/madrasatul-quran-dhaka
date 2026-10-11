import type { AnswerValue } from './answers';
import { longDate, num, txt, type Locale } from './display';
import { FILE_MISSING, type FormField, type Transport } from './form-config';
import { formatMobile, normaliseMobile } from './normalise';
import { stopText } from './transport';

export type AnswerLabels = { yes: string; no: string; notGiven: string; fileAttached: (type: string) => string; fileMissing: string };

/** One answer as text, the way the review page, the PDF and the admin show it. */
export function answerText(field: FormField, value: AnswerValue | undefined, locale: Locale, labels: AnswerLabels, transport?: Transport): string {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) return labels.notGiven;
  if (field.type === 'file' && value === FILE_MISSING) return labels.fileMissing;
  const option = (v: string) => txt(field.options.find((o) => o.value === v)?.label, locale) || v;
  if (typeof value === 'object' && !Array.isArray(value)) return labels.fileAttached(value.type === 'application/pdf' ? 'PDF' : 'JPG');
  if (Array.isArray(value)) return value.map(option).join(', ');
  const s = String(value);
  switch (field.type) {
    case 'select':
    case 'radio':
      return option(s);
    case 'transportStop':
      return stopText(transport, s, locale) ?? option(s);
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
