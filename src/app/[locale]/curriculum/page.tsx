import styles from '@/components/admissions/admissions-experience.module.css';
import { PageHero } from '@/components/ui/page-hero';
import ProspectusDownload from '@/components/ui/prospectus-download';
import CurriculumDownload from '@/components/ui/curriculum-download';
import TenYearStudyPlan from '@/components/curriculum/ten-year-study-plan';
import UniqueFeatures from '@/components/curriculum/unique-features';
import CurriculumBreakdown from '@/components/curriculum/curriculum-breakdown';
import {
  ApplicationAction,
  ContactPanel,
} from '@/components/admissions/contact-panel';
import { PageNavigation } from '@/components/admissions/page-navigation';
import {
  FinancialInformation,
  financialLinks,
} from '@/components/fees/financial-information';
import { getContentService } from '@/lib/content-service';
import { getTranslations } from 'next-intl/server';
import type { FeeLocale } from '@/types/fees';
interface CurriculumPageProps {
  params: Promise<{ locale: FeeLocale }>;
}
export async function generateMetadata({ params }: CurriculumPageProps) {
  const { locale } = await params;
  const bn = locale === 'bengali';
  return {
    title: bn
      ? 'আমাদের কারিকুলাম - মাদরাসাতুল কুরআন'
      : 'Our Curriculum - Madrasatul Quran',
    description: bn
      ? 'কুরআন-সুন্নাহ ভিত্তিক তারবিয়াহ্‌, আরবী ও দীনী শিক্ষা এবং NCTB একাডেমিকের সমন্বয়ে পরিকল্পিত সমন্বিত কারিকুলাম'
      : 'Integrated curriculum combining Quran-Sunnah based Tarbiyah, Arabic & Islamic education with NCTB academic standards',
  };
}
export default async function CurriculumPage({ params }: CurriculumPageProps) {
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
  return (
    <div className={`${styles.page} bg-white pb-20`}>
      <PageHero
        compact
        language={locale}
        title={bn ? 'আমাদের কারিকুলাম' : 'Our Curriculum'}
        subtitle={
          bn
            ? 'কুরআন-সুন্নাহ ভিত্তিক তারবিয়াহ্‌, আরবী ও দীনী শিক্ষা এবং NCTB একাডেমিকের সমন্বয়ে পরিকল্পিত সমন্বিত কারিকুলাম'
            : 'Integrated curriculum combining Quran-Sunnah based Tarbiyah, Arabic & Islamic education with NCTB academic standards'
        }
        actions={
          <>
            <ApplicationAction available={available} locale={locale} />
            <CurriculumDownload
              locale={locale}
              variant="outline"
              size="md"
              className="bg-white text-primary-800 hover:bg-primary-50 motion-reduce:transition-none"
            />
          </>
        }
      />
      <div className="mx-auto max-w-6xl px-4">
        <PageNavigation
          label={t('navigation')}
          links={[
            { id: 'features', label: t('features') },
            { id: 'study-plan', label: t('studyPlan') },
            { id: 'outcomes', label: t('outcomes') },
            ...financialLinks(settings, locale),
          ]}
        />
        <div className="space-y-12 py-8 md:py-12">
          <section id="features" className="scroll-mt-48">
            <UniqueFeatures compact />
          </section>
          <section id="study-plan" className="scroll-mt-48">
            <TenYearStudyPlan />
          </section>
          <section id="outcomes" className="scroll-mt-48 space-y-6">
            <CurriculumBreakdown compact />
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <h3 className="text-xl font-semibold text-primary-800">
                {t('higherEducation')}
              </h3>
              <p className="mt-3 text-gray-700 leading-relaxed">
                {t('alimPath')}
              </p>
              <p className="mt-3 text-gray-700 leading-relaxed">
                {t('collegePath')}
              </p>
            </div>
          </section>
          <FinancialInformation settings={settings} locale={locale} />
          <ContactPanel contact={site?.contactInfo} locale={locale} />
          <div className="flex flex-wrap gap-3">
            <ApplicationAction available={available} locale={locale} />
            <ProspectusDownload locale={locale} variant="secondary" size="md" />
          </div>
        </div>
      </div>
    </div>
  );
}
