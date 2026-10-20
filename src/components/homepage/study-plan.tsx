import Link from 'next/link';
import type { CSSProperties } from 'react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { num } from '@/lib/admissions/display';
import { splitAtStages, type Plan, type Strand } from '@/lib/curriculum/plan';
import { Icon } from '@/components/site/icon';
import { cn } from '@/lib/utils';

// One look per strand, shared by the lane swatches and the segments (the stage split uses the same family).
const LOOK: Record<Strand, string> = {
  quran: 'bg-rust-deep text-paper',
  arabic: 'bg-clay text-surface',
  islam: 'bg-sand-deep text-ink shadow-[inset_0_0_0_1px_var(--color-line-sand)]',
  general: 'bg-paper text-ink-body shadow-[inset_0_0_0_1px_var(--color-line-bronze)]',
};
const BLOCK = { dakhil: 'bg-dark', mutawassita: 'bg-panel' };

const seg = 'flex min-w-0 items-center overflow-hidden rounded-cell py-1 font-strong leading-[1.25]';
const band = 'rounded-cell bg-dark text-on-dark leading-[1.25]';
const block = 'flex min-w-0 flex-col items-center justify-center gap-1 rounded-cell px-1.5 py-2 text-center text-on-dark';
const swatch = 'size-3 shrink-0 rounded-[3px]';

type Copy = {
  plan: Plan;
  ages: string[];
  strands: Record<Strand, string>;
  blocks: Record<'dakhil' | 'mutawassita', { name: string; note: string }>;
};

/** Wide screens (1200px and up): classes left to right, one lane per strand. Each lane draws from Nursery onward as the map scrolls in. */
function MapWide({ c }: { c: Copy }) {
  const { stages, classes, strands, blocks, strandEnd } = c.plan;
  return (
    <div
      className="hidden grid-rows-[auto_auto_repeat(4,46px)] gap-x-1 gap-y-1.5 [view-timeline-name:--plan] min-[1200px]:grid"
      // The last class (after the board years) gets a wider column for its name.
      style={{ gridTemplateColumns: `104px repeat(${classes.length - 1}, minmax(0, 1fr)) minmax(0, 1.5fr)` }}
    >
      {stages.map((s) => (
        <div key={s.name} className={cn(band, 'flex min-w-0 flex-col gap-px px-2.5 py-2')} style={{ gridColumn: `${s.from + 2} / ${s.to + 2}`, gridRow: 1 }}>
          <strong className="text-15 font-bold [overflow-wrap:anywhere]">{s.name}</strong>
          <span className="text-12 text-on-dark-muted">{s.hours}</span>
        </div>
      ))}
      {classes.map(({ name }, i) => (
        <div key={name} className="flex flex-col items-center pb-0.5 pt-1 leading-[1.2]" style={{ gridColumn: i + 2, gridRow: 2 }}>
          <strong className="whitespace-nowrap text-14 font-bold">{name}</strong>
          <span className="text-12 text-ink-muted">{c.ages[i]}</span>
        </div>
      ))}
      {strands.map(({ strand, segments }, j) => [
        <div key={strand} className="flex items-center gap-2 text-14 font-strong" style={{ gridColumn: 1, gridRow: j + 3 }}>
          <span aria-hidden="true" className={cn(swatch, LOOK[strand])} />
          {c.strands[strand]}
        </div>,
        ...segments.map((s) => (
          <div
            key={`${strand}-${s.from}`}
            className={cn(seg, 'draw-x px-1.5 text-12 min-[1440px]:px-2 min-[1440px]:text-13', LOOK[strand])}
            style={{ gridColumn: `${s.from + 2} / ${s.to + 2}`, gridRow: j + 3, '--lane': j, '--from': s.from / strandEnd, '--to': s.to / strandEnd } as CSSProperties}
          >
            {s.label}
          </div>
        )),
      ])}
      {blocks.map((b) => (
        <div key={b.from} className={cn(block, BLOCK[b.board])} style={{ gridColumn: `${b.from + 2} / ${b.to + 2}`, gridRow: '3 / 7' }}>
          <strong className="text-16 font-heading leading-[1.15]">{c.blocks[b.board].name}</strong>
          <span className="text-12 leading-[1.3] text-on-dark-muted">{c.blocks[b.board].note}</span>
        </div>
      ))}
    </div>
  );
}

/** Phones and tablets: the same map turned top to bottom. Each stage heads its own rows; the lanes draw downwards. */
function MapTall({ c }: { c: Copy }) {
  const { stages, classes, strands, blocks, strandEnd } = c.plan;
  const rowOf: number[] = [];
  const bandRow: number[] = [];
  let r = 2;
  stages.forEach(({ from, to }, k) => {
    bandRow[k] = r++;
    for (let i = from; i < to; i++) rowOf[i] = r++;
  });
  const rows = (a: number, b: number) => `${rowOf[a]} / ${rowOf[b - 1] + 1}`;
  const pieces = strands.flatMap(({ strand, segments }, j) =>
    segments.flatMap((s) => splitAtStages(c.plan, s.from, s.to).map(([a, b]) => ({ strand, j, a, b, label: s.label }))),
  );
  return (
    <div className="grid auto-rows-[minmax(42px,auto)] grid-cols-[54px_repeat(4,minmax(0,1fr))] gap-1 [view-timeline-name:--plan] min-[1200px]:hidden">
      {strands.map(({ strand }, j) => (
        <div key={strand} className="flex flex-col items-center justify-end gap-1 pb-0.5 text-12 font-strong" style={{ gridColumn: j + 2, gridRow: 1 }}>
          <span aria-hidden="true" className={cn(swatch, LOOK[strand])} />
          {c.strands[strand]}
        </div>
      ))}
      {stages.map(({ from: a, to: b, name: stageName, hours }, k) => [
        <div key={`band-${k}`} className={cn(band, 'col-span-full mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-3 py-2')} style={{ gridRow: bandRow[k] }}>
          <strong className="text-15 font-bold">{stageName}</strong>
          <span className="text-12 text-on-dark-muted">{hours}</span>
        </div>,
        ...classes.slice(a, b).map(({ name }, n) => (
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
              style={{ gridColumn: p.j + 2, gridRow: rows(p.a, p.b), '--lane': p.j, '--from': p.a / strandEnd, '--to': p.b / strandEnd } as CSSProperties}
            >
              {p.label}
            </div>
          )),
        ...blocks.map(({ board, from, to }) =>
          from >= a && to <= b ? (
            <div key={`block-${from}`} className={cn(block, BLOCK[board])} style={{ gridColumn: '2 / 6', gridRow: rows(from, to) }}>
              <strong className="text-16 font-heading leading-[1.15]">{c.blocks[board].name}</strong>
              <span className="text-12 leading-[1.3] text-on-dark-muted">{c.blocks[board].note}</span>
            </div>
          ) : null,
        ),
      ])}
    </div>
  );
}

/** Nursery to Class 11 in three stages: the ten-year map (Studio → Curriculum), where students can go after Dakhil, and a link to the full plan. */
export async function StudyPlan({ locale, plan }: { locale: Locale; plan: Plan | null }) {
  const t = await getTranslations({ locale, namespace: 'home.plan' });
  const [dakhil, mutawassita] = t.raw('blocks') as { name: string; note: string }[];
  // The first class's age says "yrs"; the rest only the number.
  const c: Copy | null = plan && {
    plan,
    ages: plan.classes.map((k, i) => (k.age == null ? '' : t(i === 0 ? 'ageFirst' : 'age', { age: num(k.age, locale) }))),
    strands: t.raw('strands'),
    blocks: { dakhil, mutawassita },
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
          {c && <MapWide c={c} />}
          {c && <MapTall c={c} />}
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
