import Link from 'next/link';
import type { CSSProperties } from 'react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { BOARD_STAGES, STAGE_CLASSES, STRANDS, STRAND_END, splitAtStages, type Strand } from '@/lib/home/plan';
import { Icon } from '@/components/site/icon';
import { cn } from '@/lib/utils';

// One look per strand, shared by the lane swatches and the segments (the stage split uses the same family).
const LOOK: Record<Strand, string> = {
  quran: 'bg-rust-deep text-paper',
  arabic: 'bg-clay text-surface',
  islam: 'bg-sand-deep text-ink shadow-[inset_0_0_0_1px_var(--color-line-sand)]',
  general: 'bg-paper text-ink-body shadow-[inset_0_0_0_1px_var(--color-line-bronze)]',
};
const BLOCK = ['bg-dark', 'bg-panel']; // Dakhil, Mutawassita

const seg = 'flex min-w-0 items-center overflow-hidden rounded-cell py-1 font-strong leading-[1.25]';
const band = 'rounded-cell bg-dark text-on-dark leading-[1.25]';
const block = 'flex min-w-0 flex-col items-center justify-center gap-1 rounded-cell px-1.5 py-2 text-center text-on-dark';
const swatch = 'size-3 shrink-0 rounded-[3px]';

type Copy = {
  stages: { name: string; hours: string }[];
  classes: string[];
  ages: string[];
  strands: Record<Strand, string>;
  segments: Record<string, string>;
  board: string;
  allSubjects: string;
};

/** Wide screens (1200px and up): classes left to right, one lane per strand. Each lane draws from Nursery onward as the map scrolls in. */
function MapWide({ c }: { c: Copy }) {
  const span = (k: number) => `${STAGE_CLASSES[k][0] + 2} / ${STAGE_CLASSES[k][1] + 2}`;
  return (
    <div className="hidden grid-cols-[104px_repeat(12,minmax(0,1fr))_minmax(0,1.5fr)] grid-rows-[auto_auto_repeat(4,46px)] gap-x-1 gap-y-1.5 [view-timeline-name:--plan] min-[1200px]:grid">
      {c.stages.map((s, k) => (
        <div key={s.name} className={cn(band, 'flex min-w-0 flex-col gap-px px-2.5 py-2')} style={{ gridColumn: span(k), gridRow: 1 }}>
          <strong className="text-15 font-bold [overflow-wrap:anywhere]">{s.name}</strong>
          <span className="text-12 text-on-dark-muted">{s.hours}</span>
        </div>
      ))}
      {c.classes.map((name, i) => (
        <div key={name} className="flex flex-col items-center pb-0.5 pt-1 leading-[1.2]" style={{ gridColumn: i + 2, gridRow: 2 }}>
          <strong className="whitespace-nowrap text-14 font-bold">{name}</strong>
          <span className="text-12 text-ink-muted">{c.ages[i]}</span>
        </div>
      ))}
      {STRANDS.map(({ strand, segments }, j) => [
        <div key={strand} className="flex items-center gap-2 text-14 font-strong" style={{ gridColumn: 1, gridRow: j + 3 }}>
          <span aria-hidden="true" className={cn(swatch, LOOK[strand])} />
          {c.strands[strand]}
        </div>,
        ...segments.map((s) => (
          <div
            key={`${strand}-${s.from}`}
            className={cn(seg, 'draw-x px-1.5 text-12 min-[1440px]:px-2 min-[1440px]:text-13', LOOK[strand])}
            style={{ gridColumn: `${s.from + 2} / ${s.to + 2}`, gridRow: j + 3, '--lane': j, '--from': s.from / STRAND_END, '--to': s.to / STRAND_END } as CSSProperties}
          >
            {c.segments[s.label]}
          </div>
        )),
      ])}
      {BOARD_STAGES.map((k, b) => (
        <div key={k} className={cn(block, BLOCK[b])} style={{ gridColumn: span(k), gridRow: '3 / 7' }}>
          <strong className="text-16 font-heading leading-[1.15]">{c.board}</strong>
          <span className="text-12 leading-[1.3] text-on-dark-muted">{c.allSubjects}</span>
        </div>
      ))}
    </div>
  );
}

/** Phones and tablets: the same map turned top to bottom. Each stage heads its own rows; the lanes draw downwards. */
function MapTall({ c }: { c: Copy }) {
  const rowOf: number[] = [];
  const bandRow: number[] = [];
  let r = 2;
  STAGE_CLASSES.forEach(([a, b], k) => {
    bandRow[k] = r++;
    for (let i = a; i < b; i++) rowOf[i] = r++;
  });
  const rows = (a: number, b: number) => `${rowOf[a]} / ${rowOf[b - 1] + 1}`;
  const pieces = STRANDS.flatMap(({ strand, segments }, j) =>
    segments.flatMap((s) => splitAtStages(s.from, s.to).map(([a, b]) => ({ strand, j, a, b, label: c.segments[s.label] }))),
  );
  return (
    <div className="grid auto-rows-[minmax(42px,auto)] grid-cols-[54px_repeat(4,minmax(0,1fr))] gap-1 [view-timeline-name:--plan] min-[1200px]:hidden">
      {STRANDS.map(({ strand }, j) => (
        <div key={strand} className="flex flex-col items-center justify-end gap-1 pb-0.5 text-12 font-strong" style={{ gridColumn: j + 2, gridRow: 1 }}>
          <span aria-hidden="true" className={cn(swatch, LOOK[strand])} />
          {c.strands[strand]}
        </div>
      ))}
      {STAGE_CLASSES.map(([a, b], k) => [
        <div key={`band-${k}`} className={cn(band, 'col-span-full mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-3 py-2')} style={{ gridRow: bandRow[k] }}>
          <strong className="text-15 font-bold">{c.stages[k].name}</strong>
          <span className="text-12 text-on-dark-muted">{c.stages[k].hours}</span>
        </div>,
        ...c.classes.slice(a, b).map((name, n) => (
          <div key={name} className="flex flex-col justify-center leading-[1.2]" style={{ gridColumn: 1, gridRow: rowOf[a + n] }}>
            <strong className="text-14 font-bold">{name}</strong>
            <span className="text-11 text-ink-muted">{c.ages[a + n]}</span>
          </div>
        )),
        ...pieces
          .filter((p) => p.a >= a && p.b <= b)
          .map((p) => (
            <div
              key={`${p.strand}-${p.a}`}
              className={cn(seg, 'draw-y justify-center px-0.5 text-center text-12 min-[390px]:px-1', LOOK[p.strand])}
              style={{ gridColumn: p.j + 2, gridRow: rows(p.a, p.b), '--lane': p.j, '--from': p.a / STRAND_END, '--to': p.b / STRAND_END } as CSSProperties}
            >
              {p.label}
            </div>
          )),
        ...(BOARD_STAGES.includes(k)
          ? [
              <div key={`block-${k}`} className={cn(block, BLOCK[BOARD_STAGES.indexOf(k)])} style={{ gridColumn: '2 / 6', gridRow: rows(a, b) }}>
                <strong className="text-16 font-heading leading-[1.15]">{c.board}</strong>
                <span className="text-12 leading-[1.3] text-on-dark-muted">{c.allSubjects}</span>
              </div>,
            ]
          : []),
      ])}
    </div>
  );
}

/** Nursery to Class 11 in five stages: the ten-year map, where students can go after Dakhil, and a link to the full plan. */
export async function StudyPlan({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.plan' });
  const c: Copy = {
    stages: t.raw('stages'),
    classes: t.raw('classes'),
    ages: t.raw('ages'),
    strands: t.raw('strands'),
    segments: t.raw('segments'),
    board: t('board'),
    allSubjects: t('allSubjects'),
  };
  return (
    <section className="bg-dark text-on-dark">
      <div className="page-wrap flex flex-col gap-10 py-section">
        <div className="flex max-w-narrow flex-col gap-3.5">
          <h2 className="m-0 text-h2 text-balance">{t('title')}</h2>
          <p className="m-0 text-19 text-on-dark-body">{t('lede')}</p>
        </div>
        <div className="flex flex-col gap-[22px] rounded-panel bg-cream p-[clamp(16px,2.6vw,32px)] text-ink">
          <div className="flex flex-col gap-1">
            <h3 className="m-0 text-h4">{t('mapTitle')}</h3>
            <span className="text-14 text-ink-muted">{t('mapSub')}</span>
          </div>
          <MapWide c={c} />
          <MapTall c={c} />
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 border-t border-line pt-[18px] text-14">
            <span className="mr-1 text-ink-muted">{t('exitsLabel')}</span>
            {(t.raw('exits') as string[]).map((x) => (
              <span key={x} className="rounded-full border border-line-strong bg-paper px-3 py-1 font-semibold">
                {x}
              </span>
            ))}
          </div>
          <div className="-mt-1.5 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <p className="m-0 max-w-[60em] flex-[1_1_420px] text-14 leading-[1.55] text-ink-muted">{t('note')}</p>
            <Link href={`/${locale}/curriculum`} className="inline-flex min-h-11 shrink-0 items-center gap-2 font-strong text-rust no-underline hover:text-rust-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
              {t('fullPlan')}
              <Icon name="arrow-right" size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
