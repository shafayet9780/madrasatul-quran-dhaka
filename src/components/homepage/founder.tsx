import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { QuoteText } from '@/components/site/quote-text';
import { cn } from '@/lib/utils';

/** The founder's letter: his words on knowledge, the school's aim, and who he is. The heading is for screen readers only. */
export async function Founder({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.founder' });
  const quote = locale === 'bengali' && 'font-quote';
  return (
    <section className="bg-dark text-on-dark">
      <div className="page-wrap flex flex-wrap items-start gap-x-[72px] gap-y-9 py-section">
        <h2 className="sr-only">{t('title')}</h2>
        <div className="flex min-w-0 flex-[3_1_520px] flex-col gap-6">
          <blockquote className={cn('m-0 text-quote-xl', quote)}>
            <QuoteText text={t('quote')} />
          </blockquote>
          <p className={cn('m-0 max-w-[36em] text-letter text-on-dark-body', quote)}>
            <QuoteText text={t('aim')} />
          </p>
        </div>
        <div className="flex min-w-0 flex-[2_1_340px] flex-wrap items-end gap-5">
          {/* A duotone portrait: the photo in grey, multiplied onto sand, its shadows lifted to the panel brown. */}
          <div className="relative isolate aspect-[4/5] flex-[0_0_clamp(150px,16vw,210px)] overflow-hidden rounded-photo bg-sand">
            <Image src="/images/home/founder.jpg" alt={t('name')} fill sizes="210px" className="object-cover object-[50%_20%] mix-blend-multiply brightness-[1.05] contrast-[1.08] grayscale" />
            <span aria-hidden="true" className="absolute inset-0 bg-panel mix-blend-lighten" />
          </div>
          <div className="flex flex-[1_1_200px] flex-col gap-1.5 border-t border-line-dark-strong pt-3.5">
            <strong className={cn('text-[23px] font-normal leading-[1.25]', quote)}>{t('name')}</strong>
            <span className="text-14 text-on-dark-muted">{t('role')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
