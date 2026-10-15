import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { sitePhone } from '@/lib/site/phone';
import { faqFor, type FaqItem } from '@/lib/home/faq';
import type { HomeFaqItem } from '@/types/home';
import { FaqSection } from '@/components/site/faq-section';

/** Questions parents ask: from the CMS (Studio → Homepage), else the launch questions. */
export async function Faq({ locale, questions, officePhone }: { locale: Locale; questions?: HomeFaqItem[]; officePhone?: string }) {
  const t = await getTranslations({ locale, namespace: 'home.faq' });
  return (
    <FaqSection
      locale={locale}
      title={t('title')}
      lede={t('lede')}
      phone={sitePhone(officePhone, locale)}
      items={faqFor(questions, locale, t.raw('items') as FaqItem[])}
    />
  );
}
