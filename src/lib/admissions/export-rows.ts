import type { AnswerValue, Answers } from './answers';
import { STATUS_LABEL, type ApplicationStatus } from './admin-labels';
import { txt } from './display';
import { allFields, type FormField, type FormSnapshot, type Role } from './form-config';
import { normaliseMobile } from './normalise';

// One row per paid application for the Excel export and the Google Sheet copy (ERP-ready: one
// column per form field, ASCII digits, ISO dates, mobiles as 01XXXXXXXXX). Pure.

export type ExportApplication = {
  publicRef: string | null;
  status: ApplicationStatus;
  locale: string;
  primaryMobile: string;
  email: string;
  studentNameBn: string | null;
  studentNameEn: string | null;
  dateOfBirth: string | null;
  answers: Answers;
  createdAt: Date;
  submittedAt: Date | null;
  paidAt: Date | null;
  attendedAt: Date | null;
  evalFeeReceivedAt: Date | null;
};
export type ExportPayment = { amount: number; tranId: string; bankTranId: string | null; cardType: string | null } | null;

/** Answered in the fixed columns, so not repeated among the field columns. */
const FIXED_ROLES: readonly Role[] = ['studentNameBn', 'studentNameEn', 'dateOfBirth', 'primaryMobile', 'email'];

const FIXED_HEADER = [
  'আবেদন আইডি',
  'অবস্থা',
  'শিক্ষার্থীর নাম',
  'Student name',
  'জন্ম তারিখ',
  'অভিভাবকের মোবাইল',
  'ইমেইল',
  'আবেদন ফি (৳)',
  'পরিশোধের সময়',
  'পেমেন্ট মাধ্যম',
  'Tran ID',
  'Bank Tran ID',
  'উপস্থিত',
  'মূল্যায়ন ফি',
  'ফর্মের ভাষা',
  'আবেদন শুরু',
];

const fieldColumns = (snapshot: FormSnapshot) => allFields(snapshot).filter((f) => !(f.role && FIXED_ROLES.includes(f.role)));

/** "2026-10-07 14:05" in Dhaka time. */
export function dhakaTime(d: Date | null): string {
  if (!d) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`;
}

/** Canonical `8801712345678` → `01712345678` (foreign numbers keep `+`). */
const plainMobile = (canonical: string) => (/^8801\d{9}$/.test(canonical) ? canonical.slice(2) : `+${canonical}`);

export function exportValue(field: FormField, value: AnswerValue | undefined): string {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) return '';
  const option = (v: string) => txt(field.options.find((o) => o.value === v)?.label, 'bengali') || v;
  if (typeof value === 'object' && !Array.isArray(value)) return 'আছে';
  if (Array.isArray(value)) return value.map(option).join(', ');
  const s = String(value);
  if (field.type === 'select' || field.type === 'radio') return option(s);
  if (field.type === 'yesno') return s === 'yes' ? 'হ্যাঁ' : s === 'no' ? 'না' : s;
  if (field.type === 'tel') {
    const canonical = normaliseMobile(s);
    return canonical ? plainMobile(canonical) : s;
  }
  return s;
}

export function exportHeader(snapshot: FormSnapshot): string[] {
  const fields = fieldColumns(snapshot);
  const counts = new Map<string, number>();
  for (const f of fields) counts.set(txt(f.label, 'bengali'), (counts.get(txt(f.label, 'bengali')) ?? 0) + 1);
  const sectionOf = new Map(snapshot.sections.flatMap((s) => s.fields.map((f) => [f.key, txt(s.title, 'bengali')] as const)));
  // The same label in two chapters (পেশা for father and mother) gets the chapter's name.
  const names = fields.map((f) => {
    const name = txt(f.label, 'bengali') || f.key;
    return (counts.get(name) ?? 0) > 1 ? `${name} (${sectionOf.get(f.key)})` : name;
  });
  return [...FIXED_HEADER, ...names];
}

export function exportRow(snapshot: FormSnapshot, app: ExportApplication, payment: ExportPayment): string[] {
  return [
    app.publicRef ?? '',
    STATUS_LABEL[app.status],
    app.studentNameBn ?? '',
    app.studentNameEn ?? '',
    app.dateOfBirth ?? '',
    plainMobile(app.primaryMobile),
    app.email,
    payment ? String(payment.amount) : '',
    dhakaTime(app.paidAt),
    payment?.cardType ?? '',
    payment?.tranId ?? '',
    payment?.bankTranId ?? '',
    dhakaTime(app.attendedAt),
    dhakaTime(app.evalFeeReceivedAt),
    app.locale === 'english' ? 'English' : 'বাংলা',
    dhakaTime(app.createdAt),
    ...fieldColumns(snapshot).map((f) => exportValue(f, app.answers[f.key])),
  ];
}
