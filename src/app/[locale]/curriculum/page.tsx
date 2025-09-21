import Link from 'next/link';
import { BookOpen, Star, ArrowRight, Users, Award } from 'lucide-react';
import ProspectusDownload from '@/components/ui/prospectus-download';
import { TenYearStudyPlan, UniqueFeatures, CurriculumBreakdown, FeeStructure } from '@/components/curriculum';

interface CurriculumPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CurriculumPageProps) {
  const { locale } = await params;
  const isBengali = locale === 'bn' || locale === 'bengali';
  
  return {
    title: isBengali ? 'আমাদের কারিকুলাম - মাদরাসাতুল কুরআন' : 'Our Curriculum - Madrasatul Quran',
    description: isBengali 
      ? 'কুরআন-সুন্নাহ ভিত্তিক তারবিয়াহ্‌, আরবী ও দীনী শিক্ষা এবং NCTB একাডেমিকের সমন্বয়ে পরিকল্পিত সমন্বিত কারিকুলাম'
      : 'Integrated curriculum combining Quran-Sunnah based Tarbiyah, Arabic & Islamic education with NCTB academic standards',
  };
}

export default async function CurriculumPage({ params }: CurriculumPageProps) {
  const { locale } = await params;
  const isBengali = locale === 'bn' || locale === 'bengali';

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-12 md:py-16 bg-gradient-to-r from-primary-200 to-secondary-300 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {isBengali ? 'আমাদের কারিকুলাম' : 'Our Curriculum'}
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 mb-6 leading-relaxed max-w-3xl mx-auto">
              {isBengali 
                ? 'কুরআন-সুন্নাহ ভিত্তিক তারবিয়াহ্‌, আরবী ও দীনী শিক্ষা এবং NCTB একাডেমিকের সমন্বয়ে পরিকল্পিত সমন্বিত কারিকুলাম'
                : 'Integrated curriculum combining Quran-Sunnah based Tarbiyah, Arabic & Islamic education with NCTB academic standards'
              }
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">{isBengali ? 'সমন্বিত শিক্ষা' : 'Integrated Learning'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                <span className="text-sm font-medium">{isBengali ? 'মানসম্পন্ন পাঠ্যক্রম' : 'Quality Education'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                <span className="text-sm font-medium">{isBengali ? 'ইসলামী মূল্যবোধ' : 'Islamic Values'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Unique Features */}
        <section className="mb-20">
          <UniqueFeatures />
        </section>

        {/* 10-Year Study Plan */}
        <section className="mb-20">
          <TenYearStudyPlan />
        </section>

        {/* Curriculum Breakdown */}
        <section className="mb-20">
          <CurriculumBreakdown />
        </section>

        {/* Fee Structure */}
        <section className="mb-20">
          <FeeStructure />
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-primary-200">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-400">
              {isBengali ? 'আমাদের সাথে যোগ দিন' : 'Join Our Community'}
            </h2>
            <p className="text-xl text-primary-300 mb-8 max-w-2xl mx-auto">
              {isBengali 
                ? 'আপনার সন্তানের জন্য সেরা শিক্ষার সুযোগ তৈরি করুন'
                : 'Create the best educational opportunity for your child'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/admissions" 
                className="group inline-flex items-center gap-3 bg-primary-500 text-white hover:bg-primary-700 font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <span className="text-lg">
                  {isBengali ? 'ভর্তির জন্য আবেদন করুন' : 'Apply for Admission'}
                </span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              
              <ProspectusDownload 
                locale={locale} 
                variant="secondary"
                size="lg"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


