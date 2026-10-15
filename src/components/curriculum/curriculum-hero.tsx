import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { ButtonLink } from '@/components/site/button';
import { Icon } from '@/components/site/icon';
import { OnThisPage } from '@/components/site/on-this-page';
import { keepHyphens } from '@/lib/admissions/admissions-page';

/**
 * The page's opening, on `paper`: the H1, the prospectus's one-line summary, the two downloads (the detailed curriculum
 * and the prospectus), the plan at a glance, and links to each section.
 */
export async function CurriculumHero({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'curriculum.hero' });
  const home = await getTranslations({ locale, namespace: 'home.hero' });
  const admissions = await getTranslations({ locale, namespace: 'admissions.page' });
  const glance = t.raw('glance') as { label: string; value: string }[];
  const links = (['model', 'strands', 'goals', 'plan', 'after'] as const).map((id) => ({ id, label: t(`nav.${id}`) }));
  return (
    <section className="bg-paper text-ink">
      <div className="page-wrap flex flex-col gap-[clamp(2rem,4vw,3rem)] pb-8 pt-[clamp(2rem,5vw,4.5rem)]">
        <div className="flex flex-wrap items-end gap-x-16 gap-y-10">
          <div className="flex min-w-0 flex-[3_1_440px] flex-col items-start gap-5">
            <h1 className="m-0 text-hero text-balance">{t('title')}</h1>
            <p className="m-0 max-w-[34em] text-lead text-ink-body">{t('lead')}</p>
            <div className="mt-1 flex flex-wrap gap-3">
              <ButtonLink href="/api/download-curriculum" variant="outline" size="lg" className="px-6">
                <Icon name="download-simple" />
                {t('curriculumPdf')}
              </ButtonLink>
              <ButtonLink href="/api/download-prospectus" variant="outline" size="lg" className="px-6">
                <Icon name="download-simple" />
                {home('prospectus')}
              </ButtonLink>
            </div>
          </div>
          <div className="flex min-w-0 flex-[2_1_320px] flex-col gap-3.5 rounded-card border border-line bg-surface p-[clamp(20px,2.4vw,28px)]">
            <h2 className="m-0 text-h4">{t('glanceTitle')}</h2>
            <dl className="m-0 flex flex-col">
              {glance.map((g) => (
                <div key={g.label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-t border-line py-2.5 last:pb-0">
                  <dt className="text-15 text-ink-muted">{g.label}</dt>
                  <dd className="m-0 ml-auto text-right text-16 font-strong">{keepHyphens(g.value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <OnThisPage label={admissions('onThisPage')} links={links} />
      </div>
    </section>
  );
}
