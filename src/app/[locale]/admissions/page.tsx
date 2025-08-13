import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdmissionsRequirements } from '@/components/admissions/requirements-section';
import { FeeStructure } from '@/components/admissions/fee-structure-section';
import { ImportantDates } from '@/components/admissions/important-dates-section';

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
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {locale === 'bn' ? 'ভর্তি তথ্য' : 'Admissions'}
            </h1>
            <p className="text-xl text-primary-100">
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