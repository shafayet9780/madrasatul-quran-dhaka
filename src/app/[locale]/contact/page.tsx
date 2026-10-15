import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { generatePageMetadata } from '@/lib/page-metadata';
import { getContentService } from '@/lib/content-service';
import { contactDetails } from '@/lib/contact/details';
import { ContactHero } from '@/components/contact/contact-hero';
import { ContactReach } from '@/components/contact/contact-reach';
import { ContactFind } from '@/components/contact/contact-find';
import { ContactMore } from '@/components/contact/contact-more';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact.meta' });
  return generatePageMetadata({ title: t('title'), description: t('description'), locale, path: '/contact' });
}

/**
 * Contact: the office's call and WhatsApp buttons, hours and address, each desk's number, the emails, the way from the
 * metro with Google's map on request, and where to read more. Numbers, emails, hours, landmarks and the map come from
 * Site Settings → contact and location; there is no message form (calls and WhatsApp reach the office directly).
 */
export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const settings = await getContentService(false).getSiteSettings();
  const details = contactDetails(settings, locale);
  const social = (settings?.socialMedia ?? []).filter((s) => s.isActive).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return (
    <>
      <ContactHero locale={locale} details={details} />
      <ContactReach locale={locale} details={details} />
      <ContactFind locale={locale} details={details} />
      <ContactMore locale={locale} social={social} />
    </>
  );
}
