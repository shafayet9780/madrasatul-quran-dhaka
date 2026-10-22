import type { Locale } from '@/lib/i18n';
import { dayInWords, monthInWords, num } from '../gallery/albums';

// The notice board (docs/notices.md): Studio → Notices in the page's language. Pure, so the pages and the tests share it.

export const NOTICE_TYPES = ['admission', 'holiday', 'exam', 'general'] as const;
export type NoticeType = (typeof NOTICE_TYPES)[number];

type Bi = { bengali?: string; english?: string };

/** A picture (a photo or scan of the paper notice) or a PDF, as the query sends it; `src` is the local preview's. */
export type NoticeAttachmentIn = {
  _type?: 'image' | 'file';
  _key?: string;
  asset?: { _ref?: string };
  src?: string;
  url?: string;
  size?: number;
  name?: Bi;
  alt?: Bi;
  ratio?: number;
};

export type NoticeIn = {
  _id?: string;
  number?: { year?: number; serial?: number };
  title?: Bi;
  date?: string;
  type?: string;
  body?: Bi;
  pinnedUntil?: string;
  attachments?: NoticeAttachmentIn[];
};

export type NoticeFile = { key: string; name: string; url: string; size: string };
export type NoticePicture = { key: string; attachment: NoticeAttachmentIn; alt: string; ratio: number };

export type Notice = {
  key: string;
  /** `2026-17`: the link (/notices/2026-17). */
  slug: string;
  /** `২০২৬/১৭` or `2026/17`. */
  number: string;
  date: string;
  dateText: string;
  day: string;
  weekday: string;
  /** `2026-10`. */
  month: string;
  type: NoticeType;
  title: string;
  body: string[];
  /** The first paragraph, for the list. */
  excerpt: string;
  /** The language the title and text are in: Bengali on an English page when the notice has no English. */
  lang: Locale;
  pinned: boolean;
  isNew: boolean;
  files: NoticeFile[];
  pictures: NoticePicture[];
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^(\d{4})-(\d{1,4})$/;
const intl = (locale: Locale) => (locale === 'bengali' ? 'bn-BD' : 'en-GB');
const clean = (v: Bi | undefined, locale: Locale) => v?.[locale]?.trim() ?? '';

/** Today in Dhaka, `YYYY-MM-DD`. */
export const dhakaToday = (now = new Date()) => now.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

/** The link's end (`2026-17`) as a notice number, or null. */
export function parseNoticeSlug(slug: string): { year: number; serial: number } | null {
  const m = SLUG.exec(slug);
  return m ? { year: Number(m[1]), serial: Number(m[2]) } : null;
}

/** A file's size as people read it: ২৪০ KB, 1.2 MB. */
export function fileSize(bytes: number | undefined, locale: Locale): string {
  if (!bytes || bytes <= 0) return '';
  const mb = bytes / (1024 * 1024);
  const value = mb >= 1 ? mb : Math.max(1, Math.round(bytes / 1024));
  return `${value.toLocaleString(intl(locale), { maximumFractionDigits: 1, useGrouping: false })} ${mb >= 1 ? 'MB' : 'KB'}`;
}

const daysFrom = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

/**
 * A notice in the page's language, or null when it cannot be shown (no number, title, date or known type, or neither
 * text nor an attachment). An English page shows a notice in Bengali (`lang`) unless its English is whole: a title, and
 * a text when the Bengali has one. It is new for its first seven days and pinned until its pin date, both counted in
 * Dhaka's days.
 */
export function toNotice(n: NoticeIn, locale: Locale, today: string): Notice | null {
  const { year, serial } = n.number ?? {};
  const english = Boolean(clean(n.title, 'english') && (clean(n.body, 'english') || !clean(n.body, 'bengali')));
  const lang: Locale = locale === 'english' && english ? 'english' : 'bengali';
  const title = clean(n.title, lang);
  if (!year || !serial || !title || !n.date || !DATE.test(n.date) || !NOTICE_TYPES.includes(n.type as NoticeType)) return null;

  const body = clean(n.body, lang)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const files = (n.attachments ?? []).flatMap((a, i): NoticeFile[] =>
    a._type === 'file' && a.url ? [{ key: a._key ?? `file-${i}`, name: clean(a.name, lang) || clean(a.name, 'bengali') || title, url: a.url, size: fileSize(a.size, locale) }] : [],
  );
  const pictures = (n.attachments ?? []).flatMap((a, i): NoticePicture[] =>
    a._type === 'image' && (a.asset?._ref || a.src)
      ? [{ key: a._key ?? `image-${i}`, attachment: a, alt: clean(a.alt, lang) || clean(a.alt, 'bengali'), ratio: a.ratio && a.ratio > 0 ? a.ratio : 1 / Math.SQRT2 }]
      : [],
  );
  if (!body.length && !files.length && !pictures.length) return null;

  const at = new Date(`${n.date}T00:00:00Z`);
  const age = daysFrom(n.date, today);
  return {
    key: n._id ?? `${year}-${serial}`,
    slug: `${year}-${serial}`,
    number: `${num(year, locale)}/${num(serial, locale)}`,
    date: n.date,
    dateText: dayInWords(n.date, locale),
    day: num(at.getUTCDate(), locale),
    weekday: new Intl.DateTimeFormat(intl(locale), { weekday: 'long', timeZone: 'UTC' }).format(at),
    month: n.date.slice(0, 7),
    type: n.type as NoticeType,
    title,
    body,
    excerpt: body[0] ?? '',
    lang,
    pinned: Boolean(n.pinnedUntil && DATE.test(n.pinnedUntil) && n.pinnedUntil >= today),
    isNew: age >= 0 && age < 7,
    files,
    pictures,
  };
}

/** Newest first: by date, then by number. */
export const newestFirst = (a: Notice, b: Notice) => b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug, 'en', { numeric: true });

export type NoticeMonth = { key: string; year: string; label: string; notices: Notice[] };

/** The notices month by month, newest first (pinned ones keep their place, so the numbers have no gaps). */
export function noticeMonths(notices: Notice[], locale: Locale): NoticeMonth[] {
  const months = new Map<string, NoticeMonth>();
  for (const n of [...notices].sort(newestFirst)) {
    const month = months.get(n.month) ?? { key: n.month, year: n.month.slice(0, 4), label: monthInWords(n.month, locale), notices: [] };
    month.notices.push(n);
    months.set(n.month, month);
  }
  return [...months.values()];
}

/** The notice before (older) and after (newer) this one on the board. */
export function noticeNeighbours(notices: Notice[], slug: string): { older: Notice | null; newer: Notice | null } {
  const sorted = [...notices].sort(newestFirst);
  const i = sorted.findIndex((n) => n.slug === slug);
  if (i < 0) return { older: null, newer: null };
  return { older: sorted[i + 1] ?? null, newer: sorted[i - 1] ?? null };
}
