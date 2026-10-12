import { generatePageMetadata } from '@/lib/page-metadata';
import Image from 'next/image';
import { curriculumImage } from '@/lib/curriculum-images';
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
import { getIntake } from '@/lib/admissions/pages';
import { getTranslations } from 'next-intl/server';
import type { FeeLocale } from '@/types/fees';
interface CurriculumPageProps {
  params: Promise<{ locale: FeeLocale }>;
}
export async function generateMetadata({ params }: CurriculumPageProps) {
  const { locale } = await params;
  const bn = locale === 'bengali';
  return generatePageMetadata({
    locale,
    path: '/curriculum',
    title: bn
      ? 'আমাদের কারিকুলাম - মাদরাসাতুল কুরআন'
      : 'Our Curriculum - Madrasatul Quran',
    description: bn
      ? 'উত্তরা, ঢাকার মাদরাসাতুল কুরআনের সমন্বিত কুরআন, আরবি ও NCTB কারিকুলাম, শ্রেণি ও পিরিয়ড অনুযায়ী পাঠ পরিকল্পনা, শিক্ষার লক্ষ্য এবং ফি সম্পর্কে জানুন।'
      : 'Explore our integrated Quran, Arabic and NCTB curriculum, class-by-class study plan, learning goals and school fees in Uttara, Dhaka.',
  });
}
export default async function CurriculumPage({ params }: CurriculumPageProps) {
  const { locale } = await params;
  const bn = locale === 'bengali';
  const t = await getTranslations({
    locale,
    namespace: 'admissionsExperience',
  });
  const service = getContentService(false);
  const [settings, intake, site] = await Promise.all([
    service.getFeeSettings(),
    getIntake(),
    service.getSiteSettings(),
  ]);
  const available = intake.state === 'open' || intake.state === 'not_open';
  const libraryImage = curriculumImage('higher-education');
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
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white md:grid md:grid-cols-[1fr_1.6fr]">
              <Image
                src={libraryImage.src}
                alt={libraryImage.alt[locale]}
                width={768}
                height={512}
                sizes="(min-width: 768px) 430px, calc(100vw - 32px)"
                loading="lazy"
                className="h-full w-full aspect-[3/2] object-cover"
              />
              <div className="p-5 md:p-8">
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
