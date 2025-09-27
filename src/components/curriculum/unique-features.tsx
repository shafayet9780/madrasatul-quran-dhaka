'use client';

import { useLocale } from 'next-intl';
import { CheckCircle, BookOpen, Languages, GraduationCap, Bus, Heart, History, Users, HelpCircle } from 'lucide-react';

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

interface UniqueFeaturesProps {
  data?: UniqueFeature[];
}

export default function UniqueFeatures({ data }: UniqueFeaturesProps) {
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
      icon: 'higher-education',
      title: {
        bengali: 'উচ্চ শিক্ষার সুযোগ',
        english: 'Higher Education Pathway'
      },
      description: {
        bengali: '৮ম শ্রেণির পর এসএসসি/দাখিল/মাদ্রাসা শিক্ষার সুযোগ',
        english: 'Opportunity for SSC/Dakhil/Madrasa education after 8th grade'
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
    },
    {
      icon: 'transport',
      title: {
        bengali: 'নিজস্ব পরিবহন',
        english: 'Own Transportation'
      },
      description: {
        bengali: 'নিজস্ব পরিবহন ব্যবস্থা রয়েছে',
        english: 'Own transportation system is available'
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
      icon: 'ethics',
      title: {
        bengali: 'নৈতিকতা ও আদব',
        english: 'Ethics and Manners'
      },
      description: {
        bengali: 'ইসলামী নৈতিকতা ও আদব শিক্ষায় সর্বোচ্চ গুরুত্ব',
        english: 'Utmost importance is given to Islamic ethics and manners education'
      }
    },
    {
      icon: 'history',
      title: {
        bengali: 'ইসলামী ইতিহাস',
        english: 'Islamic History'
      },
      description: {
        bengali: 'ইসলামী ইতিহাস ও সীরাত শিক্ষায় গুরুত্ব',
        english: 'Emphasis on Islamic history and Seerah (biography of the Prophet)'
      }
    },
    {
      icon: 'recreation',
      title: {
        bengali: 'বিনোদনের সুযোগ',
        english: 'Recreational Facilities'
      },
      description: {
        bengali: 'ছেলেদের ক্যাম্পাস সংলগ্ন মাঠে এবং মেয়েদের ছাদ বাগানে খেলার সুযোগ',
        english: 'Opportunity for boys to play in the campus-adjacent field and for girls to play in the rooftop garden'
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
    <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl shadow-2xl border border-gray-100 p-10 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-accent-500 rounded-full blur-3xl"></div>
      </div>

      {/* Enhanced Header */}
      <div className="text-center mb-12 relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-300 to-primary-400 rounded-full mb-6 shadow-lg">
          <HelpCircle className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-primary-400 mb-6">
          {isBengali ? 'কেন মাদরাসাতুল কুরআন?' : 'Why Madrasatul Quran?'}
        </h2>
        <div className="max-w-4xl mx-auto">
          <p className="text-base text-gray-600 leading-relaxed">
            {isBengali 
              ? 'অনেক ভালো ইসলামী স্কুল থাকা সত্ত্বেও মাদরাসাতুল কুরআন প্রতিষ্ঠার কারণ হলো, আমরা এমন বাংলা মিডিয়াম স্কুল খুঁজে পাইনি যেখানে আরবি ও ইসলামী শিক্ষার সাথে সাধারণ শিক্ষার সমান গুরুত্ব দেওয়া হয়।'
              : 'Despite the availability of many good Islamic schools, Madrasatul Quran was established because we could not find a Bengali medium school that equally emphasizes Arabic and Islamic education alongside general education.'
            }
          </p>
        </div>
      </div>

      {/* Enhanced Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10 items-stretch">
        {featuresData.map((feature, index) => (
          <div 
            key={index}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2"></div>
            <div className="relative p-8 rounded-2xl border border-gray-200 group-hover:border-primary-300 transition-all duration-300 bg-white/80 backdrop-blur-sm h-full flex flex-col min-h-[160px]">
              <div className="flex items-start space-x-5">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-primary-300 to-primary-400 rounded-xl flex items-center justify-center text-white group-hover:from-primary-400 group-hover:to-primary-500 transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:scale-110">
                  {getIcon(feature.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-500 transition-colors duration-300">
                    {isBengali ? feature.title.bengali : feature.title.english}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {isBengali ? feature.description.bengali : feature.description.english}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Footer Note */}
      <div className="mt-12 p-8 bg-gradient-to-r from-primary-50 via-white to-secondary-50 rounded-2xl border-2 border-primary-200 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-400 rounded-full mb-4">
            <span className="text-white font-bold">✓</span>
          </div>
          <p className="text-base text-gray-700 font-medium">
            {isBengali 
              ? 'উপরের বিষয়গুলো আমাদের স্কুলের স্বতন্ত্র বৈশিষ্ট্য হিসেবে বিবেচিত।'
              : 'The above points are considered unique characteristics of our school.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
