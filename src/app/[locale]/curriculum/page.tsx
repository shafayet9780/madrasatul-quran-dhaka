import Link from 'next/link';
import { BookOpen, Star, ArrowRight, Users, Award } from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';
import ProspectusDownload from '@/components/ui/prospectus-download';
import CurriculumDownload from '@/components/ui/curriculum-download';
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
      <PageHero
        language={isBengali ? 'bengali' : 'english'}
        icon={<BookOpen className="h-7 w-7 text-white" />}
        title={isBengali ? 'আমাদের কারিকুলাম' : 'Our Curriculum'}
        subtitle={
          isBengali
            ? 'কুরআন-সুন্নাহ ভিত্তিক তারবিয়াহ্‌, আরবী ও দীনী শিক্ষা এবং NCTB একাডেমিকের সমন্বয়ে পরিকল্পিত সমন্বিত কারিকুলাম'
            : 'Integrated curriculum combining Quran-Sunnah based Tarbiyah, Arabic & Islamic education with NCTB academic standards'
        }
        chips={[
          { icon: <Users className="h-4 w-4" />, label: isBengali ? 'সমন্বিত শিক্ষা' : 'Integrated Learning' },
          { icon: <Award className="h-4 w-4" />, label: isBengali ? 'মানসম্পন্ন পাঠ্যক্রম' : 'Quality Education' },
          { icon: <Star className="h-4 w-4" />, label: isBengali ? 'ইসলামী মূল্যবোধ' : 'Islamic Values' },
        ]}
      />

      {/* Curriculum Download CTA Section */}
      <section className="pt-12 pb-6">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-lg border border-primary-200 p-8 md:p-12">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-300 to-primary-400 rounded-full flex items-center justify-center shadow-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-primary-300 mb-0">
                  {isBengali ? 'বিস্তারিত কারিকুলাম' : 'Detailed Curriculum'}
                </h2>
              </div>
              <p className="text-lg text-primary-200 mb-8 max-w-2xl mx-auto">
                {isBengali 
                  ? 'আমাদের সম্পূর্ণ কারিকুলামের বিস্তারিত বিবরণ ডাউনলোড করুন এবং আপনার সন্তানকে নিয়ে আমাদের পরিকল্পনা দেখুন'
                  : 'Download our complete curriculum details and see our plan for your child\'s educational journey'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <CurriculumDownload 
                  locale={locale as 'bengali' | 'english'} 
                  variant="primary"
                  size="lg"
                />
                <Link 
                  href="/admissions" 
                  className="group inline-flex items-center gap-3 bg-secondary-50 text-primary-400 border-2 border-primary-400 font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <span className="text-lg">
                    {isBengali ? 'ভর্তির জন্য আবেদন করুন' : 'Apply for Admission'}
                  </span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
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


