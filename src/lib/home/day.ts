// The homepage's day section: the hifz day-care routine, the stage hours and the van routes. Text lives in messages (home.day).
import type { Locale } from '@/lib/i18n';
import type { TransportRoute } from '@/types/fees';
import type { HomeRoutinePart } from '@/types/home';

export type StepKind = 'quran' | 'study' | 'meal' | 'rest' | 'salat' | 'play' | 'home';
export type DayPart = 'morning' | 'midday' | 'afternoon' | 'evening';

/**
 * A day in hifz day-care, from the school's routine (2026-10-14): the kind of each step, by part of the day.
 * Morning times are fixed; afternoon and evening steps follow the salat times. Home time is always 8:30 pm.
 */
export const ROUTINE: { part: DayPart; steps: StepKind[] }[] = [
  { part: 'morning', steps: ['quran', 'meal', 'quran'] },
  { part: 'midday', steps: ['study', 'rest'] },
  { part: 'afternoon', steps: ['quran', 'play'] },
  { part: 'evening', steps: ['salat', 'quran', 'salat', 'home'] },
];

export type RoutineStep = { kind: StepKind; time: string; title: string; gloss?: string };
export type RoutinePart = { part: DayPart; name: string; steps: RoutineStep[] };
type RoutineCopy = { name: string; steps: { time: string; title: string; gloss?: string }[] }[];

/**
 * The routine to show: the one in the CMS (Studio → Homepage) when it has steps in this language,
 * otherwise the launch routine (ROUTINE with its copy from home.day.parts).
 */
export function routineFor(cms: HomeRoutinePart[] | undefined, locale: Locale, copy: RoutineCopy): RoutinePart[] {
  const fromCms = (cms ?? []).flatMap((p) => {
    const steps = (p.steps ?? []).flatMap((s) => {
      const time = s.time?.[locale]?.trim();
      const title = s.title?.[locale]?.trim();
      const gloss = s.gloss?.[locale]?.trim();
      return s.kind && time && title ? [{ kind: s.kind, time, title, ...(gloss ? { gloss } : {}) }] : [];
    });
    const name = p.name?.[locale]?.trim();
    return p.part && name && steps.length ? [{ part: p.part, name, steps }] : [];
  });
  if (fromCms.length) return fromCms;
  return ROUTINE.map(({ part, steps }, i) => ({ part, name: copy[i].name, steps: steps.map((kind, j) => ({ kind, ...copy[i].steps[j] })) }));
}

/** School hours of Pre-Hifz, hifz day-care and After-Hifz, in minutes from midnight. */
export const STAGE_HOURS: [number, number][] = [
  [540, 780], // 9:00 am to 1:00 pm
  [420, 1230], // 7:00 am to 8:30 pm
  [480, 780], // 8:00 am to 1:00 pm
];

/** The hours axis runs over the longest day, 7:00 am to 8:30 pm; ticks at its start, 1:00 pm and its end. */
export const DAY_AXIS: [number, number] = [420, 1230];
export const AXIS_TICKS = [420, 780, 1230];

/** Where a time sits on the hours axis, in % from its start. */
export const axisPos = (minutes: number) => ((minutes - DAY_AXIS[0]) / (DAY_AXIS[1] - DAY_AXIS[0])) * 100;

export type Route = { name: string; stops: string[] };

/** The visible van routes (Fees, discounts & transport → Transport), in the order the CMS lists them. Route names carry their area. */
export function visibleRoutes(routes: TransportRoute[] | undefined, locale: Locale): Route[] {
  return (routes ?? []).flatMap((r) => {
    const name = r.name?.[locale];
    const stops = (r.stops ?? []).map((s) => s.name?.[locale]).filter((s): s is string => !!s);
    return r.visible !== false && name && stops.length ? [{ name, stops }] : [];
  });
}

