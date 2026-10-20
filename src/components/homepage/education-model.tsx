import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { StageSplit } from './stage-split';
import type { Plan } from '@/lib/curriculum/plan';

/** The education model: the ৫০/৫০ mark, the two strands, and the card where the balance shifts by stage (Studio → Curriculum). */
export async function EducationModel({ locale, plan }: { locale: Locale; plan: Plan | null }) {
  const t = await getTranslations({ locale, namespace: 'home' });
  const strands = [
    { name: t('model.strandA'), text: t('model.strandAText') },
    { name: t('model.strandB'), text: t('model.strandBText') },
  ];
  return (
    <section className="bg-cream text-ink">
      <div className="page-wrap flex flex-wrap items-center gap-x-14 gap-y-10 py-section">
        <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-[26px]">
          <h2 className="m-0 flex flex-col gap-1.5">
            <span className="text-h2">{t('model.title')}</span>
            <span aria-hidden="true" className="flex items-baseline gap-[clamp(8px,1.4vw,18px)] text-display">
              <span>{t('model.fifty')}</span>
              <span className="h-[0.74em] w-1 rotate-[14deg] self-center rounded-[2px] bg-rust" />
              <span className="text-sand-pale [-webkit-text-stroke:2px_var(--color-ink)]">{t('model.fifty')}</span>
            </span>
            <span className="sr-only">{t('model.fiftySr')}</span>
          </h2>
          <div className="flex flex-wrap gap-y-3.5 border-t-2 border-ink pt-3.5">
            {strands.map((s) => (
              <div key={s.name} className="flex flex-[1_1_150px] flex-col gap-0.5 pr-4">
                <strong className="text-17 font-bold leading-normal">{s.name}</strong>
                <span className="text-15 leading-normal text-ink-body">{s.text}</span>
              </div>
            ))}
          </div>
          <p className="m-0 max-w-[34em] text-lead">{t('model.lede')}</p>
        </div>
        {plan && (
          <StageSplit
            stages={plan.stages}
            subjects={t.raw('model.subjects')}
            title={t('model.balanceTitle')}
            hoursLabel={t('model.hoursLabel')}
            note={t('model.balanceNote')}
            bengali={locale === 'bengali'}
          />
        )}
      </div>
    </section>
  );
}
