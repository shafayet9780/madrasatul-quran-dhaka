import styles from '@/components/admissions/admissions-experience.module.css';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getContentService } from '@/lib/content-service';
import { AdmissionsFaq } from '@/components/admissions/admissions-faq';
import {
  ApplicationAction,
  ContactPanel,
} from '@/components/admissions/contact-panel';
import { PageNavigation } from '@/components/admissions/page-navigation';
import {
  FinancialInformation,
  financialLinks,
} from '@/components/fees/financial-information';
import { PageHero } from '@/components/ui/page-hero';
import type { FeeLocale } from '@/types/fees';
interface AdmissionsPageProps {
  params: Promise<{ locale: FeeLocale }>;
}
export async function generateMetadata({
  params,
}: AdmissionsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admissions.meta' });
  return { title: t('title'), description: t('description') };
}
export default async function AdmissionsPage({ params }: AdmissionsPageProps) {
  const { locale } = await params;
  const bn = locale === 'bengali';
  const t = await getTranslations({
    locale,
    namespace: 'admissionsExperience',
  });
  const service = getContentService(false);
  const [settings, form, site] = await Promise.all([
    service.getFeeSettings(),
    service.getPreAdmissionForm(),
    service.getSiteSettings(),
  ]);
  const available = !!form?.formSettings?.isEnabled;
  const links = [
    { id: 'application', label: t('stepsHeading') },
    ...financialLinks(settings, locale),
    { id: 'faq', label: t('faq') },
    { id: 'contact-admissions', label: t('contact') },
  ];
  return (
    <div className={`${styles.page} bg-white pb-20`}>
      <PageHero
        compact
        language={locale}
        title={bn ? 'ভর্তি তথ্য' : 'Admissions'}
        subtitle={
          bn
            ? 'আপনার সন্তানের পরবর্তী পদক্ষেপ সম্পর্কে জানুন'
            : 'Plan your child’s next step at Madrasatul Quran'
        }
        actions={<ApplicationAction available={available} locale={locale} />}
      />
      <div className="mx-auto max-w-6xl px-4">
        <PageNavigation links={links} label={t('navigation')} />
        <div className="space-y-12 py-8 md:py-12">
          <section id="application" className="scroll-mt-48">
            <h2 className="text-2xl font-semibold tracking-tight text-[#352b24]">
              {t('stepsHeading')}
            </h2>
            <ol className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                available ? 'applyStep' : 'contactStep',
                'guidanceStep',
                'confirmationStep',
              ].map((key, i) => (
                <li key={key} className="border-t border-[#e9e4dc] pt-5">
                  <span
                    aria-hidden="true"
                    className="mb-3 inline-block text-sm font-medium tabular-nums text-[#947856]"
                  >
                    {new Intl.NumberFormat(bn ? 'bn-BD' : 'en-BD', {
                      minimumIntegerDigits: 2,
                    }).format(i + 1)}
                  </span>
                  <p className="text-gray-800 leading-relaxed">{t(key)}</p>
                </li>
              ))}
            </ol>
          </section>
          <FinancialInformation settings={settings} locale={locale} />
          <AdmissionsFaq settings={settings} locale={locale} />
          <ContactPanel contact={site?.contactInfo} locale={locale} />
        </div>
      </div>
    </div>
  );
}
