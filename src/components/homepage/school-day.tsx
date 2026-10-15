import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { AXIS_TICKS, STAGE_HOURS, axisPos, routineFor, type DayPart, type Route, type StepKind } from '@/lib/home/day';
import type { HomeRoutinePart } from '@/types/home';
import { sitePhone } from '@/lib/site/phone';
import { ButtonLink } from '@/components/site/button';
import { Icon, type IconName } from '@/components/site/icon';
import { RouteLine } from '@/components/site/route-line';
import { cn } from '@/lib/utils';

const PART_ICON: Record<DayPart, IconName> = { morning: 'sun-horizon', midday: 'sun', afternoon: 'cloud-sun', evening: 'moon-stars' };
const STEP: Record<StepKind, { icon: IconName; look: string }> = {
  quran: { icon: 'book-open-text', look: 'bg-rust-deep text-paper' },
  study: { icon: 'chalkboard-teacher', look: 'bg-clay text-surface' },
  meal: { icon: 'fork-knife', look: 'bg-sand text-rust-deep' },
  rest: { icon: 'bed', look: 'bg-sand text-rust-deep' },
  salat: { icon: 'mosque', look: 'bg-dark text-cream' },
  play: { icon: 'soccer-ball', look: 'bg-bronze text-dark' },
  home: { icon: 'house-line', look: 'bg-rust text-surface' },
};

/** A day in hifz day-care: the routine by part of the day (CMS, else the launch routine), each stage's hours on one axis, and the school's van routes. */
export async function SchoolDay({ locale, routine, routes, transportPhone }: { locale: Locale; routine?: HomeRoutinePart[]; routes: Route[]; transportPhone?: string }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const parts = routineFor(routine, locale, t.raw('day.parts'));
  const stages = (t.raw('plan.stages') as { name: string; hours: string }[]).slice(0, STAGE_HOURS.length);
  const ticks = t.raw('day.ticks') as string[];
  const desk = sitePhone(transportPhone, locale);
  return (
    <section className="bg-paper text-ink">
      <div className="page-wrap flex flex-col gap-9 py-section">
        <div className="flex max-w-[820px] flex-col gap-3.5">
          <h2 className="m-0 text-h2 text-balance">{t('day.title')}</h2>
          <p className="m-0 text-19 leading-[1.65]">{t('day.lede')}</p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,250px),1fr))] gap-3.5">
          {parts.map(({ part, name, steps }, p) => (
            <div key={p} className="flex flex-col gap-[18px] rounded-card border border-line bg-surface px-5 pb-6 pt-5">
              <h3 className="m-0 flex items-center gap-2.5 text-19 font-heading leading-[1.2]">
                <Icon name={PART_ICON[part]} size={24} className="shrink-0 text-rust" />
                {name}
              </h3>
              <ol className="relative m-0 flex list-none flex-col gap-[18px] p-0 before:absolute before:inset-y-[18px] before:left-[17px] before:w-0.5 before:bg-sand-pale">
                {steps.map((step, s) => (
                  <li key={s} className="relative flex items-start gap-3.5">
                    <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full shadow-[0_0_0_4px_var(--color-surface)]', STEP[step.kind].look)}>
                      <Icon name={STEP[step.kind].icon} size={19} />
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-13 leading-[1.35] font-bold text-rust">{step.time}</span>
                      <strong className="text-16 leading-[1.35] font-strong">{step.title}</strong>
                      {step.gloss && <span className="text-13 leading-[1.35] text-ink-muted">{step.gloss}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <div className="-mt-3 flex flex-wrap items-start gap-x-12 gap-y-5">
          <p className="m-0 flex-[1_1_360px] text-14 leading-[1.6] text-ink-muted">{t('day.note')}</p>
          {/* The three stages' hours on one axis, for comparing day lengths. The hours are in the text; the bars are decoration. */}
          <div className="flex min-w-0 flex-[1.4_1_420px] flex-col gap-2.5">
            <strong className="text-15 font-bold">{t('day.hoursTitle')}</strong>
            {stages.map((s, k) => (
              <div key={s.name} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex flex-[0_0_150px] flex-col">
                  <strong className="text-14 leading-[1.25] font-strong">{s.name}</strong>
                  <span className="text-12 leading-[1.25] text-ink-muted">{s.hours}</span>
                </span>
                <span aria-hidden="true" className="relative h-3.5 flex-[1_1_220px] rounded-[7px] bg-cream">
                  <span
                    className={cn('absolute inset-y-0 rounded-[7px]', k === 1 ? 'bg-rust' : 'bg-line-sand')}
                    style={{ left: `${axisPos(STAGE_HOURS[k][0])}%`, right: `${100 - axisPos(STAGE_HOURS[k][1])}%` }}
                  />
                </span>
              </div>
            ))}
            <div aria-hidden="true" className="flex flex-wrap gap-x-4 text-12 text-ink-muted">
              <span className="flex-[0_0_150px]" />
              <span className="relative h-4 flex-[1_1_220px]">
                {AXIS_TICKS.map((m, i) => (
                  <span
                    key={m}
                    className="absolute whitespace-nowrap"
                    style={{ left: `${axisPos(m)}%`, transform: `translateX(${i === 0 ? 0 : i === AXIS_TICKS.length - 1 ? -100 : -50}%)` }}
                  >
                    {ticks[i]}
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-row-reverse flex-wrap items-stretch justify-end gap-x-12 gap-y-7">
          <div className="flex min-w-0 flex-[2_1_460px] flex-col justify-center gap-6">
            <div className="flex flex-col gap-1.5">
              <h3 className="m-0 text-h3">{t('day.transport.title')}</h3>
              <p className="m-0 text-17 text-ink-body">{t('day.transport.lede')}</p>
            </div>
            {routes.length > 0 && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:gap-x-8">
                {routes.map((r) => (
                  <RouteLine key={r.name} route={r} school={t('hero.name')} />
                ))}
              </div>
            )}
            {desk && (
              <ButtonLink href={desk.tel} variant="outline" className="min-h-12 self-start border-rust px-[22px] text-rust-deep">
                {t('day.transport.desk', { number: desk.display })}
              </ButtonLink>
            )}
          </div>
          <figure className="m-0 flex max-w-[420px] flex-[1_1_280px] flex-col gap-2">
            <div className="relative aspect-[4/3] min-h-60 flex-1 overflow-hidden rounded-photo">
              <Image src="/images/home/school-van.jpg" alt={t('day.transport.vanAlt')} fill sizes="(min-width: 900px) 420px, 100vw" className="object-cover object-[50%_70%]" />
            </div>
            <figcaption className="text-14 text-ink-muted">{t('day.transport.vanCaption')}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
