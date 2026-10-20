import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { ReasonCards } from '@/components/site/reason-cards';
import { QuoteText } from '@/components/site/quote-text';
import { cn } from '@/lib/utils';
import type { HomePage } from '@/types/home';

/** Why Madrasatul Quran: the founders' reason in their words (from the prospectus), then eight reasons as cards. */
export async function Why({ locale, home }: { locale: Locale; home: HomePage | null }) {
  const t = await getTranslations({ locale, namespace: 'home.why' });
  return (
    <section id="why" className="bg-cream text-ink">
      <div className="page-wrap flex flex-col gap-11 py-section">
        <div className="flex max-w-[860px] flex-col gap-5">
          <h2 className="m-0 text-h2 text-balance">{t('title')}</h2>
          <figure className="m-0 flex flex-col gap-2.5">
            <blockquote className={cn('m-0 max-w-[40em] text-quote-lg text-ink-body', locale === 'bengali' && 'font-quote')}>
              <QuoteText text={t('quote')} />
            </blockquote>
            <figcaption className="text-14 text-ink-muted">{t('source')}</figcaption>
          </figure>
        </div>

        <ReasonCards locale={locale} home={home} />
      </div>
    </section>
  );
}
