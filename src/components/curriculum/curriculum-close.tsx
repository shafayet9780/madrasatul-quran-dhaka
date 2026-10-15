import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { ButtonLink } from '@/components/site/button';
import { Icon } from '@/components/site/icon';

/** The page's close, a `cream` card on `paper`: ages, steps and fees live on the Admissions page. Apply shows while the form is open. */
export async function CurriculumClose({ locale, open }: { locale: Locale; open: boolean }) {
  const t = await getTranslations({ locale, namespace: 'curriculum.close' });
  const cta = await getTranslations({ locale, namespace: 'admissionCta' });
  return (
    <section className="bg-paper text-ink">
      <div className="page-wrap pb-section pt-[clamp(48px,6vw,80px)]">
        <div className="flex flex-wrap items-center gap-x-16 gap-y-6 rounded-panel bg-cream p-[clamp(24px,4vw,56px)]">
          <div className="flex flex-[3_1_420px] flex-col gap-3">
            <h2 className="m-0 text-h3 text-balance">{t('title')}</h2>
            <p className="m-0 text-18 leading-[1.6] text-ink-body">{t('text')}</p>
          </div>
          <div className="flex flex-[2_1_300px] flex-wrap gap-3">
            {open && (
              <ButtonLink href={`/${locale}/pre-admission`} size="lg">
                {cta('apply')}
                <Icon name="arrow-right" />
              </ButtonLink>
            )}
            <ButtonLink href={`/${locale}/admissions`} variant="outline" size="lg">
              {t('admissions')}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
