import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { Icon, type IconName } from '@/components/site/icon';
import { QuoteText } from '@/components/site/quote-text';
import { cn } from '@/lib/utils';

// The four strands in the prospectus's order, each in its subject colour from the curriculum map.
const STRANDS: { icon: IconName; look: string }[] = [
  { icon: 'book-open-text', look: 'bg-rust-deep text-paper' },
  { icon: 'translate', look: 'bg-clay text-surface' },
  { icon: 'mosque', look: 'bg-sand-deep text-rust-deep shadow-[inset_0_0_0_1px_var(--color-line-sand)]' },
  { icon: 'chalkboard-teacher', look: 'bg-paper text-rust shadow-[inset_0_0_0_1px_var(--color-line-bronze)]' },
];

/** The four strands (the prospectus's কারিকুলাম cards) on `paper`, beside the chairman's words on why NCTB with the school's own Islamic curriculum. */
export async function Strands({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'curriculum.strands' });
  const cards = t.raw('cards') as { title: string; text: string; range: string }[];
  return (
    <section id="strands" className="bg-paper text-ink">
      <div className="page-wrap flex flex-col gap-10 py-section">
        <div className="flex flex-wrap items-end gap-x-16 gap-y-6">
          <div className="flex flex-[1_1_360px] flex-col gap-3.5">
            <h2 className="m-0 text-h2 text-balance">{t('title')}</h2>
            <p className="m-0 max-w-[40em] text-19 leading-[1.65] text-ink-body">{t('lead')}</p>
          </div>
          <figure className="m-0 flex min-w-0 flex-[1.3_1_420px] flex-col gap-2.5 border-l-4 border-rust pl-5">
            <blockquote className={cn('m-0 text-quote-lg text-ink-body', locale === 'bengali' && 'font-quote')}>
              <QuoteText text={t('quote')} />
            </blockquote>
            <figcaption className="text-14 text-ink-muted">{t('quoteBy')}</figcaption>
          </figure>
        </div>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,250px),1fr))] gap-3.5 p-0">
          {cards.map((c, i) => (
            <li key={c.title} className="flex flex-col gap-2.5 rounded-card border border-line bg-surface p-[22px]">
              <span className={cn('flex size-12 items-center justify-center rounded-xl', STRANDS[i].look)}>
                <Icon name={STRANDS[i].icon} size={26} />
              </span>
              <h3 className="m-0 text-19 leading-[1.3] font-bold">{c.title}</h3>
              <p className="m-0 text-16 leading-[1.6] text-ink-body">{c.text}</p>
              <p className="m-0 mt-auto border-t border-line pt-2.5 text-14 text-ink-muted">{c.range}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
