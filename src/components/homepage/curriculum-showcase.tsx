'use client';

import { useLocale } from 'next-intl';
import { BookOpen, Languages, Heart, Scale, MessageSquare, Clock } from 'lucide-react';

interface CurriculumSubject {
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

interface CurriculumShowcaseProps {
  data?: CurriculumSubject[];
}

export default function CurriculumShowcase({ data }: CurriculumShowcaseProps) {
  const locale = useLocale() as 'bengali' | 'english';
  const isBengali = locale === 'bengali';

  // Fallback data if CMS data is not available
  const fallbackData: CurriculumSubject[] = [
    {
      icon: 'quran',
      title: {
        bengali: 'কুরআন',
        english: 'Quran'
      },
      description: {
        bengali: 'সামর্থ্য অনুযায়ী হিফজ ও কুরআন তর্জমা',
        english: 'Hifz (memorization) and Quranic translation according to ability'
      }
    },
    {
      icon: 'arabic',
      title: {
        bengali: 'আরবী ভাষা',
        english: 'Arabic Language'
      },
      description: {
        bengali: 'আরবী বলতে পারা, শুনে বুঝতে পারা, ইবারাত পড়তে পারা ও লিখতে পারা',
        english: 'Ability to speak, understand by listening, read Ibaarat (Arabic text without diacritics), and write Arabic'
      }
    },
    {
      icon: 'aqidah',
      title: {
        bengali: 'আকিদাহ',
        english: 'Aqidah (Islamic Creed)'
      },
      description: {
        bengali: 'ইমান ও আকিদার বিষয়াবলি ও ইসলামিক মূল্যবোধ',
        english: 'Matters of faith and creed, and Islamic values'
      }
    },
    {
      icon: 'fiqh',
      title: {
        bengali: 'ফিকহ',
        english: 'Fiqh (Islamic Jurisprudence)'
      },
      description: {
        bengali: 'বেসিক মাসাইল, আদাব-তারবিয়া ও মাসনুন দোয়া',
        english: 'Basic Masa\'il (rulings), Adab-Tarbiyah (manners and upbringing), and Masnoon Duas (prophetic supplications)'
      }
    },
    {
      icon: 'hadith',
      title: {
        bengali: 'হাদিস',
        english: 'Hadith'
      },
      description: {
        bengali: 'নবম শ্রেণীর মধ্যে বিষয়ভিত্তিক ৩০০+ হাদিস মুখস্থ করা',
        english: 'Memorizing 300+ subject-wise Hadith by 9th grade'
      }
    },
    {
      icon: 'history',
      title: {
        bengali: 'ইতিহাস',
        english: 'History'
      },
      description: {
        bengali: 'নবীদের ইতিহাস, কুরআনের বিভিন্ন ইতিহাস, খলিফাদের ইতিহাস ও পরবর্তী ইতিহাস',
        english: 'History of Prophets, various histories from the Quran, history of Caliphs, and subsequent history'
      }
    }
  ];

  const curriculumData = data || fallbackData;

  const getIcon = (iconName: string) => {
    const iconProps = { className: 'w-5 h-5' };
    
    switch (iconName) {
      case 'quran':
        return <BookOpen {...iconProps} />;
      case 'arabic':
        return <Languages {...iconProps} />;
      case 'aqidah':
        return <Heart {...iconProps} />;
      case 'fiqh':
        return <Scale {...iconProps} />;
      case 'hadith':
        return <MessageSquare {...iconProps} />;
      case 'history':
        return <Clock {...iconProps} />;
      default:
        return <BookOpen {...iconProps} />;
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {isBengali ? 'আমাদের কারিকুলাম' : 'Our Curriculum'}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            {isBengali 
              ? 'বাংলা মিডিয়াম NCTB (দাখিল/এস.এস.সি) এর সাথে নিজস্ব ইসলামী শিক্ষার কারিকুলাম'
              : 'Own Islamic education curriculum integrated with Bengali Medium NCTB (Dakhil/SSC)'
            }
          </p>
        </div>

        {/* Curriculum Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
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
                  <Languages className="w-8 h-8 text-white" />
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
                  <Scale className="w-8 h-8 text-white" />
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

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            {isBengali 
              ? 'সম্পূর্ণ কারিকুলাম এবং ১০ বছরের পাঠ পরিকল্পনা দেখুন'
              : 'View our complete curriculum and 10-year study plan'
            }
          </p>
          <a 
            href="/curriculum"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-300"
          >
            <BookOpen className="w-5 h-5" />
            <span>
              {isBengali ? 'সম্পূর্ণ কারিকুলাম দেখুন' : 'View Full Curriculum'}
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
