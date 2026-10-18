import { getLocale, getTranslations } from 'next-intl/server';
import { ButtonLink } from '@/components/site/button';

/**
 * The site's 404 page, inside the header and footer. It also keeps a missing album, profile or article from reaching
 * the error boundary in the root layout ([locale]/layout.tsx).
 */
export default async function NotFound() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('site.notFound')]);
  return (
    <section className="bg-paper text-ink">
      <div className="page-wrap flex flex-col items-start gap-6 py-[clamp(72px,10vw,140px)]">
        <div className="flex max-w-[640px] flex-col gap-3">
          <h1 className="m-0 text-h2 text-balance">{t('title')}</h1>
          <p className="m-0 text-17 text-ink-body">{t('lead')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/${locale}`} size="lg">
            {t('home')}
          </ButtonLink>
          <ButtonLink href={`/${locale}/contact`} variant="outline" size="lg">
            {t('contact')}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
