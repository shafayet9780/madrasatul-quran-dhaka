'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import { CheckCircle, BookOpen, Languages, GraduationCap, Bus, Heart, History, Users, HelpCircle } from 'lucide-react';
import CurriculumDownload from '@/components/ui/curriculum-download';

interface UniqueFeature {
  icon: string;
  title: {
    bengali: string;
    english: string;
  };
  description: {
    bengali: string;
    english: string;
  };
}

interface UniqueFeaturesShowcaseProps {
  data?: UniqueFeature[];
}

export default function UniqueFeaturesShowcase({ data }: UniqueFeaturesShowcaseProps) {
  const locale = useLocale() as 'bengali' | 'english';
  const isBengali = locale === 'bengali';

  // Fallback data if CMS data is not available
  const fallbackData: UniqueFeature[] = [
    {
      icon: 'integration',
      title: {
        bengali: 'আদর্শ সমন্বয়',
        english: 'Ideal Integration'
      },
      description: {
        bengali: 'আরবি ভাষা ও ইসলামী শিক্ষার সাথে সাধারণ শিক্ষার আদর্শ সমন্বয়',
        english: 'Ideal integration of Arabic language and Islamic education with general education'
      }
    },
    {
      icon: 'languages',
      title: {
        bengali: 'ভাষার চারটি দক্ষতা',
        english: 'Four Language Skills'
      },
      description: {
        bengali: 'ইংরেজি ও আরবি উভয় ভাষায় শোনা, বলা, পড়া ও লেখার দক্ষতা অর্জন',
        english: 'Acquisition of four basic language skills (listening, speaking, reading, and writing) in both English and Arabic'
      }
    },
    {
      icon: 'arabic-medium',
      title: {
        bengali: 'আরবি মিডিয়াম ইসলামী শিক্ষা',
        english: 'Arabic Medium Islamic Studies'
      },
      description: {
        bengali: '৬ষ্ঠ শ্রেণি থেকে আরবি মিডিয়ামে ইসলামী শিক্ষা প্রদান',
        english: 'Islamic studies are taught in Arabic from the 6th grade onwards'
      }
    },
    {
      icon: 'hadith',
      title: {
        bengali: 'হাদিস মুখস্থ',
        english: 'Hadith Memorization'
      },
      description: {
        bengali: '৯ম শ্রেণির মধ্যে ৩০০+ হাদিস মুখস্থ করা',
        english: 'Memorizing 300+ Hadith (prophetic traditions) by 9th grade'
      }
    },
    {
      icon: 'translation',
      title: {
        bengali: 'কুরআন তর্জমা দক্ষতা',
        english: 'Quranic Translation Proficiency'
      },
      description: {
        bengali: 'এসএসসি/দাখিল পর্যায়ে ৯০%+ কুরআন তর্জমা দক্ষতা অর্জন',
        english: 'Achieving 90%+ Quranic translation proficiency at SSC/Dakhil level'
      }
    },
    {
      icon: 'hifz',
      title: {
        bengali: 'ডে-কেয়ার হিফজ',
        english: 'Day-care Hifz'
      },
      description: {
        bengali: 'ডে-কেয়ার হিফজ (কুরআন মুখস্থ) প্রোগ্রামের ব্যবস্থা',
        english: 'Provision for a Day-care Hifz (Quran memorization) program'
      }
    }
  ];

  const featuresData = data || fallbackData;

  const getIcon = (iconName: string) => {
    const iconProps = { className: 'w-6 h-6' };
    
    switch (iconName) {
      case 'integration':
        return <CheckCircle {...iconProps} />;
      case 'languages':
        return <Languages {...iconProps} />;
      case 'arabic-medium':
        return <BookOpen {...iconProps} />;
      case 'higher-education':
        return <GraduationCap {...iconProps} />;
      case 'hifz':
        return <BookOpen {...iconProps} />;
      case 'transport':
        return <Bus {...iconProps} />;
      case 'hadith':
        return <BookOpen {...iconProps} />;
      case 'translation':
        return <Languages {...iconProps} />;
      case 'ethics':
        return <Heart {...iconProps} />;
      case 'history':
        return <History {...iconProps} />;
      case 'recreation':
        return <Users {...iconProps} />;
      default:
        return <CheckCircle {...iconProps} />;
    }
  };

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-white via-gray-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-40 h-40 bg-primary-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-secondary-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-accent-500 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-300 to-primary-400 rounded-full mb-6 shadow-lg">
          <HelpCircle className="w-8 h-8 text-white" />
        </div>
          <h2 className="text-4xl md:text-5xl font-bold text-primary-400 mb-6">
            {isBengali ? 'কেন মাদরাসাতুল কুরআন?' : 'Why Madrasatul Quran?'}
          </h2>
          <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
            {isBengali 
              ? 'আমাদের স্কুলের স্বতন্ত্র বৈশিষ্ট্যগুলো যা আমাদেরকে অন্যান্য শিক্ষা প্রতিষ্ঠান থেকে আলাদা করে তোলে'
              : 'The unique characteristics of our school that set us apart from other educational institutions'
            }
          </p>
        </div>

        {/* Enhanced Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 items-stretch">
          {featuresData.map((feature, index) => (
            <div
              key={index}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2"></div>
              <div className="relative p-8 rounded-2xl border border-gray-200 group-hover:border-primary-300 transition-all duration-300 bg-white/80 backdrop-blur-sm h-full flex flex-col min-h-[160px]">
                <div className="flex items-start space-x-5 flex-1">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-primary-300 to-primary-400 rounded-xl flex items-center justify-center text-white group-hover:from-primary-600 group-hover:to-primary-700 transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:scale-110">
                    {getIcon(feature.icon)}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-500 transition-colors duration-300">
                      {isBengali ? feature.title.bengali : feature.title.english}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed flex-1">
                      {isBengali ? feature.description.bengali : feature.description.english}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Call to Action */}
        <div className="text-center">
          <div className="bg-secondary-50 rounded-2xl p-8 border-2 border-primary-200 shadow-lg">
            <p className="text-gray-700 mb-6 text-lg">
              {isBengali 
                ? 'আরও জানতে আমাদের কারিকুলাম পেজ দেখুন অথবা বিস্তারিত কারিকুলাম ডাউনলোড করুন'
                : 'Learn more about our comprehensive curriculum or download the detailed curriculum'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/curriculum"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <BookOpen className="w-6 h-6" />
                <span className="text-lg">
                  {isBengali ? 'কারিকুলাম দেখুন' : 'View Curriculum'}
                </span>
              </Link>
              
              <CurriculumDownload 
                locale={locale} 
                variant="outline"
                size="lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
