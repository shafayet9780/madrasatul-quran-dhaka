import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { ButtonLink } from '@/components/site/button';

/** The close, on `cream`: come and see for yourself (the contact page has the hours and the way), or apply. */
export async function GalleryClose({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'gallery.close' });
  return (
    <section className="bg-cream text-ink">
      <div className="page-wrap flex flex-wrap items-center justify-between gap-8 py-[clamp(56px,6vw,88px)]">
        <div className="flex max-w-[640px] flex-col gap-2.5">
          <h2 className="m-0 text-h3 text-balance">{t('title')}</h2>
          <p className="m-0 text-17 text-ink-body">{t('lead')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/${locale}/contact`} variant="outline" size="lg">
            {t('visit')}
          </ButtonLink>
          <ButtonLink href={`/${locale}/pre-admission`} size="lg">
            {t('apply')}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
