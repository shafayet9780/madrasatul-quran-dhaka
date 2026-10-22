import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { ContactInfo } from '@/types/sanity';
import { getAdmissionsContact } from '@/lib/admissions-contact';

const TOPICS = ['admissions', 'curriculum', 'visit', 'other'] as const;

export type WhatsAppTopic = { key: (typeof TOPICS)[number]; label: string; href: string };
export type WhatsAppChooser = {
  label: string;
  close: string;
  title: string;
  replies: string;
  hours?: string;
  topics: WhatsAppTopic[];
};

/**
 * The WhatsApp button's panel: what to ask about, each topic a link to the office's WhatsApp (School details) with
 * its message typed in, and the office hours. None without a number.
 */
export async function whatsAppChooser(locale: Locale, contact?: ContactInfo): Promise<WhatsAppChooser | null> {
  const { whatsapp, officeHours } = getAdmissionsContact(contact);
  if (!whatsapp) return null;
  const t = await getTranslations({ locale, namespace: 'site.whatsapp' });
  return {
    label: t('label'),
    close: t('close'),
    title: t('title'),
    replies: t('replies'),
    hours: officeHours?.[locale] || undefined,
    topics: TOPICS.map((key) => ({
      key,
      label: t(`topics.${key}.label`),
      href: `https://wa.me/${whatsapp.slice(1)}?text=${encodeURIComponent(t(`topics.${key}.message`))}`,
    })),
  };
}
