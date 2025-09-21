import { Metadata } from 'next';
import { getContentService } from '@/lib/content-service';
import { PreAdmissionForm } from '@/components/forms';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PreAdmissionPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PreAdmissionPageProps): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: locale === 'bengali' ? 'প্রি-অ্যাডমিশন ফর্ম' : 'Pre-Admission Form',
    description: locale === 'bengali' 
      ? 'মাদরাসাতুল কুরআনে ভর্তির জন্য প্রি-অ্যাডমিশন ফর্ম পূরণ করুন'
      : 'Fill out the pre-admission form for enrollment at Madrasatul Quran',
  };
}

export default async function PreAdmissionPage({ params }: PreAdmissionPageProps) {
  const { locale } = await params;
  
  // Fetch pre-admission form configuration
  const contentService = getContentService(false);
  const preAdmissionFormConfig = await contentService.getPreAdmissionForm();
  
  // If form is not configured or disabled, show a message
  if (!preAdmissionFormConfig || !preAdmissionFormConfig.formSettings.isEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              {locale === 'bengali' ? 'ফর্ম পাওয়া যায়নি' : 'Form Not Available'}
            </h1>
            <p className="text-gray-600 mb-6">
              {locale === 'bengali' 
                ? 'প্রি-অ্যাডমিশন বর্তমানে গ্রহণ করা হচ্ছে না। অনুগ্রহ করে পরে আবার চেষ্টা করুন।'
                : 'The pre-admission form is currently not being accepted. Please try again later.'
              }
            </p>
            <Link 
              href="/admissions"
              className="inline-flex items-center space-x-2 btn-primary"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{locale === 'bengali' ? 'ভর্তি পেজে ফিরুন' : 'Back to Admissions'}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary-200 to-primary-300 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link 
              href="/admissions"
              className="inline-flex items-center space-x-2 text-white/90 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{locale === 'bengali' ? 'ভর্তি পেজে ফিরুন' : 'Back to Admissions'}</span>
            </Link>
            
            {/* Page Title */}
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {locale === 'bengali' ? 'প্রি-অ্যাডমিশন ফর্ম' : 'Pre-Admission Form'}
              </h1>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                {locale === 'bengali' 
                  ? 'মাদরাসাতুল কুরআনে ভর্তির জন্য নিচের ফর্মটি সাবধানে পূরণ করুন।'
                  : 'Please fill out the form below carefully for admission to Madrasatul Quran.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <PreAdmissionForm formConfig={preAdmissionFormConfig} />
          </div>
        </div>
      </div>
    </div>
  );
}
