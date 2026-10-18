// The gallery: albums of photos and videos (Studio → Gallery, sanity/schemas/album.ts). Videos stay on YouTube.
import type { Locale } from '@/lib/i18n';

export const TOPICS = ['quran', 'classes', 'events', 'sports', 'campus'] as const;
export type Topic = (typeof TOPICS)[number];

/** The video's id from a YouTube link (watch, youtu.be, shorts, embed or live), or null. */
export const youtubeId = (url: string | undefined): string | null =>
  url?.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/)?.[1] ?? null;

/** YouTube's cover: 4:3, with bars above and below a wide video (an `object-cover` 16:9 or 9:16 frame crops them away). */
export const youtubeCover = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

type Bi = { bengali?: string; english?: string };

/** A photo as Studio holds it, or (the local preview's samples) a file in /public. */
export type AlbumPhotoIn = { _key?: string; src?: string; asset?: { _ref?: string }; hotspot?: { x?: number; y?: number }; alt?: Bi; caption?: Bi; ratio?: number };
export type AlbumVideoIn = { _key?: string; url?: string; title?: Bi; upright?: boolean; length?: string };
export type AlbumIn = {
  _id: string;
  slug?: string;
  title?: Bi;
  evergreen?: boolean;
  date?: string;
  topic?: Topic;
  summary?: Bi;
  photoCount?: number;
  photos?: AlbumPhotoIn[];
  videos?: AlbumVideoIn[];
  story?: Bi;
  quote?: { text?: Bi; by?: Bi };
};

export type Photo = { key: string; src: string; alt: string; caption: string; ratio: number; position: string };
export type Video = { key: string; id: string; title: string; upright: boolean; length: string; date: string | null; dateText: string; dayText: string; album: string };
export type Album = {
  slug: string;
  title: string;
  topic: Topic;
  /** The day, as YYYY-MM-DD; null for an all-time album. */
  date: string | null;
  /** The day in words (১১ অক্টোবর ২০২৬), and without the year (১১ অক্টোবর) for the month rows. */
  dateText: string;
  dayText: string;
  summary: string;
  photoCount: number;
  photos: Photo[];
  videos: Video[];
  /** Paragraphs; none for a plain album. */
  story: string[];
  quote: { text: string; by: string } | null;
};

const clean = (v: Bi | undefined, locale: Locale) => v?.[locale]?.trim() ?? '';
const intl = (locale: Locale) => (locale === 'bengali' ? 'bn-BD' : 'en-GB');

/** A number in the page's numerals, ungrouped (years as well as counts). */
export const num = (n: number, locale: Locale) => n.toLocaleString(intl(locale), { useGrouping: false });

/** A day (YYYY-MM-DD) in words, with no comma: ১১ অক্টোবর ২০২৬, 11 October 2026; without the year when `year` is false. */
export function dayInWords(date: string, locale: Locale, year = true): string {
  return new Intl.DateTimeFormat(intl(locale), { day: 'numeric', month: 'long', ...(year ? { year: 'numeric' } : {}), timeZone: 'UTC' })
    .formatToParts(new Date(`${date}T00:00:00Z`))
    .filter((p) => p.type !== 'literal')
    .map((p) => p.value)
    .join(' ');
}

/** A month (YYYY-MM) in words: অক্টোবর ২০২৬, October 2026. */
export function monthInWords(month: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intl(locale), { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .formatToParts(new Date(`${month}-01T00:00:00Z`))
    .filter((p) => p.type !== 'literal')
    .map((p) => p.value)
    .join(' ');
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const LENGTH = /^\d{1,2}(:\d{2}){1,2}$/;

/**
 * An album in the page's language, or null when it cannot be shown (no name or link, an unknown topic, no date unless
 * it is all-time, or nothing in it). `photoUrl` turns a Studio photo into its address. A photo needs an address and
 * its description; a video a YouTube link and a name. Links with /shorts/ are upright.
 */
export function toAlbum(a: AlbumIn, locale: Locale, photoUrl: (p: AlbumPhotoIn) => string | undefined): Album | null {
  const title = clean(a.title, locale);
  const date = !a.evergreen && a.date && DATE.test(a.date) ? a.date : null;
  if (!title || !a.slug || !a.topic || !TOPICS.includes(a.topic) || (!a.evergreen && !date)) return null;
  const dateText = date ? dayInWords(date, locale) : '';
  const dayText = date ? dayInWords(date, locale, false) : '';
  const photos = (a.photos ?? []).flatMap((p, i) => {
    const src = photoUrl(p);
    const alt = clean(p.alt, locale);
    if (!src || !alt) return [];
    const { x = 0.5, y = 0.5 } = p.hotspot ?? {};
    const ratio = Math.round((p.ratio && p.ratio > 0 ? p.ratio : 4 / 3) * 1000) / 1000;
    return [{ key: p._key ?? `photo-${i}`, src, alt, caption: clean(p.caption, locale), ratio, position: `${Math.round(x * 100)}% ${Math.round(y * 100)}%` }];
  });
  const videos = (a.videos ?? []).flatMap((v, i) => {
    const id = youtubeId(v.url);
    const name = clean(v.title, locale);
    if (!id || !name) return [];
    const length = v.length && LENGTH.test(v.length) ? (locale === 'bengali' ? v.length.replace(/\d/g, (d) => num(Number(d), locale)) : v.length) : '';
    return [{ key: v._key ?? `video-${i}`, id, title: name, upright: Boolean(v.upright) || /\/shorts\//.test(v.url ?? ''), length, date, dateText, dayText, album: a.slug! }];
  });
  if (!photos.length && !videos.length) return null;
  const quote = clean(a.quote?.text, locale);
  return {
    slug: a.slug,
    title,
    topic: a.topic,
    date,
    dateText,
    dayText,
    summary: clean(a.summary, locale),
    // The list query sends the first three photos and the count; the album query sends them all (and no count).
    photoCount: Math.max(a.photoCount ?? 0, photos.length),
    photos,
    videos,
    story: clean(a.story, locale)
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean),
    quote: quote ? { text: quote, by: clean(a.quote?.by, locale) } : null,
  };
}

/** Newest first; all-time albums last, in Studio order. */
export const byDate = (a: { date: string | null }, b: { date: string | null }) => (b.date ?? '').localeCompare(a.date ?? '');

/** One card in a month row: a dated album with photos, or one of its videos (wide ones; upright ones stay in their own row). */
export type Entry = { kind: 'album'; key: string; topic: Topic; date: string; album: Album } | { kind: 'video'; key: string; topic: Topic; date: string; video: Video };
export type MonthRow = { key: string; year: string; label: string; entries: Entry[] };

/** The dated albums and their wide videos, month by month, newest first. On the same day the album comes first. */
export function monthRows(albums: Album[], locale: Locale): MonthRow[] {
  const entries: Entry[] = albums.flatMap((a) =>
    a.date
      ? [
          ...(a.photos.length ? [{ kind: 'album' as const, key: `a-${a.slug}`, topic: a.topic, date: a.date, album: a }] : []),
          ...a.videos.filter((v) => !v.upright).map((v) => ({ kind: 'video' as const, key: `v-${a.slug}-${v.key}`, topic: a.topic, date: a.date!, video: v })),
        ]
      : [],
  );
  entries.sort((x, y) => y.date.localeCompare(x.date) || (x.kind === y.kind ? 0 : x.kind === 'album' ? -1 : 1));
  const rows: MonthRow[] = [];
  for (const e of entries) {
    const key = e.date.slice(0, 7);
    if (rows.at(-1)?.key !== key) rows.push({ key, year: key.slice(0, 4), label: monthInWords(key, locale), entries: [] });
    rows.at(-1)!.entries.push(e);
  }
  return rows;
}

/** What the filter bar picks: one year (when there are two or more), and a topic or videos only. */
export type Filter = { year: string | null; topic: Topic | 'video' | null };

/** The month rows for a filter. Rows left empty are dropped. */
export function filterRows(rows: MonthRow[], { year, topic }: Filter): MonthRow[] {
  return rows.flatMap((r) => {
    if (year && r.year !== year) return [];
    const entries = r.entries.filter((e) => !topic || (topic === 'video' ? e.kind === 'video' : e.topic === topic));
    return entries.length ? [{ ...r, entries }] : [];
  });
}

/** The filter bar's choices: the years with albums, newest first, and the topics that have any (videos last, when there are any). */
export function filterChoices(rows: MonthRow[]): { years: string[]; topics: (Topic | 'video')[] } {
  const entries = rows.flatMap((r) => r.entries);
  return {
    years: [...new Set(rows.map((r) => r.year))],
    topics: [...TOPICS.filter((t) => entries.some((e) => e.topic === t)), ...(entries.some((e) => e.kind === 'video') ? (['video'] as const) : [])],
  };
}

/** The older and the newer album next to this one, in the gallery's order (all-time albums among themselves). */
export function neighbours(albums: Album[], slug: string): { older: Album | null; newer: Album | null } {
  const at = albums.findIndex((a) => a.slug === slug);
  if (at < 0) return { older: null, newer: null };
  const same = (a: Album | undefined) => (a && Boolean(a.date) === Boolean(albums[at].date) ? a : null);
  return { older: same(albums[at + 1]), newer: same(albums[at - 1]) };
}

/** The album page's structured data: an image gallery of its photos and videos (the videos with their day, when dated). */
export function albumJsonLd(album: Album, url: string, locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: album.title,
    ...(album.summary ? { description: album.summary } : {}),
    url,
    inLanguage: locale === 'bengali' ? 'bn' : 'en',
    ...(album.date ? { datePublished: album.date } : {}),
    associatedMedia: [
      ...album.photos.map((p) => ({ '@type': 'ImageObject', contentUrl: p.src, caption: p.caption || p.alt })),
      ...album.videos.map((v) => ({
        '@type': 'VideoObject',
        name: v.title,
        description: v.title,
        thumbnailUrl: youtubeCover(v.id),
        embedUrl: `https://www.youtube-nocookie.com/embed/${v.id}`,
        url: `https://www.youtube.com/watch?v=${v.id}`,
        ...(v.date ? { uploadDate: v.date } : {}),
      })),
    ],
  };
}
