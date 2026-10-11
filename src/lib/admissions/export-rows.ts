import type { AnswerValue, Answers } from './answers';
import { STATUS_LABEL, type ApplicationStatus } from './admin-labels';
import { txt } from './display';
import { FILE_MISSING, NO_ROUTE, NO_ROUTE_LABEL, allFields, type FormField, type FormSnapshot, type Role } from './form-config';
import { normaliseMobile } from './normalise';
import { findStop } from './transport';

// One row per paid application for the Excel export and the Google Sheet copy (ERP-ready: one
// column per form field, ASCII digits, ISO dates, mobiles as 01XXXXXXXXX). The columns come from
// every form version the applications were answered against, so a question deleted in Sanity
// keeps its column; each row reads its answers with its own version. Pure.

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
  snapshotVersion: number;
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
  'অ্যাসেসমেন্ট ফি',
  'ফর্মের ভাষা',
  'আবেদন শুরু',
];

/** A transport stop answer fills these four columns (the area typed in has its own field column). */
const TRANSPORT_HEADER = ['পরিবহন: রুট', 'পরিবহন: গাড়ি', 'পরিবহন: স্টপ', 'পরিবহন: মাসিক ভাড়া (৳)'];

const fieldColumns = (snapshot: FormSnapshot) => allFields(snapshot).filter((f) => !(f.role && FIXED_ROLES.includes(f.role)));

type Column = { field: FormField; section: string };
export type ExportForm = { columns: Column[]; versions: Map<number, FormSnapshot>; latest: FormSnapshot };

/**
 * The columns of the latest version in its order; a field only older versions have goes right
 * after the field it followed there. Labels come from the newest version that has the field.
 */
export function exportForm(versions: Map<number, FormSnapshot>): ExportForm {
  const newestFirst = [...versions.entries()].sort(([a], [b]) => b - a).map(([, s]) => s);
  const latest = newestFirst[0];
  if (!latest) throw new Error('No form version to export');
  const columns: Column[] = [];
  for (const snapshot of newestFirst) {
    const sectionOf = new Map(snapshot.sections.flatMap((s) => s.fields.map((f) => [f.key, txt(s.title, 'bengali')] as const)));
    let at = 0;
    for (const field of fieldColumns(snapshot)) {
      const known = columns.findIndex((c) => c.field.key === field.key);
      if (known >= 0) at = known + 1;
      else columns.splice(at++, 0, { field, section: sectionOf.get(field.key) ?? '' });
    }
  }
  return { columns, versions, latest };
}

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
  if (field.type === 'file' && value === FILE_MISSING) return 'জমা দেওয়া হয়নি, সঙ্গে আনবেন';
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

/** Route, vehicle, stop and monthly charge, read against the routes frozen with the answer's version. */
function transportValues(snapshot: FormSnapshot, value: AnswerValue | undefined): string[] {
  if (value == null || value === '') return ['', '', '', ''];
  if (value === NO_ROUTE) return [NO_ROUTE_LABEL.bengali, '', '', ''];
  const chosen = findStop(snapshot.transport, value);
  if (!chosen) return [String(value), '', '', ''];
  const monthly = chosen.vehicle?.monthly;
  return [txt(chosen.route.name, 'bengali'), txt(chosen.vehicle?.name, 'bengali') || chosen.route.vehicle, txt(chosen.stop.name, 'bengali'), monthly == null ? '' : String(monthly)];
}

export function exportHeader(form: ExportForm): string[] {
  const counts = new Map<string, number>();
  for (const { field } of form.columns) counts.set(txt(field.label, 'bengali'), (counts.get(txt(field.label, 'bengali')) ?? 0) + 1);
  // The same label in two chapters (পেশা for father and mother) gets the chapter's name.
  const named = form.columns.flatMap(({ field, section }) => {
    if (field.type === 'transportStop') return TRANSPORT_HEADER.map((name) => ({ name, key: field.key }));
    const name = txt(field.label, 'bengali') || field.key;
    return [{ name: (counts.get(name) ?? 0) > 1 ? `${name} (${section})` : name, key: field.key }];
  });
  // Still the same (a question deleted and added again under a new key): the key tells them apart.
  const seen = new Map<string, number>();
  for (const { name } of named) seen.set(name, (seen.get(name) ?? 0) + 1);
  return [...FIXED_HEADER, ...named.map(({ name, key }) => ((seen.get(name) ?? 0) > 1 ? `${name} [${key}]` : name))];
}

export function exportRow(form: ExportForm, app: ExportApplication, payment: ExportPayment): string[] {
  const own = form.versions.get(app.snapshotVersion) ?? form.latest;
  const ownFields = new Map(allFields(own).map((f) => [f.key, f]));
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
    ...form.columns.flatMap(({ field: column }) => {
      // The wording (option labels) of the version the guardian answered, when it has the field.
      const mine = ownFields.get(column.key);
      const field = mine?.type === column.type ? mine : column;
      const value = app.answers[field.key];
      return field.type === 'transportStop' ? transportValues(own, value) : [exportValue(field, value)];
    }),
  ];
}
