import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { contactDetails } from '@/lib/contact/details';
import { ContactLink } from '@/components/site/contact-link';
import { Icon } from '@/components/site/icon';

type Details = ReturnType<typeof contactDetails>;

/**
 * The page's opening, on `paper`: the H1, what to get in touch about, the office's call and WhatsApp buttons (WhatsApp in
 * its own green), and a card with the office hours and the address (School details → contact) linking to the way here.
 */
export async function ContactHero({ locale, details }: { locale: Locale; details: Details }) {
  const t = await getTranslations({ locale, namespace: 'contact.hero' });
  const { phone, whatsapp, hours, address } = details;
  // Each label with its icon; the value lines up under the label (24px icon + 14px gap).
  const label = 'flex items-center gap-3.5 text-15 font-strong text-ink-muted';
  return (
    <section className="bg-paper text-ink">
      <div className="page-wrap flex flex-wrap items-end gap-x-16 gap-y-10 pb-[clamp(2.5rem,5vw,4rem)] pt-[clamp(2rem,5vw,4.5rem)]">
        <div className="flex min-w-0 flex-[3_1_440px] flex-col items-start gap-5">
          <h1 className="m-0 text-hero text-balance">{t('title')}</h1>
          <p className="m-0 max-w-[34em] text-lead text-ink-body">{t('lede')}</p>
          <div className="mt-1 flex flex-wrap gap-3">
            {phone && (
              <ContactLink href={phone.tel} kind="call" where="contact_hero" locale={locale} variant="outline" size="lg" className="px-6">
                <Icon name="phone" />
                {t('call')}
              </ContactLink>
            )}
            {whatsapp && (
              <ContactLink
                href={`https://wa.me/${whatsapp.e164.slice(1)}`}
                target="_blank"
                rel="noopener noreferrer"
                kind="whatsapp"
                where="contact_hero"
                locale={locale}
                variant="whatsapp"
                size="lg"
                className="px-6"
              >
                <Icon name="whatsapp-logo" />
                {t('whatsapp')}
              </ContactLink>
            )}
          </div>
        </div>
        {(hours || address) && (
          <dl className="m-0 flex min-w-0 flex-[2_1_320px] flex-col gap-4 rounded-card border border-line bg-surface p-[clamp(20px,2.4vw,28px)]">
            {hours && (
              <div>
                <dt className={label}>
                  <Icon name="clock" size={24} className="shrink-0 text-rust" />
                  {t('hours')}
                </dt>
                <dd className="m-0 pl-[38px] text-18 font-strong leading-[1.45]">{hours}</dd>
              </div>
            )}
            {address && (
              <div className="border-t border-line pt-4 first:border-t-0 first:pt-0">
                <dt className={label}>
                  <Icon name="map-pin" size={24} className="shrink-0 text-rust" />
                  {t('address')}
                </dt>
                <dd className="m-0 flex flex-col gap-1 pl-[38px]">
                  <span className="text-17 leading-normal">{address}</span>
                  <a
                    href="#find"
                    className="inline-flex min-h-11 items-center gap-1.5 self-start text-16 font-strong text-rust no-underline hover:text-rust-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    {t('howToGet')}
                    <Icon name="arrow-right" size={18} />
                  </a>
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </section>
  );
}
