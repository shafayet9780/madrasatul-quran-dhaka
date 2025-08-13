'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Clock, Star } from 'lucide-react';
import { type AcademicProgram } from '@/types/sanity';
import { type Locale } from '@/lib/i18n';

interface IslamicStudiesSectionProps {
  programs: AcademicProgram[];
  locale: Locale;
}

export default function IslamicStudiesSection({ programs, locale }: IslamicStudiesSectionProps) {
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  const toggleProgram = (programId: string) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedPrograms(newExpanded);
  };

  const toggleSubject = (subjectKey: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectKey)) {
      newExpanded.delete(subjectKey);
    } else {
      newExpanded.add(subjectKey);
    }
    setExpandedSubjects(newExpanded);
  };

  const getLocalizedText = (text: { bengali: string; english: string } | undefined) => {
    if (!text) return '';
    return locale === 'bengali' ? text.bengali : text.english;
  };

  return (
    <section id="islamic-studies" className="mb-20">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
          <BookOpen className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {locale === 'bengali' ? 'ইসলামী শিক্ষা পাঠ্যক্রম' : 'Islamic Studies Curriculum'}
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          {locale === 'bengali' 
            ? 'কুরআন, হাদিস, ফিকহ ও আরবি ভাষায় গভীর জ্ঞান অর্জনের মাধ্যমে ইসলামী চরিত্র গঠন'
            : 'Character building through deep knowledge of Quran, Hadith, Fiqh, and Arabic language'
          }
        </p>
      </div>

      <div className="grid gap-8">
        {programs.map((program) => {
          const isExpanded = expandedPrograms.has(program._id);
          const islamicSubjects = program.islamicCurriculum?.subjects || [];

          if (islamicSubjects.length === 0) return null;

          return (
            <div
              key={program._id}
              className="bg-white rounded-2xl shadow-lg border border-sand-medium overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Program Header */}
              <div
                className="p-6 bg-gradient-to-r from-primary-50 to-primary-100 cursor-pointer"
                onClick={() => toggleProgram(program._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-primary-800 mb-2">
                      {getLocalizedText(program.title)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-primary-600">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {program.ageRange}
                      </span>
                      {program.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {program.duration}
                        </span>
                      )}
                      <span className="bg-primary-200 px-3 py-1 rounded-full font-medium">
                        {islamicSubjects.length} {locale === 'bengali' ? 'বিষয়' : 'Subjects'}
                      </span>
                    </div>
                    {program.description && (
                      <p className="text-gray-700 mt-3 leading-relaxed">
                        {getLocalizedText(program.description)}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    {isExpanded ? (
                      <ChevronUp className="w-6 h-6 text-primary-600" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-primary-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expandable Content */}
              {isExpanded && (
                <div className="p-6 bg-white animate-slide-down">
                  <div className="grid gap-6">
                    {islamicSubjects.map((subject, index) => {
                      const subjectKey = `${program._id}-islamic-${index}`;
                      const isSubjectExpanded = expandedSubjects.has(subjectKey);
                      const subjectName = getLocalizedText(subject.name);
                      const subjectDescription = getLocalizedText(subject.description);

                      return (
                        <div
                          key={subjectKey}
                          className="border border-gray-200 rounded-xl overflow-hidden hover:border-primary-300 transition-colors"
                        >
                          {/* Subject Header */}
                          <div
                            className="p-4 bg-gray-50 cursor-pointer hover:bg-primary-50 transition-colors"
                            onClick={() => toggleSubject(subjectKey)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                  {subjectName}
                                </h4>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  {subject.hoursPerWeek && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {subject.hoursPerWeek} {locale === 'bengali' ? 'ঘন্টা/সপ্তাহ' : 'hrs/week'}
                                    </span>
                                  )}
                                  {/* Islamic Subject Visual Indicator */}
                                  <span className="text-primary-600 font-arabic text-sm">
                                    ☪
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                {isSubjectExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-gray-500" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-500" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Subject Details */}
                          {isSubjectExpanded && subjectDescription && (
                            <div className="p-4 bg-white border-t border-gray-100 animate-slide-down">
                              <div className="prose prose-sm max-w-none">
                                <p className="text-gray-700 leading-relaxed mb-4">
                                  {subjectDescription}
                                </p>
                                
                                {/* Arabic Text Rendering Example */}
                                {subjectName.toLowerCase().includes('quran') || subjectName.toLowerCase().includes('কুরআন') && (
                                  <div className="bg-primary-50 p-4 rounded-lg border-r-4 border-primary-400">
                                    <p className="text-right font-arabic text-lg text-primary-800 mb-2">
                                      بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                                    </p>
                                    <p className="text-sm text-primary-600">
                                      {locale === 'bengali' 
                                        ? 'পবিত্র কুরআনের শিক্ষা ও তেলাওয়াত'
                                        : 'Teaching and recitation of the Holy Quran'
                                      }
                                    </p>
                                  </div>
                                )}

                                {subjectName.toLowerCase().includes('hadith') || subjectName.toLowerCase().includes('হাদিস') && (
                                  <div className="bg-accent-50 p-4 rounded-lg border-r-4 border-accent-400">
                                    <p className="text-right font-arabic text-lg text-accent-800 mb-2">
                                      حَدَّثَنَا رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ
                                    </p>
                                    <p className="text-sm text-accent-600">
                                      {locale === 'bengali' 
                                        ? 'রাসূল (সা.) এর হাদিস ও সুন্নাহর শিক্ষা'
                                        : 'Teachings of Prophet Muhammad (PBUH) through Hadith and Sunnah'
                                      }
                                    </p>
                                  </div>
                                )}

                                {subjectName.toLowerCase().includes('fiqh') || subjectName.toLowerCase().includes('ফিকহ') && (
                                  <div className="bg-secondary-50 p-4 rounded-lg border-r-4 border-secondary-400">
                                    <p className="text-right font-arabic text-lg text-secondary-800 mb-2">
                                      الْفِقْهُ فِي الدِّينِ
                                    </p>
                                    <p className="text-sm text-secondary-600">
                                      {locale === 'bengali' 
                                        ? 'ইসলামী আইন ও জীবনবিধান'
                                        : 'Islamic jurisprudence and way of life'
                                      }
                                    </p>
                                  </div>
                                )}

                                {subjectName.toLowerCase().includes('arabic') || subjectName.toLowerCase().includes('আরবি') && (
                                  <div className="bg-green-50 p-4 rounded-lg border-r-4 border-green-400">
                                    <p className="text-right font-arabic text-lg text-green-800 mb-2">
                                      اللُّغَةُ الْعَرَبِيَّةُ
                                    </p>
                                    <p className="text-sm text-green-600">
                                      {locale === 'bengali' 
                                        ? 'আরবি ভাষা শিক্ষা ও ব্যাকরণ'
                                        : 'Arabic language learning and grammar'
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Program Prerequisites and Outcomes */}
                  {(program.prerequisites || program.outcomes) && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="grid md:grid-cols-2 gap-6">
                        {program.prerequisites && (
                          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                            <h5 className="font-semibold text-amber-800 mb-2">
                              {locale === 'bengali' ? 'পূর্বশর্ত' : 'Prerequisites'}
                            </h5>
                            <p className="text-amber-700 text-sm leading-relaxed">
                              {getLocalizedText(program.prerequisites)}
                            </p>
                          </div>
                        )}

                        {program.outcomes && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h5 className="font-semibold text-green-800 mb-2">
                              {locale === 'bengali' ? 'শিক্ষার ফলাফল' : 'Learning Outcomes'}
                            </h5>
                            <ul className="text-green-700 text-sm space-y-1">
                              {(locale === 'bengali' ? program.outcomes.bengali : program.outcomes.english).map((outcome, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-green-500 mt-1">•</span>
                                  <span>{outcome}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}