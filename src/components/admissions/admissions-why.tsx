import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { ReasonCards } from '@/components/homepage/why';
import { Icon } from '@/components/site/icon';

/** The homepage reasons shown here, by their place in home.why.reasons: the blend, the languages, the hadith goal, the path after Class 8. */
const PICKED = [0, 1, 2, 4];

/**
 * Why Madrasatul Quran, short, on `dark` just before the fees, so the value comes before the price: four of the
 * homepage's reasons (same cards, same approved copy) and a link to all of them on the homepage.
 */
export async function AdmissionsWhy({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.why' });
  const a = await getTranslations({ locale, namespace: 'admissions.page' });
  return (
    <section id="why" className="bg-dark text-on-dark">
      <div className="page-wrap flex flex-col gap-9 py-section">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
          <h2 className="m-0 text-h2 text-balance">{t('title')}</h2>
          <Link
            href={`/${locale}#why`}
            className="inline-flex min-h-11 items-center gap-1.5 text-17 font-strong text-bronze-light no-underline hover:text-on-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze-light"
          >
            {a('whyMore')}
            <Icon name="arrow-right" size={18} />
          </Link>
        </div>
        <ReasonCards locale={locale} only={PICKED} ground="dark" />
      </div>
    </section>
  );
}
