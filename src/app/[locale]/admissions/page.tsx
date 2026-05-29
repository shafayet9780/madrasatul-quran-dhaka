import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getContentService } from '@/lib/content-service';
// import { AdmissionsRequirements } from '@/components/admissions/requirements-section';
// import { FeeStructure } from '@/components/admissions/fee-structure-section';
import { TuitionFee } from '@/components/admissions/tuition-fee-section';
import { ImportantDates } from '@/components/admissions/important-dates-section';
import {
  ArrowRight,
  FileText,
  Users,
  Calendar,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { PageHero } from '@/components/ui/page-hero';

interface AdmissionsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: AdmissionsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admissions.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function AdmissionsPage({ params }: AdmissionsPageProps) {
  const { locale } = await params;
  const isBengali = locale === 'bn' || locale === 'bengali';

  // Fetch CMS data for admissions page
  const contentService = getContentService(false);
  const preAdmissionFormConfig = await contentService.getPreAdmissionForm();

  const isFormAvailable =
    preAdmissionFormConfig && preAdmissionFormConfig.formSettings.isEnabled;

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        language={isBengali ? 'bengali' : 'english'}
        icon={<Users className="h-7 w-7 text-white" />}
        title={isBengali ? 'ভর্তি তথ্য' : 'Admissions'}
        subtitle={
          isBengali
            ? 'মাদরাসাতুল কুরআনে আপনার সন্তানের ভবিষ্যৎ গড়ুন'
            : "Build your child's future at Madrasatul Quran"
        }
        chips={[
          { icon: <Calendar className="h-4 w-4" />, label: isBengali ? 'ভর্তি প্রক্রিয়া' : 'Admission Process' },
          { icon: <DollarSign className="h-4 w-4" />, label: isBengali ? 'টিউশন ফি' : 'Tuition Fee' },
          { icon: <FileText className="h-4 w-4" />, label: isBengali ? 'অনলাইন ফর্ম' : 'Online Form' },
        ]}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto space-y-20">
          {/* Pre-Admission Form CTA */}
          {isFormAvailable && (
            <section className="text-center">
              <div className="bg-white rounded-3xl p-8 md:p-12 border border-primary-200">
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-primary-400 mb-0">
                    {isBengali ? 'প্রি-অ্যাডমিশন ফর্ম' : 'Pre-Admission Form'}
                  </h2>
                </div>
                <p className="text-xl text-primary-300 mb-8 max-w-2xl mx-auto">
                  {isBengali
                    ? 'ভর্তির জন্য প্রি-অ্যাডমিশন ফর্ম পূরণ করুন। ফর্মটি সাবধানে পূরণ করে জমা দিন।'
                    : 'Fill out the pre-admission form for enrollment. Please complete the form carefully and submit it.'}
                </p>
                <Link
                  href="/pre-admission"
                  className="inline-flex items-center gap-3 bg-primary-600 text-white hover:bg-primary-700 font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <span className="text-lg">
                    {isBengali ? 'ফর্ম পূরণ করুন' : 'Fill Out Form'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </section>
          )}

          {/* Requirements and Application Process */}
          {/* <section className="mb-20">
            <AdmissionsRequirements />
          </section> */}

          {/* Fee Structure and Financial Information */}
          {/* <section className="mb-20">
            <FeeStructure />
          </section> */}

          {/* Tuition Fee */}
          <section className="mb-20">
            <TuitionFee />
          </section>

          {/* Important Dates and Inquiry System */}
          <section className="mb-20">
            <ImportantDates />
          </section>
        </div>
      </div>
    </div>
  );
}
