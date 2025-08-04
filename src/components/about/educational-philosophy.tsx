'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { RichText } from '@/components/ui/rich-text'
import type { Page } from '@/types/sanity'
import type { Language } from '@/lib/sanity-utils'

interface EducationalPhilosophyProps {
  philosophyContent?: Page
  accreditationContent?: Page
}

interface Certificate {
  title: string
  image: string
  description: string
  issuer: string
  year?: string
}

interface CertificateModalProps {
  certificate: Certificate
  isOpen: boolean
  onClose: () => void
  language: Language
}

function CertificateModal({ certificate, isOpen, onClose, language }: CertificateModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <div className="mb-4 text-center">
            <h3 className={`text-2xl font-bold text-gray-900 ${language === 'bengali' ? 'font-bengali' : 'font-english'}`}>
              {certificate.title}
            </h3>
            {certificate.issuer && (
              <p className={`text-gray-600 ${language === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                {certificate.issuer}
                {certificate.year && ` - ${certificate.year}`}
              </p>
            )}
          </div>
          
          <div className="mb-4 flex justify-center">
            <div className="relative max-w-2xl">
              <img
                src={certificate.image}
                alt={certificate.title}
                className="h-auto w-full rounded-lg shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwTDE2MCAyMDBIMjQwTDIwMCAxNTBaIiBmaWxsPSIjOUI5QjlCIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjEyMCIgcj0iMjAiIGZpbGw9IiM5QjlCOUIiLz4KPC9zdmc+'
                }}
              />
            </div>
          </div>
          
          {certificate.description && (
            <p className={`text-center text-gray-700 ${language === 'bengali' ? 'font-bengali' : 'font-english'}`}>
              {certificate.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function EducationalPhilosophy({ philosophyContent }: EducationalPhilosophyProps) {
  const locale = useLocale() as Language
  const t = useTranslations('about.philosophy')
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)

  // Mock certificates data - in real implementation, this would come from Sanity CMS
  const certificates = [
    {
      title: locale === 'bengali' ? 'শিক্ষা মন্ত্রণালয়ের অনুমোদন' : 'Ministry of Education Approval',
      image: '/images/certificates/ministry-approval.jpg',
      description: locale === 'bengali' 
        ? 'বাংলাদেশ সরকারের শিক্ষা মন্ত্রণালয় কর্তৃক প্রদত্ত অনুমোদনপত্র'
        : 'Approval certificate issued by the Ministry of Education, Government of Bangladesh',
      issuer: locale === 'bengali' ? 'শিক্ষা মন্ত্রণালয়, বাংলাদেশ সরকার' : 'Ministry of Education, Government of Bangladesh',
      year: '2020'
    },
    {
      title: locale === 'bengali' ? 'মাদ্রাসা শিক্ষা বোর্ড স্বীকৃতি' : 'Madrasah Education Board Recognition',
      image: '/images/certificates/madrasah-board.jpg',
      description: locale === 'bengali'
        ? 'বাংলাদেশ মাদ্রাসা শিক্ষা বোর্ড কর্তৃক প্রদত্ত স্বীকৃতিপত্র'
        : 'Recognition certificate from Bangladesh Madrasah Education Board',
      issuer: locale === 'bengali' ? 'বাংলাদেশ মাদ্রাসা শিক্ষা বোর্ড' : 'Bangladesh Madrasah Education Board',
      year: '2018'
    },
    {
      title: locale === 'bengali' ? 'এনসিটিবি পাঠ্যক্রম অনুমোদন' : 'NCTB Curriculum Approval',
      image: '/images/certificates/nctb-approval.jpg',
      description: locale === 'bengali'
        ? 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড কর্তৃক পাঠ্যক্রম অনুমোদন'
        : 'Curriculum approval from National Curriculum and Textbook Board',
      issuer: locale === 'bengali' ? 'এনসিটিবি' : 'NCTB',
      year: '2019'
    }
  ]

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
            {t('title')}
          </h2>
          <div className="mx-auto h-1 w-24 bg-gradient-to-r from-primary-500 to-secondary-500"></div>
        </div>

        {/* Educational Philosophy */}
        <div className="mb-16">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h3 className="mb-6 text-2xl font-semibold text-gray-900">
                {t('islamicIntegration')}
              </h3>
              
              {philosophyContent?.content ? (
                <RichText
                  content={philosophyContent.content[locale]}
                  language={locale}
                />
              ) : (
                <div className={`space-y-4 ${locale === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                  <p className="text-gray-700 leading-relaxed">
                    {locale === 'bengali'
                      ? 'আমাদের শিক্ষা ব্যবস্থায় ইসলামী শিক্ষা ও আধুনিক শিক্ষার মধ্যে একটি নিখুঁত সমন্বয় রয়েছে। আমরা বিশ্বাস করি যে, কুরআন ও সুন্নাহর আলোকে শিক্ষার্থীদের নৈতিক ও আধ্যাত্মিক উন্নয়নের পাশাপাশি আধুনিক বিজ্ঞান ও প্রযুক্তিতে দক্ষতা অর্জন করা প্রয়োজন।'
                      : 'Our educational system features a perfect integration of Islamic education with modern academic excellence. We believe that students need both moral and spiritual development through Quran and Sunnah, alongside proficiency in modern science and technology.'
                    }
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    {locale === 'bengali'
                      ? 'প্রতিদিনের পাঠ্যক্রমে কুরআন তিলাওয়াত, হাদীস অধ্যয়ন, ইসলামী ইতিহাস ও ফিকহ শিক্ষার পাশাপাশি গণিত, বিজ্ঞান, ভাষা ও সামাজিক বিজ্ঞানের পাঠদান করা হয়।'
                      : 'Daily curriculum includes Quran recitation, Hadith studies, Islamic history and Fiqh alongside mathematics, science, languages, and social sciences.'
                    }
                  </p>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden rounded-lg shadow-lg">
                <img
                  src="/images/islamic-education.jpg"
                  alt={locale === 'bengali' ? 'ইসলামী শিক্ষা' : 'Islamic Education'}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwTDE2MCAyMDBIMjQwTDIwMCAxNTBaIiBmaWxsPSIjOUI5QjlCIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjEyMCIgcj0iMjAiIGZpbGw9IiM5QjlCOUIiLz4KPC9zdmc+'
                  }}
                />
              </div>
              {/* Decorative element */}
              <div className="absolute -top-4 -left-4 h-16 w-16 opacity-20">
                <div className="h-full w-full rounded-full bg-gradient-to-br from-primary-500 to-secondary-500"></div>
              </div>
            </div>
          </div>
        </div>

        {/* NCTB Curriculum Integration */}
        <div className="mb-16">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1">
              <div className="aspect-[4/3] overflow-hidden rounded-lg shadow-lg">
                <img
                  src="/images/modern-education.jpg"
                  alt={locale === 'bengali' ? 'আধুনিক শিক্ষা' : 'Modern Education'}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwTDE2MCAyMDBIMjQwTDIwMCAxNTBaIiBmaWxsPSIjOUI5QjlCIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjEyMCIgcj0iMjAiIGZpbGw9IiM5QjlCOUIiLz4KPC9zdmc+'
                  }}
                />
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h3 className="mb-6 text-2xl font-semibold text-gray-900">
                {t('nctbCurriculum')}
              </h3>
              
              <div className={`space-y-4 ${locale === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                <p className="text-gray-700 leading-relaxed">
                  {locale === 'bengali'
                    ? 'আমাদের প্রতিষ্ঠানে জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (এনসিটিবি) কর্তৃক নির্ধারিত সম্পূর্ণ পাঠ্যক্রম অনুসরণ করা হয়। প্রাথমিক থেকে মাধ্যমিক স্তর পর্যন্ত সকল বিষয়ে পূর্ণাঙ্গ শিক্ষা প্রদান করা হয়।'
                    : 'Our institution follows the complete curriculum prescribed by the National Curriculum and Textbook Board (NCTB). We provide comprehensive education in all subjects from primary to secondary levels.'
                  }
                </p>
                <p className="text-gray-700 leading-relaxed">
                  {locale === 'bengali'
                    ? 'বাংলা, ইংরেজি, গণিত, বিজ্ঞান, সামাজিক বিজ্ঞান, তথ্য ও যোগাযোগ প্রযুক্তি সহ সকল বিষয়ে অভিজ্ঞ শিক্ষকমণ্ডলী দ্বারা পাঠদান করা হয়।'
                    : 'All subjects including Bengali, English, Mathematics, Science, Social Science, and Information & Communication Technology are taught by experienced faculty members.'
                  }
                </p>
                
                {/* Subject highlights */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {[
                    { bengali: 'বাংলা ভাষা ও সাহিত্য', english: 'Bengali Language & Literature' },
                    { bengali: 'ইংরেজি ভাষা', english: 'English Language' },
                    { bengali: 'গণিত ও বিজ্ঞান', english: 'Mathematics & Science' },
                    { bengali: 'তথ্য প্রযুক্তি', english: 'Information Technology' }
                  ].map((subject, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-secondary-500"></div>
                      <span className="text-sm text-gray-600">
                        {locale === 'bengali' ? subject.bengali : subject.english}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Accreditation and Certificates */}
        <div className="rounded-xl bg-gradient-to-r from-gray-50 to-primary-50 p-8 md:p-12">
          <div className="mb-8 text-center">
            <h3 className="mb-4 text-2xl font-semibold text-gray-900">
              {t('accreditation')}
            </h3>
            <p className={`mx-auto max-w-2xl text-gray-600 ${locale === 'bengali' ? 'font-bengali' : 'font-english'}`}>
              {locale === 'bengali'
                ? 'আমাদের প্রতিষ্ঠান সরকারি ও বেসরকারি বিভিন্ন শিক্ষা বোর্ড কর্তৃক স্বীকৃত এবং অনুমোদিত।'
                : 'Our institution is recognized and approved by various government and private education boards.'
              }
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {certificates.map((certificate, index) => (
              <div
                key={index}
                className="group cursor-pointer rounded-lg bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                onClick={() => setSelectedCertificate(certificate)}
              >
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600 group-hover:bg-primary-200">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                </div>
                
                <h4 className={`mb-2 text-center text-lg font-semibold text-gray-900 ${locale === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                  {certificate.title}
                </h4>
                
                <p className={`mb-3 text-center text-sm text-gray-600 ${locale === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                  {certificate.issuer}
                </p>
                
                {certificate.year && (
                  <p className="text-center text-xs text-gray-500">
                    {certificate.year}
                  </p>
                )}
                
                <div className="mt-4 text-center">
                  <span className={`text-sm text-primary-600 group-hover:text-primary-700 ${locale === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                    {locale === 'bengali' ? 'সার্টিফিকেট দেখুন' : 'View Certificate'} →
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-12 text-center">
            <div className="flex flex-wrap justify-center gap-8">
              {[
                { bengali: '৪০+ বছরের অভিজ্ঞতা', english: '40+ Years Experience' },
                { bengali: 'সরকারি স্বীকৃতি', english: 'Government Recognition' },
                { bengali: '১০০% পাস রেট', english: '100% Pass Rate' },
                { bengali: 'আন্তর্জাতিক মান', english: 'International Standards' }
              ].map((indicator, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className={`text-sm font-medium text-gray-700 ${locale === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                    {locale === 'bengali' ? indicator.bengali : indicator.english}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Certificate Modal */}
        {selectedCertificate && (
          <CertificateModal
            certificate={selectedCertificate}
            isOpen={!!selectedCertificate}
            onClose={() => setSelectedCertificate(null)}
            language={locale}
          />
        )}
      </div>
    </section>
  )
}