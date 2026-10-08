import type { applicationStatus } from './schema';
import { dateTime } from './display';

// Bengali labels for the admin (the office works in Bengali). Pure: used by pages and clients.

export type ApplicationStatus = (typeof applicationStatus.enumValues)[number];

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: 'অসম্পূর্ণ',
  unpaid: 'ফি বাকি',
  paid: 'জমা হয়েছে',
  interview: 'মূল্যায়ন নির্ধারিত',
  evaluated: 'মূল্যায়িত',
  admitted: 'ভর্তি',
  waitlisted: 'অপেক্ষমাণ',
  not_selected: 'নির্বাচিত হয়নি',
  sent_to_erp: 'ERP-তে পাঠানো',
};

/** Statuses the office can set on a paid application, in pipeline order. */
export const OFFICE_STATUSES: ApplicationStatus[] = ['paid', 'interview', 'evaluated', 'admitted', 'waitlisted', 'not_selected', 'sent_to_erp'];

/** Status text colour (outline badges; never a coloured fill). */
export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'muted' | 'default';
export function statusTone(status: ApplicationStatus): Tone {
  if (status === 'admitted' || status === 'sent_to_erp') return 'ok';
  if (status === 'interview' || status === 'evaluated') return 'info';
  if (status === 'unpaid' || status === 'waitlisted') return 'warn';
  if (status === 'not_selected') return 'bad';
  if (status === 'draft') return 'muted';
  return 'default';
}

const EVENT_LABEL: Record<string, string> = {
  created: 'আবেদন শুরু',
  submitted: 'ফর্ম জমা',
  reopened: 'জমার পর তথ্য বদলানো হয়েছে',
  payment_started: 'পেমেন্ট শুরু',
  payment_session_failed: 'পেমেন্ট পাতা খোলা যায়নি',
  paid: 'ফি পরিশোধ নিশ্চিত',
  payment_held_risk: 'পেমেন্ট ঝুঁকিপূর্ণ, যাচাই দরকার',
  payment_mismatch: 'পেমেন্টের পরিমাণ মেলেনি, যাচাই দরকার',
  double_payment: 'দ্বিতীয়বার পরিশোধ, ফেরত দিতে হবে',
  payment_needs_attention: 'পেমেন্ট হয়েছে, আইডি দেওয়া যায়নি',
  email_confirmation: 'নিশ্চিতকরণ ইমেইল পাঠানো',
  email_failed: 'ইমেইল পাঠানো যায়নি',
  status: 'অবস্থা বদল',
  attended: 'উপস্থিত',
  attended_undone: 'উপস্থিতি বাতিল',
  eval_fee: 'মূল্যায়ন ফি গৃহীত',
  eval_fee_undone: 'মূল্যায়ন ফি বাতিল',
  note: 'নোট',
  payment_released: 'অফিস পেমেন্ট গ্রহণ করেছে',
  deleted: 'আবেদন মুছে ফেলা হয়েছে',
};

export const eventLabel = (kind: string) => EVENT_LABEL[kind] ?? kind;

/** Unpaid list: what happened to the payment attempts ("চেষ্টা হয়নি", "ব্যর্থ, ১ বার"). */
export function attemptsText(attempts: number, lastStatus: string | null, bn: (n: number) => string): string {
  if (!attempts) return 'চেষ্টা হয়নি';
  const what = lastStatus === 'cancelled' ? 'বাতিল' : lastStatus === 'held' ? 'যাচাই বাকি' : lastStatus === 'initiated' ? 'চলমান' : 'ব্যর্থ';
  return `${what}, ${bn(attempts)} বার`;
}

const dhakaDay = (d: Date) => Math.floor((d.getTime() + 6 * 60 * 60 * 1000) / 86_400_000);

/** "৭ অক্টো" (Dhaka date). */
export function shortDate(d: Date): string {
  return new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'short', timeZone: 'Asia/Dhaka' }).format(d);
}

/** "আজ, দুপুর ১:১০", "গতকাল", or "৩ অক্টো" for older days. */
export function lastActive(d: Date, now: Date = new Date()): string {
  const days = dhakaDay(now) - dhakaDay(d);
  if (days === 0) return `আজ, ${dateTime(d.toISOString(), 'bengali').split(', ')[1]}`;
  if (days === 1) return 'গতকাল';
  return shortDate(d);
}

/** One line of the activity log on the detail page. */
export function eventText(kind: string, label: string, detail: Record<string, unknown> | null): string {
  const d = detail ?? {};
  switch (kind) {
    case 'status':
      return `অবস্থা বদলেছে: ${STATUS_LABEL[d.status as ApplicationStatus] ?? String(d.status)}`;
    case 'paid':
      return `পেমেন্ট যাচাই হয়েছে, আইডি ${label} দেওয়া হয়েছে`;
    case 'eval_fee':
      return d.receiptNo ? `${eventLabel(kind)} (রসিদ ${String(d.receiptNo)})` : eventLabel(kind);
    case 'email_confirmation':
      return `নিশ্চিতকরণ ইমেইল পাঠানো হয়েছে${d.pdf ? ', আবেদনপত্র সংযুক্ত' : ''}`;
    case 'payment_started':
    case 'double_payment':
    case 'payment_released':
      return d.tranId ? `${eventLabel(kind)} (${String(d.tranId)})` : eventLabel(kind);
    default:
      return eventLabel(kind);
  }
}

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  initiated: 'চলমান বা অসম্পূর্ণ',
  valid: 'SSLCommerz যাচাইকৃত',
  failed: 'ব্যর্থ',
  cancelled: 'বাতিল',
  held: 'যাচাই দরকার',
};
