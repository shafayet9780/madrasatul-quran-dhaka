import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { ContactInfo } from '@/types/sanity';
import { getAdmissionsContact } from '@/lib/admissions-contact';
import { txt } from '@/lib/admissions/display';
import { sitePhone } from '@/lib/site/phone';
import { ButtonLink } from '@/components/site/button';
import { Icon } from '@/components/site/icon';
import { ContactButtons } from './contact-buttons';

/**
 * The page's close: a `dark` card on `cream` after the questions. Call or message the admissions office (Site
 * Settings → contact: the admissions phone, WhatsApp and office hours), and apply while the form is open.
 */
export async function AdmissionsClose({ locale, contact, open }: { locale: Locale; contact?: ContactInfo; open: boolean }) {
  const t = await getTranslations({ locale, namespace: 'admissions.page' });
  const cta = await getTranslations({ locale, namespace: 'admissionCta' });
  const details = getAdmissionsContact(contact);
  const hours = txt(details.officeHours, locale);
  return (
    <section className="bg-cream">
      <div className="page-wrap pb-section pt-[clamp(48px,6vw,80px)]">
        <div className="flex flex-col gap-7 rounded-panel bg-dark p-[clamp(24px,4vw,56px)] text-on-dark">
          <div className="flex max-w-[820px] flex-col gap-3.5">
            <h2 className="m-0 text-h3 text-balance">{t('closeTitle')}</h2>
            <p className="m-0 text-19 text-on-dark-body">{cta('fallbackLead')}</p>
            {hours && (
              <p className="m-0 flex items-center gap-2.5 text-16 text-on-dark-muted">
                <Icon name="clock" size={20} className="shrink-0 text-bronze-light" />
                {t('officeHours', { hours })}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {open && (
              <ButtonLink href={`/${locale}/pre-admission`} size="lg">
                {cta('apply')}
                <Icon name="arrow-right" />
              </ButtonLink>
            )}
            <ContactButtons locale={locale} phone={sitePhone(details.phone ?? undefined, locale)} whatsapp={details.whatsapp} labels={{ call: t('call'), whatsapp: t('whatsapp') }} />
          </div>
        </div>
      </div>
    </section>
  );
}
