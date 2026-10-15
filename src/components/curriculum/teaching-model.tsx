import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { STAGE_SPLITS } from '@/lib/home/plan';
import { num } from '@/lib/admissions/display';
import { Icon } from '@/components/site/icon';
import { cn } from '@/lib/utils';

// Slots: Quran, Arabic (or Arabic and Islamic), general; the homepage's split tiles use the same colours.
const SLOTS = [
  { tile: 'bg-bronze text-dark', swatch: 'bg-bronze' },
  { tile: 'bg-clay text-surface', swatch: 'bg-clay' },
  { tile: 'bg-cream text-dark', swatch: 'bg-cream' },
];

type Stage = { name: string; care: string; classes: string; hours: string; note?: string };

/**
 * The 50-50 model, on `dark`: the prospectus's three points, then the three stages (স্তর), each with its subject
 * split, classes and hours. The tiles are decoration; the legend under them carries the split as text.
 */
export async function TeachingModel({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'curriculum.model' });
  const stages = t.raw('stages') as Stage[];
  const subjects = t.raw('subjects') as Record<'quran' | 'arabic' | 'arabicIslam' | 'general', string>;
  const pct = (p: number) => `${num(p, locale)}%`;
  return (
    <section id="model" className="bg-dark text-on-dark">
      <div className="page-wrap flex flex-col gap-12 py-section">
        <div className="flex flex-wrap gap-x-16 gap-y-7">
          <h2 className="m-0 flex flex-[1_1_300px] flex-col text-h2 text-balance">
            {t('title')}{' '}
            <span className="text-bronze-light">{t('mark')}</span>
          </h2>
          <ul className="m-0 flex min-w-0 flex-[2_1_520px] list-none flex-col p-0">
            {(t.raw('points') as string[]).map((p) => (
              <li key={p} className="flex gap-3.5 border-t border-line-dark py-4 text-18 leading-[1.65] text-on-dark-body first:border-t-0 first:pt-0 last:pb-0">
                <span aria-hidden="true" className="mt-[0.62em] size-2.5 shrink-0 rounded-full bg-bronze" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-[18px]">
          <h3 className="m-0 text-h4">{t('stagesTitle')}</h3>
          <ol className="m-0 grid list-none grid-cols-1 gap-3.5 p-0 sm:grid-cols-2 min-[1000px]:grid-cols-3">
            {stages.map((s, k) => {
              const { split, arabicIslam } = STAGE_SPLITS[k];
              const names = [subjects.quran, arabicIslam ? subjects.arabicIslam : subjects.arabic, subjects.general];
              const shown = split.map((p, i) => ({ p, i })).filter(({ p }) => p > 0);
              return (
                <li key={s.name} className="flex flex-col gap-3 rounded-card bg-panel p-[22px] shadow-[inset_0_0_0_1px_var(--color-line-dark)] sm:max-[999px]:last:col-span-2">
                  <span className="self-start rounded-chip border border-line-dark-strong px-2 py-px text-13 font-strong text-on-dark-muted">{t('stageTag', { n: num(k + 1, locale) })}</span>
                  <div className="flex flex-col gap-0.5">
                    <h4 className="m-0 text-h4">{s.name}</h4>
                    <span className="text-14 text-on-dark-muted">{s.care}</span>
                  </div>
                  <div aria-hidden="true" className="flex h-16 gap-[3px] overflow-hidden rounded-cell">
                    {shown.map(({ p, i }) => (
                      <span key={i} className={cn('flex min-w-0 basis-0 items-end pb-2 pl-2.5 font-extrabold', p >= 25 ? 'text-18' : 'text-13', SLOTS[i].tile)} style={{ flexGrow: p }}>
                        {pct(p)}
                      </span>
                    ))}
                  </div>
                  <ul className="m-0 flex list-none flex-wrap gap-x-3.5 gap-y-1 p-0 text-14 text-on-dark-body">
                    {shown.map(({ p, i }) => (
                      <li key={i} className="inline-flex items-center gap-1.5">
                        <span aria-hidden="true" className={cn('size-2.5 rounded-[3px]', SLOTS[i].swatch)} />
                        {names[i]} {pct(p)}
                      </li>
                    ))}
                  </ul>
                  <dl className="m-0 mt-1 flex flex-col gap-1.5 border-t border-line-dark pt-2.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <dt className="text-14 text-on-dark-muted">{t('classesLabel')}</dt>
                      <dd className="m-0 ml-auto text-right text-16 font-strong text-bronze-light">{s.classes}</dd>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                      <dt className="inline-flex items-center gap-1.5 text-14 text-on-dark-muted">
                        <Icon name="clock" size={18} />
                        {t('hoursLabel')}
                      </dt>
                      <dd className="m-0 ml-auto whitespace-nowrap text-right text-16 font-strong">{s.hours}</dd>
                    </div>
                  </dl>
                  {s.note && <p className="m-0 border-t border-line-dark pt-2.5 text-14 leading-[1.55] text-on-dark-muted">{s.note}</p>}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
