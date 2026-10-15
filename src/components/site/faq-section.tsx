import type { Locale } from '@/lib/i18n';
import type { FaqItem } from '@/lib/home/faq';
import { generateFAQStructuredData, serializeJsonLd } from '@/lib/seo';
import { Icon } from '@/components/site/icon';

/**
 * Questions parents ask, on `cream` with no bottom padding (a card follows on the same ground): the H2 and a line
 * ending in the office number on the left, the answers on the right. Native details/summary, so every answer is in
 * the HTML and works without JavaScript; the first is open. FAQPage structured data is built from the same list.
 */
export function FaqSection({
  id,
  locale,
  title,
  lede,
  phone,
  items,
}: {
  id?: string;
  locale: Locale;
  title: string;
  lede: string;
  phone: { tel: string; display: string } | null;
  items: FaqItem[];
}) {
  return (
    <section id={id} className="bg-cream text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(generateFAQStructuredData(items.map((i) => ({ question: i.q, answer: i.a })), locale)) }} />
      <div className="page-wrap flex flex-wrap items-start gap-x-[72px] gap-y-6 pt-section">
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-3.5">
          <h2 className="m-0 text-h2 text-balance">{title}</h2>
          {phone && (
            <p className="m-0 text-17 text-ink-body">
              {lede}{' '}
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
