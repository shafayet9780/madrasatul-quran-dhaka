import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { DIRECTIONS_URL, type contactDetails } from '@/lib/contact/details';
import { ButtonLink } from '@/components/site/button';
import { ContactLink } from '@/components/site/contact-link';
import { Icon } from '@/components/site/icon';

/** The close, on dark: come and see, the office hours (Site Settings), directions and a call to the office. */
export async function CampusClose({ locale, details }: { locale: Locale; details: ReturnType<typeof contactDetails> }) {
  const t = await getTranslations({ locale, namespace: 'campus.close' });
  return (
    <section className="bg-dark text-on-dark">
      <div className="page-wrap flex flex-wrap items-center gap-x-10 gap-y-5 py-[clamp(48px,6vw,72px)]">
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
          <h2 className="m-0 text-h2 text-balance">{t('title')}</h2>
          {details.hours && <p className="m-0 text-17 text-on-dark-body">{t('hours', { hours: details.hours })}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" variant="light" size="lg">
            <Icon name="navigation-arrow" />
            {t('directions')}
          </ButtonLink>
          {details.phone && (
            <ContactLink href={details.phone.tel} kind="call" where="campus_close" locale={locale} variant="outline-dark" size="lg">
              <Icon name="phone" />
              {t('call')}
            </ContactLink>
          )}
        </div>
      </div>
    </section>
  );
}
