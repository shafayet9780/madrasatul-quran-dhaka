import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { generateFAQStructuredData, serializeJsonLd } from '@/lib/seo';
import { sitePhone } from '@/lib/site/phone';
import { faqFor, type FaqItem } from '@/lib/home/faq';
import type { HomeFaqItem } from '@/types/home';
import { Icon } from '@/components/site/icon';

/**
 * Questions parents ask: native details/summary, so every answer is in the HTML and works without JavaScript.
 * The first is open. The questions come from the CMS (Studio → Homepage), else the launch questions; FAQPage
 * structured data is built from the same list.
 */
export async function Faq({ locale, questions, officePhone }: { locale: Locale; questions?: HomeFaqItem[]; officePhone?: string }) {
  const t = await getTranslations({ locale, namespace: 'home.faq' });
  const items = faqFor(questions, locale, t.raw('items') as FaqItem[]);
  const phone = sitePhone(officePhone, locale);
  return (
    <section className="bg-cream text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(generateFAQStructuredData(items.map((i) => ({ question: i.q, answer: i.a })), locale)) }} />
      <div className="page-wrap flex flex-wrap items-start gap-x-[72px] gap-y-6 pt-section">
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-3.5">
          <h2 className="m-0 text-h2 text-balance">{t('title')}</h2>
          {phone && (
            <p className="m-0 text-17 text-ink-body">
              {t('lede')}{' '}
              <a href={phone.tel} className="whitespace-nowrap font-strong text-rust underline underline-offset-4 hover:text-rust-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                {phone.display}
              </a>
            </p>
          )}
        </div>
        <div className="min-w-0 flex-[2_1_520px] border-b border-line-strong">
          {items.map((item, i) => (
            <details key={i} open={i === 0} className="group border-t border-line-strong">
              <summary className="flex min-h-[88px] cursor-pointer list-none items-center justify-between gap-4 py-3 text-[clamp(17px,1.5vw,19px)] leading-[1.4] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink [&::-webkit-details-marker]:hidden">
                {item.q}
                <Icon name="plus" size={22} className="shrink-0 text-rust group-open:hidden" />
                <Icon name="minus" size={22} className="hidden shrink-0 text-rust group-open:block" />
              </summary>
              <p className="m-0 max-w-[40em] pb-[22px] pr-10 text-16 leading-[1.7] text-ink-body motion-safe:animate-answer">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
