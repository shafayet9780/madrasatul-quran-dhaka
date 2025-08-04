'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import { getLocalizedText, getLocalizedArray } from '@/lib/sanity-utils'
import type { StaffMember } from '@/types/sanity'
import type { Language } from '@/lib/sanity-utils'

interface LeadershipTeamProps {
  leaders: StaffMember[]
}

interface LeadershipModalProps {
  leader: StaffMember
  isOpen: boolean
  onClose: () => void
  language: Language
}

function LeadershipModal({ leader, isOpen, onClose, language }: LeadershipModalProps) {
  const t = useTranslations('about.leadership')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
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
          {/* Header with photo and basic info */}
          <div className="mb-6 flex flex-col items-center text-center sm:flex-row sm:text-left">
            <div className="mb-4 sm:mb-0 sm:mr-6">
              {leader.photo ? (
                <div className="relative h-32 w-32 overflow-hidden rounded-full">
                  <Image
                    src={urlFor(leader.photo).width(200).height(200).url()}
                    alt={getLocalizedText(leader.name, language)}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-200">
                  <svg className="h-16 w-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className={`mb-2 text-2xl font-bold text-gray-900 ${language === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                {getLocalizedText(leader.name, language)}
              </h3>
              <p className={`mb-2 text-lg text-primary-600 ${language === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                {getLocalizedText(leader.position, language)}
              </p>
              {leader.yearsOfExperience && (
                <p className={`text-sm text-gray-600 ${language === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                  {leader.yearsOfExperience} {t('experience')}
                </p>
              )}
            </div>
          </div>

          {/* Biography */}
          {leader.biography && getLocalizedText(leader.biography, language) && (
            <div className="mb-6">
              <h4 className={`mb-3 text-lg font-semibold text-gray-900 ${language === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                {t('biography')}
              </h4>
              <p className={`leading-relaxed text-gray-700 ${language === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                {getLocalizedText(leader.biography, language)}
              </p>
            </div>
          )}

          {/* Qualifications */}
          {leader.qualifications && getLocalizedArray(leader.qualifications, language).length > 0 && (
            <div className="mb-6">
              <h4 className={`mb-3 text-lg font-semibold text-gray-900 ${language === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                {t('qualifications')}
              </h4>
              <ul className="space-y-2">
                {getLocalizedArray(leader.qualifications, language).map((qualification, index) => (
                  <li key={index} className={`flex items-start text-gray-700 ${language === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                    <span className="mr-2 mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500"></span>
                    {qualification}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Education */}
          {leader.education && leader.education.length > 0 && (
            <div className="mb-6">
              <h4 className={`mb-3 text-lg font-semibold text-gray-900 ${language === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                {t('education')}
              </h4>
              <div className="space-y-3">
                {leader.education.map((edu, index) => (
                  <div key={index} className="rounded-lg bg-gray-50 p-3">
                    {edu.degree && (
                      <p className={`font-medium text-gray-900 ${language === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                        {getLocalizedText(edu.degree, language)}
                      </p>
                    )}
                    {edu.institution && (
                      <p className={`text-sm text-gray-600 ${language === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                        {getLocalizedText(edu.institution, language)}
                      </p>
                    )}
                    {edu.year && (
                      <p className="text-sm text-gray-500">{edu.year}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specializations */}
          {leader.specializations && leader.specializations.length > 0 && (
            <div>
              <h4 className={`mb-3 text-lg font-semibold text-gray-900 ${language === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                {t('specializations')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {leader.specializations.map((specialization, index) => (
                  <span
                    key={index}
                    className={`rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-700 ${language === 'bengali' ? 'font-bengali' : 'font-english'}`}
                  >
                    {specialization}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function LeadershipTeam({ leaders }: LeadershipTeamProps) {
  const locale = useLocale() as Language
  const t = useTranslations('about.leadership')
  const [selectedLeader, setSelectedLeader] = useState<StaffMember | null>(null)

  const departmentOrder = {
    administration: 1,
    islamic_studies: 2,
    nctb_curriculum: 3,
    co_curricular: 4,
    support_staff: 5,
  }

  const sortedLeaders = [...leaders].sort((a, b) => {
    // First sort by department priority
    const deptA = departmentOrder[a.department as keyof typeof departmentOrder] || 999
    const deptB = departmentOrder[b.department as keyof typeof departmentOrder] || 999
    if (deptA !== deptB) return deptA - deptB
    
    // Then by display order
    return a.displayOrder - b.displayOrder
  })

  const getDepartmentTitle = (department: string) => {
    const titles = {
      administration: locale === 'bengali' ? 'প্রশাসন' : 'Administration',
      islamic_studies: locale === 'bengali' ? 'ইসলামী শিক্ষা' : 'Islamic Studies',
      nctb_curriculum: locale === 'bengali' ? 'এনসিটিবি পাঠ্যক্রম' : 'NCTB Curriculum',
      co_curricular: locale === 'bengali' ? 'সহ-পাঠক্রমিক' : 'Co-curricular',
      support_staff: locale === 'bengali' ? 'সহায়ক কর্মী' : 'Support Staff',
    }
    return titles[department as keyof typeof titles] || department
  }

  // Group leaders by department
  const leadersByDepartment = sortedLeaders.reduce((acc, leader) => {
    if (!acc[leader.department]) {
      acc[leader.department] = []
    }
    acc[leader.department].push(leader)
    return acc
  }, {} as Record<string, StaffMember[]>)

  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
            {t('title')}
          </h2>
          <div className="mx-auto h-1 w-24 bg-gradient-to-r from-primary-500 to-secondary-500"></div>
        </div>

        {Object.entries(leadersByDepartment).map(([department, departmentLeaders]) => (
          <div key={department} className="mb-12">
            <h3 className={`mb-8 text-center text-2xl font-semibold text-gray-800 ${locale === 'bengali' ? 'font-bengali' : 'font-english'}`}>
              {getDepartmentTitle(department)}
            </h3>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {departmentLeaders.map((leader) => (
                <div
                  key={leader._id}
                  className="group cursor-pointer rounded-lg bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  onClick={() => setSelectedLeader(leader)}
                >
                  {/* Photo */}
                  <div className="mb-4 flex justify-center">
                    {leader.photo ? (
                      <div className="relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-primary-100 transition-all duration-300 group-hover:ring-primary-200">
                        <Image
                          src={urlFor(leader.photo).width(150).height(150).url()}
                          alt={getLocalizedText(leader.name, locale)}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 ring-4 ring-primary-100">
                        <svg className="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Name and Position */}
                  <div className="text-center">
                    <h4 className={`mb-2 text-lg font-semibold text-gray-900 ${locale === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                      {getLocalizedText(leader.name, locale)}
                    </h4>
                    <p className={`mb-3 text-sm text-primary-600 ${locale === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                      {getLocalizedText(leader.position, locale)}
                    </p>
                    
                    {/* Experience */}
                    {leader.yearsOfExperience && (
                      <p className={`mb-3 text-xs text-gray-500 ${locale === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                        {leader.yearsOfExperience} {t('experience')}
                      </p>
                    )}

                    {/* View Profile Button */}
                    <button className={`text-sm text-primary-600 hover:text-primary-700 ${locale === 'bengali' ? 'font-bengali' : 'font-english'}`}>
                      {t('viewProfile')} →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Modal */}
        {selectedLeader && (
          <LeadershipModal
            leader={selectedLeader}
            isOpen={!!selectedLeader}
            onClose={() => setSelectedLeader(null)}
            language={locale}
          />
        )}
      </div>
    </section>
  )
}