'use client'

import { useLocale, useTranslations } from 'next-intl'
import { RichText } from '@/components/ui/rich-text'
import type { Page } from '@/types/sanity'
import type { Language } from '@/lib/sanity-utils'

interface SchoolHistoryVisionProps {
  historyContent?: Page
  visionContent?: Page
}

export function SchoolHistoryVision({ historyContent, visionContent }: SchoolHistoryVisionProps) {
  const locale = useLocale() as Language
  const t = useTranslations('about')

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        {/* School History Section */}
        <div className="mb-16">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              {t('history.title')}
            </h2>
            <div className="mx-auto h-1 w-24 bg-gradient-to-r from-primary-500 to-secondary-500"></div>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1">
              {historyContent?.content ? (
                <RichText
                  content={historyContent.content[locale]}
                  language={locale}
                  className="text-lg"
                />
              ) : (
                <div className={`text-lg leading-relaxed ${locale === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                  <p className="mb-6 text-gray-700">
                    {locale === 'bengali' 
                      ? 'মাদ্রাসাতুল কুরআন ১৯৮৫ সালে প্রতিষ্ঠিত হয়েছিল একটি মহৎ স্বপ্ন নিয়ে - ইসলামী শিক্ষার সাথে আধুনিক শিক্ষার সমন্বয় ঘটিয়ে একটি সুষম শিক্ষা ব্যবস্থা গড়ে তোলা।'
                      : 'Madrasatul Quran was founded in 1985 with a noble vision - to create a balanced education system that harmoniously combines Islamic teachings with modern academic excellence.'
                    }
                  </p>
                  <p className="mb-6 text-gray-700">
                    {locale === 'bengali'
                      ? 'আমাদের প্রতিষ্ঠাতারা বিশ্বাস করতেন যে, সত্যিকারের শিক্ষা হলো সেটি যা একজন শিক্ষার্থীর আত্মিক, নৈতিক এবং বুদ্ধিবৃত্তিক সকল দিকের বিকাশ ঘটায়।'
                      : 'Our founders believed that true education is one that develops all aspects of a student - spiritual, moral, and intellectual growth in perfect harmony.'
                    }
                  </p>
                  <p className="text-gray-700">
                    {locale === 'bengali'
                      ? 'আজ, চার দশকের অধিক সময় পর, আমরা গর্বিত যে হাজারো শিক্ষার্থী আমাদের প্রতিষ্ঠান থেকে শিক্ষা নিয়ে সমাজের বিভিন্ন ক্ষেত্রে অবদান রাখছেন।'
                      : 'Today, after more than four decades, we are proud that thousands of students have graduated from our institution and are contributing to various fields of society.'
                    }
                  </p>
                </div>
              )}
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden rounded-lg shadow-lg">
                  <img
                    src="/images/school-history.jpg"
                    alt={locale === 'bengali' ? 'স্কুলের ইতিহাস' : 'School History'}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwTDE2MCAyMDBIMjQwTDIwMCAxNTBaIiBmaWxsPSIjOUI5QjlCIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjEyMCIgcj0iMjAiIGZpbGw9IiM5QjlCOUIiLz4KPC9zdmc+'
                    }}
                  />
                </div>
                {/* Islamic geometric pattern overlay */}
                <div className="absolute -bottom-4 -right-4 h-24 w-24 opacity-20">
                  <div className="h-full w-full bg-gradient-to-br from-primary-500 to-secondary-500" 
                       style={{
                         clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
                       }}>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vision and Mission Section */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-8 md:p-12">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              {t('vision.title')}
            </h2>
            <div className="mx-auto h-1 w-24 bg-gradient-to-r from-primary-500 to-secondary-500"></div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Vision */}
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-500 text-white">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-4 text-xl font-semibold text-gray-900">
                {t('vision.subtitle')}
              </h3>
              {visionContent?.content ? (
                <RichText
                  content={visionContent.content[locale]}
                  language={locale}
                />
              ) : (
                <p className={`text-gray-700 ${locale === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                  {locale === 'bengali'
                    ? 'আমাদের দৃষ্টিভঙ্গি হলো এমন একটি প্রজন্ম গড়ে তোলা যারা ইসলামী মূল্যবোধে দৃঢ় এবং আধুনিক জ্ঞান-বিজ্ঞানে পারদর্শী।'
                    : 'Our vision is to nurture a generation that is firmly rooted in Islamic values while being proficient in modern knowledge and sciences.'
                  }
                </p>
              )}
            </div>

            {/* Mission */}
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-500 text-white">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-4 text-xl font-semibold text-gray-900">
                {t('mission.subtitle')}
              </h3>
              <p className={`text-gray-700 ${locale === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                {locale === 'bengali'
                  ? 'আমাদের লক্ষ্য হলো কুরআন ও সুন্নাহর আলোকে শিক্ষার্থীদের চরিত্র গঠন করা এবং জাতীয় শিক্ষাক্রমের মাধ্যমে তাদের বুদ্ধিবৃত্তিক বিকাশ নিশ্চিত করা।'
                  : 'Our mission is to build character in the light of Quran and Sunnah while ensuring intellectual development through the national curriculum.'
                }
              </p>
            </div>
          </div>

          {/* Quranic Verse */}
          <div className="mt-12 text-center">
            <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-md">
              <div className="mb-4 text-right font-arabic text-xl text-primary-700 leading-relaxed">
                وَقُل رَّبِّ زِدْنِي عِلْمًا
              </div>
              <p className={`text-sm text-gray-600 ${locale === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                {locale === 'bengali'
                  ? '"হে আমার রব! আমার জ্ঞান বৃদ্ধি করুন।" - সূরা ত্বহা: ১১৪'
                  : '"And say: My Lord, increase me in knowledge." - Surah Taha: 114'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}