import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { contactDetails } from '@/lib/contact/details';
import { ContactLink } from '@/components/site/contact-link';
import { Icon } from '@/components/site/icon';

type Details = ReturnType<typeof contactDetails>;

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ink';

/**
 * Still on `paper`: WhatsApp in a plain card (only its logo and button carry WhatsApp's green), then each desk in one
 * card, the whole row a call link, side by side on wide screens; then the emails. All from Site Settings → contact.
 */
export async function ContactReach({ locale, details }: { locale: Locale; details: Details }) {
  const t = await getTranslations({ locale, namespace: 'contact.reach' });
  const { whatsapp, desks, emails, hours } = details;
  return (
    <section className="bg-paper text-ink">
      <div className="page-wrap flex flex-col gap-[clamp(40px,5vw,64px)] pb-section">
        {(whatsapp || desks.length > 0) && (
          <div className="flex flex-col gap-5">
            <h2 className="m-0 text-h3">{t('title')}</h2>
            {whatsapp && (
              <div className="flex flex-wrap items-center gap-x-7 gap-y-[18px] rounded-panel border border-line bg-surface p-[clamp(18px,2.6vw,28px)]">
                <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-whatsapp-brand text-surface">
                  <Icon name="whatsapp-logo" size={38} />
                </span>
                <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1">
                  <h3 className="m-0 text-h4">{t('waTitle')}</h3>
                  <p className="m-0 text-17 text-ink-body">
                    {t('waText')} <strong className="whitespace-nowrap text-ink">{whatsapp.display}</strong>
                  </p>
                </div>
                <ContactLink
                  href={`https://wa.me/${whatsapp.e164.slice(1)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  kind="whatsapp"
                  where="contact_whatsapp"
                  locale={locale}
                  variant="whatsapp"
                  size="lg"
                  className="max-w-[320px] flex-auto px-[26px]"
                >
                  <Icon name="whatsapp-logo" size={24} />
                  {t('waButton')}
                </ContactLink>
              </div>
            )}
            {desks.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="m-0 flex items-center gap-2.5 text-h4">
                  <Icon name="phone" size={22} className="text-rust" />
                  {t('callTitle')}
                </h3>
                <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,230px),1fr))] gap-px overflow-hidden rounded-card border border-line bg-line p-0">
                  {desks.map((d) => (
                    <li key={d.e164 + d.desk} className="bg-surface">
                      <ContactLink
                        href={d.tel}
                        kind="call"
                        where="contact_desks"
                        locale={locale}
                        aria-label={t('callLabel', { desk: d.desk, number: d.display })}
                        className={`flex min-h-[76px] items-center gap-3.5 px-[18px] py-3.5 text-ink no-underline hover:bg-cream ${focus}`}
                      >
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-14 font-strong text-ink-muted">{d.desk}</span>
                          <strong className="text-[1.25rem] font-heading">{d.display}</strong>
                        </span>
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink">
                          <Icon name="phone" />
                        </span>
                      </ContactLink>
                    </li>
                  ))}
                </ul>
                {hours && <p className="m-0 text-14 text-ink-muted">{t('hours', { hours })}</p>}
              </div>
            )}
          </div>
        )}

        {emails.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="m-0 text-h3">{t('emailTitle')}</h2>
            <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
              {emails.map((e) => (
                <li key={e} className="min-w-0 max-w-full">
                  <ContactLink
                    href={`mailto:${e}`}
                    kind="email"
                    where="contact_email"
                    locale={locale}
                    lang="en"
                    className={`flex min-h-12 items-center gap-2.5 break-all rounded-cell border border-line bg-surface px-[18px] py-2 text-16 font-strong text-ink no-underline hover:bg-cream ${focus}`}
                  >
                    <Icon name="envelope-simple" className="shrink-0 text-rust" />
                    {e}
                  </ContactLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
