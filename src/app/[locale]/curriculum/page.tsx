import Link from 'next/link';
import { BookOpen, GraduationCap, Star, ArrowRight, Sparkles, Users, Clock, Award } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-r from-primary-200 to-secondary-300 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-8">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {isBengali ? 'আমাদের কারিকুলাম' : 'Our Curriculum'}
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed max-w-3xl mx-auto">
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
        {/* Curriculum Pillars */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {isBengali ? 'শিক্ষার তিনটি স্তম্ভ' : 'Three Pillars of Education'}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {isBengali 
                ? 'আমাদের শিক্ষা ব্যবস্থার মূল ভিত্তি এই তিনটি স্তম্ভের উপর প্রতিষ্ঠিত'
                : 'Our educational system is built on these three fundamental pillars'
              }
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Quran & Tajweed */}
            <div className="group relative">
              <div className="bg-white rounded-3xl shadow-xl p-8 h-full border border-primary-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div className="pt-8">
                  <h3 className="text-2xl font-bold text-primary-800 mb-4 text-center">
                    {isBengali ? 'কুরআন ও তাজবীদ' : 'Quran & Tajweed'}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed mb-6 text-center">
                    {isBengali 
                      ? 'হিফজ/নজিরাহ, তাজবীদ ও দৈনিক তিলাওয়াতের উন্নত কাঠামো'
                      : 'Advanced framework for Hifz/Nazirah, Tajweed and daily recitation'
                    }
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span>{isBengali ? 'কুরআন মুখস্থ' : 'Quran Memorization'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span>{isBengali ? 'সঠিক উচ্চারণ' : 'Proper Pronunciation'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span>{isBengali ? 'দৈনিক তিলাওয়াত' : 'Daily Recitation'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Arabic & Tarbiyah */}
            <div className="group relative">
              <div className="bg-white rounded-3xl shadow-xl p-8 h-full border border-secondary-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center shadow-lg">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div className="pt-8">
                  <h3 className="text-2xl font-bold text-secondary-800 mb-4 text-center">
                    {isBengali ? 'আরবী ও তারবিয়াহ' : 'Arabic & Tarbiyah'}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed mb-6 text-center">
                    {isBengali 
                      ? 'আরবী ভাষা, আকীদাহ, সীরাহ, আদব-আখলাক; চরিত্র গঠন'
                      : 'Arabic language, Aqeedah, Seerah, Adab-Akhlaq; Character building'
                    }
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                      <span>{isBengali ? 'আরবী ভাষা শিক্ষা' : 'Arabic Language Learning'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                      <span>{isBengali ? 'ইসলামী আকীদাহ' : 'Islamic Aqeedah'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                      <span>{isBengali ? 'চরিত্র গঠন' : 'Character Development'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* NCTB Academic */}
            <div className="group relative">
              <div className="bg-white rounded-3xl shadow-xl p-8 h-full border border-accent-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center shadow-lg">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div className="pt-8">
                  <h3 className="text-2xl font-bold text-accent-800 mb-4 text-center">
                    {isBengali ? 'NCTB একাডেমিক' : 'NCTB Academic'}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed mb-6 text-center">
                    {isBengali 
                      ? 'বাংলাদেশ জাতীয় শিক্ষাক্রমের সাথে একীভূত মানসম্পন্ন পাঠদান'
                      : 'Quality education integrated with Bangladesh National Curriculum'
                    }
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                      <span>{isBengali ? 'জাতীয় পাঠ্যক্রম' : 'National Curriculum'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                      <span>{isBengali ? 'মানসম্পন্ন শিক্ষা' : 'Quality Education'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                      <span>{isBengali ? 'আধুনিক পদ্ধতি' : 'Modern Methods'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Integration Approach */}
        <section className="mb-20">
          <div className="bg-gradient-to-r from-primary-50 via-white to-secondary-50 rounded-3xl p-8 md:p-12 border border-primary-100">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {isBengali ? 'সমন্বিত শিক্ষা পদ্ধতি' : 'Integrated Learning Approach'}
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                {isBengali 
                  ? 'আমাদের শিক্ষা পদ্ধতিতে ইসলামী শিক্ষা ও আধুনিক শিক্ষার সুন্দর সমন্বয় ঘটানো হয়েছে'
                  : 'Our educational approach beautifully integrates Islamic education with modern learning'
                }
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {isBengali ? 'সময়ের সঠিক ব্যবহার' : 'Optimal Time Management'}
                    </h3>
                    <p className="text-gray-600">
                      {isBengali 
                        ? 'ইসলামী ও আধুনিক শিক্ষার জন্য আলাদা সময় বরাদ্দের মাধ্যমে কার্যকর শিক্ষা'
                        : 'Effective learning through dedicated time allocation for both Islamic and modern education'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-secondary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {isBengali ? 'ব্যক্তিগত মনোযোগ' : 'Personal Attention'}
                    </h3>
                    <p className="text-gray-600">
                      {isBengali 
                        ? 'প্রতিটি শিক্ষার্থীর জন্য ব্যক্তিগত মনোযোগ ও গাইডেন্স'
                        : 'Personal attention and guidance for each student'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-accent-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {isBengali ? 'মূল্যবোধের শিক্ষা' : 'Values-Based Education'}
                    </h3>
                    <p className="text-gray-600">
                      {isBengali 
                        ? 'প্রতিটি বিষয়ে ইসলামী মূল্যবোধ ও নৈতিকতার শিক্ষা'
                        : 'Teaching Islamic values and ethics in every subject'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  {isBengali ? 'শিক্ষার ফলাফল' : 'Learning Outcomes'}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                    <span className="text-gray-700">{isBengali ? 'কুরআন ও হাদিসের গভীর জ্ঞান' : 'Deep knowledge of Quran and Hadith'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-secondary-500 rounded-full"></div>
                    <span className="text-gray-700">{isBengali ? 'আরবী ভাষায় দক্ষতা' : 'Proficiency in Arabic language'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-accent-500 rounded-full"></div>
                    <span className="text-gray-700">{isBengali ? 'আধুনিক শিক্ষায় পারদর্শিতা' : 'Excellence in modern education'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">{isBengali ? 'ইসলামী চরিত্র ও নৈতিকতা' : 'Islamic character and ethics'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-3xl p-8 md:p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {isBengali ? 'আমাদের সাথে যোগ দিন' : 'Join Our Community'}
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {isBengali 
                ? 'আপনার সন্তানের জন্য সেরা শিক্ষার সুযোগ তৈরি করুন'
                : 'Create the best educational opportunity for your child'
              }
            </p>
            <Link 
              href="/admissions" 
              className="group inline-flex items-center gap-3 bg-white text-primary-600 hover:bg-white/90 font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <span className="text-lg">
                {isBengali ? 'ভর্তির জন্য আবেদন করুন' : 'Apply for Admission'}
              </span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}


