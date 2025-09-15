import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getContentService } from '@/lib/content-service';
import { AdmissionsRequirements } from '@/components/admissions/requirements-section';
import { FeeStructure } from '@/components/admissions/fee-structure-section';
import { ImportantDates } from '@/components/admissions/important-dates-section';
import { ArrowRight, FileText } from 'lucide-react';
import Link from 'next/link';

interface AdmissionsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: AdmissionsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admissions.meta' });
  
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function AdmissionsPage({ params }: AdmissionsPageProps) {
  const { locale } = await params;
  
  // Fetch pre-admission form configuration to check if it's available
  const contentService = getContentService(false);
  const preAdmissionFormConfig = await contentService.getPreAdmissionForm();
  const isFormAvailable = preAdmissionFormConfig && preAdmissionFormConfig.formSettings.isEnabled;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary-200 to-primary-300 text-primary-900 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {locale === 'bn' ? 'ভর্তি তথ্য' : 'Admissions'}
            </h1>
            <p className="text-xl text-primary-700">
              {locale === 'bn' 
                ? 'মাদরাসাতুল কুরআনে আপনার সন্তানের ভবিষ্যৎ গড়ুন'
                : 'Build your child\'s future at Madrasatul Quran'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Pre-Admission Form CTA */}
          {isFormAvailable && (
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
                  <FileText className="w-8 h-8" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {locale === 'bn' ? 'প্রি-অ্যাডমিশন ফর্ম' : 'Pre-Admission Form'}
                </h2>
                <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                  {locale === 'bn' 
                    ? 'ভর্তির জন্য প্রি-অ্যাডমিশন ফর্ম পূরণ করুন। ফর্মটি সাবধানে পূরণ করে জমা দিন।'
                    : 'Fill out the pre-admission form for enrollment. Please complete the form carefully and submit it.'
                  }
                </p>
                <Link 
                  href="/pre-admission"
                  className="inline-flex items-center space-x-3 bg-white text-green-600 hover:bg-white/90 font-semibold px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  <span className="text-lg">
                    {locale === 'bn' ? 'ফর্ম পূরণ করুন' : 'Fill Out Form'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          )}
          
          {/* Requirements and Application Process */}
          <AdmissionsRequirements />
          
          {/* Fee Structure and Financial Information */}
          <FeeStructure />
          
          {/* Important Dates and Inquiry System */}
          <ImportantDates />
        </div>
      </div>
    </div>
  );
}