import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { Review } from '@/lib/home/reviews';
import { Icon } from '@/components/site/icon';
import { QuoteText } from '@/components/site/quote-text';
import { cn } from '@/lib/utils';

/**
 * What guardians say: their words, unedited, each shared with their permission (Studio → Guardian reviews, consent
 * recorded). With no such review the section is left out. On `paper` (the homepage) or `dark` (the Admissions page,
 * between two light sections); the cards stay `surface` either way.
 */
export async function Reviews({ locale, reviews, tone = 'paper' }: { locale: Locale; reviews: Review[]; tone?: 'paper' | 'dark' }) {
  if (!reviews.length) return null;
  const t = await getTranslations({ locale, namespace: 'home.reviews' });
  return (
    <section className={tone === 'dark' ? 'bg-dark text-on-dark' : 'bg-paper text-ink'}>
      <div className="page-wrap flex flex-col gap-9 py-section">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
          <h2 className="m-0 text-h2 text-balance">{t('title')}</h2>
          <p className={cn('m-0 max-w-[30em] text-15', tone === 'dark' ? 'text-on-dark-muted' : 'text-ink-muted')}>{t('note')}</p>
        </div>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4 p-0">
          {reviews.map((r) => (
            <li key={r.id} className="flex flex-col gap-[18px] rounded-card border border-line bg-surface p-[clamp(22px,2.4vw,30px)] text-ink">
              <Icon name="quotes" size={30} className="text-bronze" />
              <blockquote lang={r.language === 'bengali' ? 'bn' : 'en'} className={cn('m-0 flex-1 text-quote text-ink', r.language === 'bengali' && 'font-quote')}>
                <QuoteText text={r.text} />
              </blockquote>
              <p className="m-0 flex flex-col gap-0.5 border-t border-sand-pale pt-3.5 leading-[1.35]">
                <strong className="text-15 font-strong">{r.who}</strong>
                <span className="text-13 text-ink-muted">
                  {r.classLine}
                  {r.translated && ` ${t('translated')}`}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
