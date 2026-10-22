// The Campus page: one school day, stop by stop (Studio → Campus: a day, sanity/schemas/campusDay.ts).
import type { Locale } from '@/lib/i18n';

export type StopKind = 'approach' | 'arrive' | 'entrance' | 'floor' | 'rooms' | 'leave' | 'moments' | 'roof' | 'field' | 'exit' | 'other';
export type Sky = 'dawn' | 'morning' | 'day' | 'afternoon' | 'late' | 'dusk' | 'night';
export type Group = 'preHifz' | 'hifz' | 'afterHifz';
export type MomentIcon = 'salat' | 'bath' | 'meal' | 'sleep' | 'read' | 'revise' | 'play' | 'home';

/** The stage's chips, in this order. */
export const GROUPS: Group[] = ['preHifz', 'hifz', 'afterHifz'];
export const SKIES: Sky[] = ['dawn', 'morning', 'day', 'afternoon', 'late', 'dusk', 'night'];
/** Skies after dark: light text on the stage, the moon instead of the sun. */
export const DARK_SKIES: Sky[] = ['dusk', 'night'];

/** Kinds drawn on the stage. Every other kind shows its photo, and is left out until it has one. */
const DRAWN: StopKind[] = ['approach', 'arrive', 'leave', 'moments'];
const KINDS: StopKind[] = [...DRAWN, 'entrance', 'floor', 'rooms', 'roof', 'field', 'exit', 'other'];

type Bi = { bengali?: string; english?: string };

/** A photo as Studio holds it, or (the launch day) a file in /public. */
export type CampusPhotoIn = { _key?: string; src?: string; asset?: { _ref?: string }; hotspot?: { x?: number; y?: number }; alt?: Bi; name?: Bi };
export type CampusBeatIn = { time?: Bi; part?: Bi; sky?: Sky; groups?: Group[] };
export type CampusStopIn = {
  _key?: string;
  kind?: StopKind;
  show?: boolean;
  label?: Bi;
  place?: Bi;
  floor?: number;
  title?: Bi;
  text?: Bi;
  clock?: CampusBeatIn[];
  moments?: { icon?: MomentIcon; label?: Bi }[];
  photos?: CampusPhotoIn[];
};

export type Photo = { src: string; alt: string; name?: string; position: string };
/** One moment of a stop on the stage: what the clock says, the sky, who is in school. */
export type Beat = { time: string; part: string; sky: Sky; groups: Group[] };
/** Where a stop is on the lift: a floor number, the roof, or not in the building. */
export type LiftStop = number | 'roof' | null;
export type Stop = {
  key: string;
  kind: StopKind;
  label: string;
  place: string;
  title: string;
  text: string;
  lift: LiftStop;
  beats: Beat[];
  moments: { icon: MomentIcon; label: string }[];
  photos: Photo[];
};

const clean = (v: Bi | undefined, locale: Locale) => v?.[locale]?.trim() ?? '';
/** The i-th value, or the last one when there are fewer (a stop's rows hold until the next row). */
const at = <T,>(list: T[], i: number): T => list[Math.min(i, list.length - 1)];

/**
 * The stops to show, in this language: those switched on, with a heading, text and a clock, and (unless the stage
 * draws them) a photo; a moments stop needs a moment. `photoUrl` turns a Studio photo into its address; launch-day
 * photos carry theirs as `src`. A stop's moments on the stage are its clock rows; a moments stop has at least one per
 * moment and a rooms stop one per photo, holding the last clock row.
 */
export function campusStops(stops: CampusStopIn[] | undefined, locale: Locale, photoUrl: (p: CampusPhotoIn) => string | undefined): Stop[] {
  return (stops ?? []).flatMap((s, i) => {
    const kind = s.kind && KINDS.includes(s.kind) ? s.kind : null;
    const title = clean(s.title, locale);
    const text = clean(s.text, locale);
    const clock = (s.clock ?? []).flatMap((c) => {
      const time = clean(c.time, locale);
      const part = clean(c.part, locale);
      return time && c.sky && SKIES.includes(c.sky) ? [{ time, part, sky: c.sky, groups: GROUPS.filter((g) => c.groups?.includes(g)) }] : [];
    });
    const photos = (s.photos ?? []).flatMap((p) => {
      const src = p.src ?? photoUrl(p);
      if (!src) return [];
      const { x = 0.5, y = 0.5 } = p.hotspot ?? {};
      const name = clean(p.name, locale);
      return [{ src, alt: clean(p.alt, locale), position: `${Math.round(x * 100)}% ${Math.round(y * 100)}%`, ...(name ? { name } : {}) }];
    });
    if (!kind || s.show === false || !title || !text || !clock.length) return [];
    if (!DRAWN.includes(kind) && !photos.length) return [];
    const moments = kind === 'moments' ? (s.moments ?? []).flatMap((m) => (m.icon && clean(m.label, locale) ? [{ icon: m.icon, label: clean(m.label, locale) }] : [])) : [];
    if (kind === 'moments' && !moments.length) return [];
    const count = Math.max(clock.length, moments.length, kind === 'rooms' ? photos.length : 0);
    return [
      {
        key: s._key ?? `stop-${i}`,
        kind,
        label: clean(s.label, locale),
        place: clean(s.place, locale),
        title,
        text,
        lift: kind === 'roof' ? 'roof' : typeof s.floor === 'number' && s.floor >= 0 ? Math.floor(s.floor) : null,
        beats: Array.from({ length: count }, (_, b) => at(clock, b)),
        moments,
        photos,
      },
    ];
  });
}

/** The lift's rows, top first: the roof (when a stop is there) and the floors the stops use. */
export function liftRows(stops: Stop[]): Exclude<LiftStop, null>[] {
  const floors = [...new Set(stops.flatMap((s) => (typeof s.lift === 'number' ? [s.lift] : [])))].sort((a, b) => b - a);
  return [...(stops.some((s) => s.lift === 'roof') ? (['roof'] as const) : []), ...floors];
}

const BN_ORDINAL = ['', '১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'];
const EN_SUFFIX = (n: number) => (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');

/** A lift row's name: ছাদ, ৪র্থ … নিচতলা; Roof, 4th … Ground. */
export function floorName(row: Exclude<LiftStop, null>, locale: Locale, names: { roof: string; ground: string }): string {
  if (row === 'roof') return names.roof;
  if (row === 0) return names.ground;
  if (locale === 'english') return `${row}${EN_SUFFIX(row)}`;
  return BN_ORDINAL[row] ?? `${row.toLocaleString('bn-BD')}তম`;
}

export type DayBeat = Beat & { stop: number; sun: number; lift: number | null };

/**
 * Every moment of the day in order, with where the sun is (0 at the first, 1 at the last) and the lift row (null
 * outside the building, and always while the lift would have a single floor).
 */
export function dayBeats(stops: Stop[]): DayBeat[] {
  const rows = liftRows(stops);
  // The sun moves a stop's width per stop, and a share of it per moment within the stop.
  const last = stops.at(-1);
  const end = stops.length - 1 + (last ? (last.beats.length - 1) / last.beats.length : 0);
  return stops.flatMap((s, i) =>
    s.beats.map((b, j) => ({
      ...b,
      stop: i,
      sun: end > 0 ? (i + j / s.beats.length) / end : 0.5,
      lift: s.lift === null || rows.length < 2 ? null : rows.indexOf(s.lift),
    })),
  );
}

/** The index of a stop's first moment among all the day's moments. */
export const firstBeat = (stops: Stop[], i: number) => stops.slice(0, i).reduce((n, s) => n + s.beats.length, 0);
