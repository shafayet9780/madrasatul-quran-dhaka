import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { num } from '@/lib/admissions/display';
import { planRows, quranOf, generalOf, level, stageOf, type PlanRow, type Subject } from '@/lib/curriculum/plan';
import { Icon } from '@/components/site/icon';
import { cn } from '@/lib/utils';
import { ClassBooks, type ClassPanel } from './class-books';

// Chips in the subject colours of the curriculum map. During hifz the general subjects are outlined only: limited, on a special syllabus.
const chip = 'inline-flex min-h-7 items-center whitespace-nowrap rounded-chip px-2.5 text-14 font-strong';
const LOOK = {
  quran: 'bg-rust-deep text-paper',
  arabic: 'bg-clay text-surface',
  islam: 'bg-sand-deep text-ink shadow-[inset_0_0_0_1px_var(--color-line-sand)]',
  general: 'bg-paper text-ink shadow-[inset_0_0_0_1px_var(--color-line-bronze)]',
  limited: 'border border-dashed border-line-bronze text-ink-muted',
};
const cell = 'border-t border-line px-2.5 py-2.5 align-middle';
const block = 'inline-flex min-h-8 items-center self-start whitespace-nowrap rounded-cell px-3.5 text-15 font-strong text-on-dark';

type Books = { arabic: [string, string]; islam: [string, string] };
type Stage = { name: string; care: string; classes: string; hours: string };

/**
 * The prospectus's ten-year table on `cream`, designed: one row group per stage (its hours in the band), a chip per
 * subject in the map's colours, and Dakhil and Mutawassita as board blocks. From 768px it is a table; below that the
 * same rows stack, each class over its chips. Under it, the books and topics of each class.
 */
export async function StudyPlanTable({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'curriculum.plan' });
  const b = await getTranslations({ locale, namespace: 'curriculum.books' });
  const model = await getTranslations({ locale, namespace: 'curriculum.model' });
  const hero = await getTranslations({ locale, namespace: 'curriculum.hero' });
  const home = await getTranslations({ locale, namespace: 'home.plan' });
  const classes = home.raw('classes') as string[];
  const blocks = home.raw('blocks') as { name: string; note: string }[];
  const segments = home.raw('segments') as Record<string, string>;
  const stages = model.raw('stages') as Stage[];
  const subjects = t.raw('subjects') as Record<Subject, string>;
  const cols = t.raw('cols') as Record<'class' | 'quran' | 'arabic' | 'islam' | 'general', string>;
  const code = (key: 'arabicCode' | 'islamCode', i: number) => t(key, { level: num(level(i), locale) });
  const age = (i: number) => t('age', { age: num(i + 5, locale) });
  const stageTag = (k: number) => model('stageTag', { n: num(k + 1, locale) });
  const rowsByStage = planRows();

  // The class picker: Nursery to Class 8 one by one, then Dakhil (Classes 9 and 10) and Mutawassita.
  const books = b.raw('items') as Books[];
  const stageOfClass = (i: number) => `${stageTag(stageOf(i))} · ${stages[stageOf(i)].name}`;
  const panels: ClassPanel[] = [
    ...books.map((x, i) => {
      const quran = quranOf(i);
      return {
        key: String(i),
        tab: classes[i],
        title: i < 2 ? classes[i] : b('classTitle', { name: classes[i] }),
        age: age(i),
        stage: stageOfClass(i),
        quran: quran && segments[quran],
        arabic: { code: code('arabicCode', i), book: x.arabic[0], focus: x.arabic[1] },
        islam: { code: code('islamCode', i), book: x.islam[0], focus: x.islam[1] },
        general: { subjects: generalOf(i).map((s) => subjects[s]).join(', '), note: i < 2 ? b('aqviBooks') : stageOf(i) === 1 ? t('limited') : b('nctb') },
      };
    }),
    { key: 'dakhil', tab: b('dakhilTab'), title: b('dakhilTitle'), age: b('dakhilAge'), stage: stageOfClass(10), board: { title: t('dakhil'), text: b('dakhilText') } },
    { key: 'mutawassita', tab: classes[12], title: classes[12], age: b('mutawassitaAge'), stage: stageOfClass(12), board: { title: blocks[1].name, text: b('mutawassitaText') } },
  ];

  // A stage's band: its tag and name, then day-care or not and the hours, each kept whole so phones wrap between them.
  const band = (k: number) => (
    <span className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
      <span className="rounded-chip border border-line-bronze px-[7px] text-13 text-ink-muted">{stageTag(k)}</span>
      <span className="font-heading">{stages[k].name}</span>
      <span className="whitespace-nowrap font-normal text-ink-muted">{stages[k].care}</span>
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-normal text-ink-muted">
        <Icon name="clock" size={16} />
        {stages[k].hours}
      </span>
    </span>
  );
  const classCell = (r: PlanRow) => (
    <span className="flex flex-col leading-[1.25]">
      <span className="text-16 font-bold">{classes[r.i]}</span>
      {r.kind !== 'mutawassita' && <span className="text-13 font-normal text-ink-muted">{age(r.i)}</span>}
    </span>
  );
  const general = (r: Extract<PlanRow, { kind: 'class' }>) =>
    r.general.map((s) => (
      <span key={s} className={cn(chip, r.limited ? LOOK.limited : LOOK.general)}>
        {subjects[s]}
      </span>
    ));
  const board = (r: PlanRow): ReactNode =>
    r.kind === 'dakhil' ? (
      <span className={cn(block, 'bg-dark')}>{t('dakhil')}</span>
    ) : (
      <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className={cn(block, 'bg-panel')}>{t('mutawassita')}</span>
        <span className="text-ink-muted">{t('orCollege')}</span>
      </span>
    );

  return (
    <section id="plan" className="bg-cream text-ink">
      <div className="page-wrap flex flex-col gap-7 py-section">
        <div className="flex max-w-narrow flex-col gap-3.5">
          <h2 className="m-0 text-h2 text-balance">{t('title')}</h2>
          <p className="m-0 text-19 leading-[1.65] text-ink-body">{t('lead')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-14 text-ink-body">
          {(['quran', 'arabic', 'islam', 'general'] as const).map((k) => (
            <span key={k} className={cn(chip, 'min-h-6 px-2 text-13', LOOK[k])}>
              {cols[k]}
            </span>
          ))}
          <span className="inline-flex items-center gap-2 sm:ml-3">
            <span className={cn(chip, 'min-h-6 shrink-0 px-2 text-13', LOOK.limited)}>{subjects.bangla}</span>
            {t('limited')}
          </span>
        </div>

        {/* Phones: the rows stacked, each class over its chips. Screen readers hear the subject before the Quran and general chips. */}
        <div className="flex flex-col gap-3 md:hidden">
          {rowsByStage.map((rows, k) => (
            <div key={k} className="overflow-hidden rounded-card border border-line bg-surface">
              <p className="m-0 bg-sand-pale px-4 py-3 text-15 font-strong">{band(k)}</p>
              <ul className="m-0 list-none p-0">
                {rows.map((r) => (
                  <li key={r.i} className="flex flex-col gap-2 border-t border-line px-4 py-3">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-16 font-bold">{classes[r.i]}</span>
                      {r.kind !== 'mutawassita' && <span className="text-13 text-ink-muted">{age(r.i)}</span>}
                    </span>
                    {r.kind === 'class' ? (
                      <>
                        <span className="flex flex-wrap gap-1.5">
                          {r.quran && (
                            <span className={cn(chip, LOOK.quran)}>
                              <span className="sr-only">{cols.quran}: </span>
                              {segments[r.quran]}
                            </span>
                          )}
                          <span className={cn(chip, LOOK.arabic)}>{code('arabicCode', r.i)}</span>
                          <span className={cn(chip, LOOK.islam)}>{code('islamCode', r.i)}</span>
                        </span>
                        {/* The general subjects in one box, so a row never breaks into a heap of chips. */}
                        <span className={cn('self-start rounded-chip px-2.5 py-1 text-14 font-strong leading-snug', r.limited ? LOOK.limited : LOOK.general)}>
                          <span className="sr-only">{cols.general}: </span>
                          {r.general.map((g) => subjects[g]).join(', ')}
                        </span>
                      </>
                    ) : (
                      board(r)
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* From 768px: the table. Where the frame is narrower than its columns it scrolls; as a named, focusable region the keyboard can scroll it too. */}
        <div role="region" aria-label={t('caption')} tabIndex={0} className="hidden overflow-x-auto rounded-panel border border-line bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:block">
          <table className="w-full min-w-[600px] border-separate border-spacing-0 text-15">
            <caption className="sr-only">{t('caption')}</caption>
            <thead>
              <tr className="text-13 text-ink-muted">
                {Object.values(cols).map((c, n) => (
                  <th key={c} scope="col" className={cn('px-2.5 pb-3 pt-3.5 text-left font-strong', n === 0 && 'pl-5')}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            {rowsByStage.map((rows, k) => (
              <tbody key={k}>
                <tr>
                  <th colSpan={5} scope="rowgroup" className="bg-sand-pale py-3 pl-5 pr-3.5 text-left text-15 font-strong">
                    {band(k)}
                  </th>
                </tr>
                {rows.map((r) => (
                  <tr key={r.i}>
                    <th scope="row" className={cn(cell, 'whitespace-nowrap pl-5 text-left')}>
                      {classCell(r)}
                    </th>
                    {r.kind === 'class' ? (
                      <>
                        <td className={cell}>{r.quran && <span className={cn(chip, LOOK.quran)}>{segments[r.quran]}</span>}</td>
                        <td className={cell}>
                          <span className={cn(chip, LOOK.arabic)}>{code('arabicCode', r.i)}</span>
                        </td>
                        <td className={cell}>
                          <span className={cn(chip, LOOK.islam)}>{code('islamCode', r.i)}</span>
                        </td>
                        <td className={cell}>
                          <span className="flex flex-wrap gap-1.5">{general(r)}</span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className={cell} />
                        <td colSpan={3} className={cell}>
                          {board(r)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
        <p className="m-0 max-w-[52em] text-15 leading-[1.6] text-ink-muted">{t('note')}</p>

        <div className="mt-7 flex flex-col gap-[18px]">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <div className="flex flex-col gap-2">
              <h3 className="m-0 text-h4">{b('title')}</h3>
              <p className="m-0 text-16 text-ink-body">{b('lead')}</p>
            </div>
            {/* A file, not a page: a plain link downloads it. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/download-curriculum"
              className="inline-flex min-h-11 items-center gap-2 text-17 font-strong text-rust no-underline hover:text-rust-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {hero('curriculumPdf')}
              <Icon name="download-simple" size={18} />
            </a>
          </div>
          <ClassBooks label={b('pick')} panels={panels} lanes={{ quran: b('quran'), arabic: b('arabic'), islam: b('islam'), general: b('general') }} />
        </div>
      </div>
    </section>
  );
}
