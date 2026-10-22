// Studio → Curriculum (sanity/schemas/curriculum.ts) turned into what the homepage's education model, ten-year map
// and day bars, and the curriculum page's stages, table and books draw. Classes are indexed in the order the
// Studio lists them; a stage covers the classes [from, to). Pure.
import { bengaliDayPart, num, txt, type Locale } from '@/lib/admissions/display';

type Bi = { bengali?: string; english?: string };
export type Subject = 'bangla' | 'english' | 'maths' | 'science' | 'bgs';
export type Strand = 'quran' | 'arabic' | 'islam' | 'general';
export type Board = 'dakhil' | 'mutawassita';

export type CurriculumDoc = {
  stages?: { name?: Bi; care?: Bi; classes?: Bi; note?: Bi; start?: string; end?: string; quran?: number; arabic?: number; general?: number; arabicIncludesIslam?: boolean }[];
  classes?: {
    name?: Bi;
    age?: number;
    stage?: number;
    board?: Board;
    quran?: Bi;
    bookLevel?: string;
    arabicBook?: Bi;
    arabicFocus?: Bi;
    islamBook?: Bi;
    islamFocus?: Bi;
    islamInArabic?: boolean;
    general?: Subject[];
    generalBooks?: 'nctb' | 'aqvi';
    limited?: boolean;
  }[];
  goals?: { title?: Bi; figure?: string; text?: Bi }[];
  glance?: { label?: Bi; value?: Bi }[];
};

export type PlanStage = { name: string; care: string; classes: string; note: string; hours: string; start: number; end: number; split: [number, number, number]; arabicIslam: boolean; from: number; to: number };
export type PlanClass = {
  name: string;
  age?: number;
  stage: number;
  board?: Board;
  quran?: string;
  level: string;
  arabic?: { book: string; focus: string };
  islam?: { book: string; focus: string };
  inArabic: boolean;
  general: Subject[];
  generalBooks: 'nctb' | 'aqvi';
  limited: boolean;
};
export type Segment = { from: number; to: number; label: string };
export type Plan = {
  stages: PlanStage[];
  classes: PlanClass[];
  /** The board years, each run as one block. */
  blocks: { board: Board; from: number; to: number }[];
  /** Where the lanes end: the first board year. */
  strandEnd: number;
  strands: { strand: Strand; segments: Segment[] }[];
  goals: { title: string; figure?: string; text: string }[];
  glance: { label: string; value: string }[];
};

/** The map's lane labels outside the Quran (messages home.plan.segments). */
export type LaneLabels = Record<'arabic' | 'islam' | 'islamInArabic' | 'general' | 'science' | 'bgs', string>;

const SUBJECT_ORDER: Subject[] = ['bangla', 'english', 'maths', 'science', 'bgs'];

/** "07:30" in minutes from midnight; NaN when it isn't a time. */
export const minutes = (hhmm: string | undefined) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
};

/** A time of day: "8:30 pm" / "রাত ৮:৩০"; short drops ":00" ("7 am" / "সকাল ৭টা"). */
export function clock(mins: number, locale: Locale, short = false): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const h12 = h % 12 || 12;
  const hm = `${h12}:${String(m).padStart(2, '0')}`;
  if (locale === 'bengali') return `${bengaliDayPart(h)} ${num(short && !m ? `${h12}টা` : hm, locale)}`;
  return `${short && !m ? h12 : hm} ${h < 12 ? 'am' : 'pm'}`;
}

/** Runs of consecutive classes with the same key (null: none) as segments. */
function runs(classes: PlanClass[], end: number, key: (c: PlanClass) => string | null): Segment[] {
  const out: Segment[] = [];
  for (let i = 0; i < end; i++) {
    const k = key(classes[i]);
    if (!k) continue;
    const last = out.at(-1);
    if (last && last.to === i && last.label === k) last.to = i + 1;
    else out.push({ from: i, to: i + 1, label: k });
  }
  return out;
}

/**
 * Why the class rows can't be drawn, or null when they can: the classes in stage order, each of the three stages with
 * a class, and the board years (Dakhil, Mutawassita) last, in one stage. The Studio shows it as the list's error.
 */
export function classOrderProblem(rows: { stage?: number; board?: string }[] | undefined): string | null {
  if (!rows?.length) return null;
  const stages = rows.map((c) => c.stage ?? 0);
  if (stages.some((s, i) => i > 0 && s < stages[i - 1])) return 'Keep the classes in stage order: every stage 1 class before stage 2, every stage 2 class before stage 3.';
  if (![1, 2, 3].every((s) => stages.includes(s))) return 'Each of the three stages needs at least one class.';
  const firstBoard = rows.findIndex((c) => c.board);
  if (firstBoard >= 0 && rows.slice(firstBoard).some((c) => !c.board)) return 'The board years (Dakhil, Mutawassita) come after every other class.';
  if (firstBoard >= 0 && rows.slice(firstBoard).some((c) => c.stage !== rows[firstBoard].stage)) return 'The board years sit in one stage.';
  return null;
}

/**
 * The plan in the page's language, or null while the Studio's curriculum is not usable: three stages, the classes as
 * classOrderProblem wants them, each stage with its hours.
 */
export function curriculumPlan(doc: CurriculumDoc | null | undefined, locale: Locale, lanes: LaneLabels): Plan | null {
  const rawStages = doc?.stages ?? [];
  const rawClasses = doc?.classes ?? [];
  if (rawStages.length !== 3 || !rawClasses.length) return null;
  if (classOrderProblem(rawClasses)) return null;
  const stageOf = rawClasses.map((c) => (c.stage ?? 0) - 1);

  const book = (b?: Bi, f?: Bi) => (txt(b, locale) ? { book: txt(b, locale), focus: txt(f, locale) } : undefined);
  const classes: PlanClass[] = rawClasses.map((c, i) => ({
    name: txt(c.name, locale),
    age: c.age ?? undefined,
    stage: stageOf[i],
    board: c.board,
    ...(c.board
      ? { level: '', inArabic: false, general: [], generalBooks: 'nctb' as const, limited: false }
      : {
          quran: txt(c.quran, locale) || undefined,
          level: c.bookLevel?.trim() ?? '',
          arabic: book(c.arabicBook, c.arabicFocus),
          islam: book(c.islamBook, c.islamFocus),
          inArabic: !!c.islamInArabic,
          general: SUBJECT_ORDER.filter((s) => c.general?.includes(s)),
          generalBooks: c.generalBooks ?? 'nctb',
          limited: !!c.limited,
        }),
  }));

  const stages: PlanStage[] = [];
  for (let k = 0; k < 3; k++) {
    const s = rawStages[k];
    const from = stageOf.indexOf(k);
    const start = minutes(s.start);
    const end = minutes(s.end);
    if (from < 0 || !(start < end)) return null;
    const hours = locale === 'bengali' ? `${clock(start, locale)} থেকে ${clock(end, locale)}` : `${clock(start, locale)} to ${clock(end, locale)}`;
    stages.push({
      name: txt(s.name, locale),
      care: txt(s.care, locale),
      classes: txt(s.classes, locale),
      note: txt(s.note, locale),
      hours,
      start,
      end,
      split: [s.quran ?? 0, s.arabic ?? 0, s.general ?? 0],
      arabicIslam: !!s.arabicIncludesIslam,
      from,
      to: stageOf.lastIndexOf(k) + 1,
    });
  }

  const blocks: Plan['blocks'] = [];
  classes.forEach((c, i) => {
    if (!c.board) return;
    const last = blocks.at(-1);
    if (last && last.board === c.board && last.to === i) last.to = i + 1;
    else blocks.push({ board: c.board, from: i, to: i + 1 });
  });
  const firstBoard = classes.findIndex((c) => c.board);
  const strandEnd = firstBoard < 0 ? classes.length : firstBoard;

  const strands: Plan['strands'] = [
    { strand: 'quran', segments: runs(classes, strandEnd, (c) => c.quran ?? null) },
    { strand: 'arabic', segments: runs(classes, strandEnd, (c) => (c.arabic ? lanes.arabic : null)) },
    { strand: 'islam', segments: runs(classes, strandEnd, (c) => (c.islam ? (c.inArabic ? lanes.islamInArabic : lanes.islam) : null)) },
    {
      strand: 'general',
      segments: runs(classes, strandEnd, (c) => (!c.general.length ? null : c.general.includes('bgs') ? lanes.bgs : c.general.includes('science') ? lanes.science : lanes.general)),
    },
  ];

  return {
    stages,
    classes,
    blocks,
    strandEnd,
    strands,
    goals: (doc?.goals ?? [])
      .map((g) => ({ title: txt(g.title, locale), figure: g.figure?.trim() ? num(g.figure.trim(), locale) : undefined, text: txt(g.text, locale) }))
      .filter((g) => g.title && g.text),
    glance: (doc?.glance ?? []).map((g) => ({ label: txt(g.label, locale), value: txt(g.value, locale) })).filter((g) => g.label && g.value),
  };
}

/** Cuts a segment where stages meet: on phones each stage heads its own rows, so a segment cannot run across one. */
export function splitAtStages(plan: Pick<Plan, 'stages'>, from: number, to: number): [number, number][] {
  return plan.stages.filter((s) => s.from < to && s.to > from).map((s) => [Math.max(s.from, from), Math.min(s.to, to)]);
}

/** The hours axis over the longest day, with ticks at its start, 1:00 pm (when inside) and its end. */
export function dayAxis(plan: Pick<Plan, 'stages'>): { from: number; to: number; ticks: number[] } {
  const from = Math.min(...plan.stages.map((s) => s.start));
  const to = Math.max(...plan.stages.map((s) => s.end));
  return { from, to, ticks: [from, ...(780 > from && 780 < to ? [780] : []), to] };
}

/** Where a time sits on the axis, in % from its start. */
export const axisPos = (axis: { from: number; to: number }, mins: number) => ((mins - axis.from) / (axis.to - axis.from)) * 100;

/** Each strand's classes, first to last, for its card: the Islamic studies strand also says from when it is in Arabic, and general runs into Dakhil when it follows. */
export function strandRanges(plan: Plan): Record<Strand, { from: string; to: string; inArabicFrom?: string; toDakhil?: boolean } | null> {
  const span = (strand: Strand) => {
    const segs = plan.strands.find((s) => s.strand === strand)?.segments ?? [];
    return segs.length ? { from: plan.classes[segs[0].from].name, to: plan.classes[segs.at(-1)!.to - 1].name, end: segs.at(-1)!.to } : null;
  };
  const out = {} as ReturnType<typeof strandRanges>;
  for (const strand of ['quran', 'arabic', 'islam', 'general'] as const) {
    const s = span(strand);
    if (!s) {
      out[strand] = null;
      continue;
    }
    const arabicFrom = strand === 'islam' ? plan.classes.findIndex((c) => !c.board && c.inArabic) : -1;
    out[strand] = {
      from: s.from,
      to: s.to,
      ...(arabicFrom >= 0 && { inArabicFrom: plan.classes[arabicFrom].name }),
      ...(strand === 'general' && plan.classes[s.end]?.board === 'dakhil' && { toDakhil: true }),
    };
  }
  return out;
}
