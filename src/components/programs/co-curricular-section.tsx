'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Trophy, Users, Filter } from 'lucide-react';
import { type AcademicProgram } from '@/types/sanity';
import { type Locale } from '@/lib/i18n';

interface CoCurricularSectionProps {
  programs: AcademicProgram[];
  locale: Locale;
}

export default function CoCurricularSection({ programs, locale }: CoCurricularSectionProps) {
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleProgram = (programId: string) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedPrograms(newExpanded);
  };

  const getLocalizedText = (text: { bengali: string; english: string } | undefined) => {
    if (!text) return '';
    return locale === 'bengali' ? text.bengali : text.english;
  };

  const categoryLabels = {
    all: locale === 'bengali' ? 'সকল কার্যক্রম' : 'All Activities',
    islamic_competition: locale === 'bengali' ? 'ইসলামী প্রতিযোগিতা' : 'Islamic Competitions',
    cultural_program: locale === 'bengali' ? 'সাংস্কৃতিক অনুষ্ঠান' : 'Cultural Programs',
    sports: locale === 'bengali' ? 'খেলাধুলা' : 'Sports',
    academic_competition: locale === 'bengali' ? 'একাডেমিক প্রতিযোগিতা' : 'Academic Competitions',
    community_service: locale === 'bengali' ? 'সমাজসেবা' : 'Community Service'
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'islamic_competition':
        return '🕌';
      case 'cultural_program':
        return '🎭';
      case 'sports':
        return '⚽';
      case 'academic_competition':
        return '🏆';
      case 'community_service':
        return '🤝';
      default:
        return '📚';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'islamic_competition':
        return 'bg-primary-50 text-primary-700 border-primary-200';
      case 'cultural_program':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'sports':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'academic_competition':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'community_service':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Get all activities from all programs
  const allActivities = programs.flatMap(program => 
    (program.coCurricularActivities || []).map(activity => ({
      ...activity,
      programId: program._id,
      programTitle: getLocalizedText(program.title),
      ageRange: program.ageRange
    }))
  );

  // Filter activities by category
  const filteredActivities = selectedCategory === 'all' 
    ? allActivities 
    : allActivities.filter(activity => activity.category === selectedCategory);

  // Group activities by category for display
  const activitiesByCategory = filteredActivities.reduce((acc, activity) => {
    const category = activity.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(activity);
    return acc;
  }, {} as Record<string, typeof allActivities>);

  return (
    <section id="co-curricular" className="mb-20">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-100 rounded-full mb-6">
          <Trophy className="w-8 h-8 text-accent-600" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {locale === 'bengali' ? 'সহ-পাঠক্রমিক কার্যক্রম' : 'Co-curricular Activities'}
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          {locale === 'bengali' 
            ? 'শিক্ষার্থীদের সামগ্রিক বিকাশের জন্য বিভিন্ন প্রতিযোগিতা, সাংস্কৃতিক অনুষ্ঠান ও সমাজসেবামূলক কার্যক্রম'
            : 'Comprehensive development through competitions, cultural programs, and community service activities'
          }
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            {locale === 'bengali' ? 'বিভাগ অনুযায়ী ফিল্টার করুন:' : 'Filter by category:'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === key
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-300 hover:text-primary-600'
              }`}
            >
              {key !== 'all' && (
                <span className="mr-2">{getCategoryIcon(key)}</span>
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Activities Display */}
      <div className="space-y-8">
        {Object.entries(activitiesByCategory).map(([category, activities]) => (
          <div key={category} className="bg-white rounded-2xl shadow-lg border border-sand-medium overflow-hidden">
            {/* Category Header */}
            <div className={`p-6 ${getCategoryColor(category)} border-b`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCategoryIcon(category)}</span>
                <div>
                  <h3 className="text-xl font-bold">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </h3>
                  <p className="text-sm opacity-80">
                    {activities.length} {locale === 'bengali' ? 'টি কার্যক্রম' : 'activities'}
                  </p>
                </div>
              </div>
            </div>

            {/* Activities Grid */}
            <div className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                {activities.map((activity, index) => {
                  const activityKey = `${activity.programId}-${category}-${index}`;
                  const isExpanded = expandedPrograms.has(activityKey);
                  const activityName = getLocalizedText(activity.name);
                  const activityDescription = getLocalizedText(activity.description);

                  return (
                    <div
                      key={activityKey}
                      className="border border-gray-200 rounded-xl overflow-hidden hover:border-primary-300 transition-colors"
                    >
                      {/* Activity Header */}
                      <div
                        className="p-4 bg-gray-50 cursor-pointer hover:bg-primary-50 transition-colors"
                        onClick={() => toggleProgram(activityKey)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">
                              {activityName}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {activity.ageRange}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {activity.programTitle}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Activity Details */}
                      {isExpanded && activityDescription && (
                        <div className="p-4 bg-white border-t border-gray-100 animate-slide-down">
                          <div className="prose prose-sm max-w-none">
                            <p className="text-gray-700 leading-relaxed mb-4">
                              {activityDescription}
                            </p>

                            {/* Category-specific content */}
                            {category === 'islamic_competition' && (
                              <div className="bg-primary-50 p-4 rounded-lg border-r-4 border-primary-400">
                                <p className="text-right font-arabic text-lg text-primary-800 mb-2">
                                  وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ
                                </p>
                                <p className="text-sm text-primary-600">
                                  {locale === 'bengali' 
                                    ? 'এতেই প্রতিযোগীদের প্রতিযোগিতা করা উচিত'
                                    : 'In this let the competitors compete'
                                  }
                                </p>
                              </div>
                            )}

                            {category === 'community_service' && (
                              <div className="bg-orange-50 p-4 rounded-lg border-r-4 border-orange-400">
                                <p className="text-right font-arabic text-lg text-orange-800 mb-2">
                                  وَمَنْ أَحْيَاهَا فَكَأَنَّمَا أَحْيَا النَّاسَ جَمِيعًا
                                </p>
                                <p className="text-sm text-orange-600">
                                  {locale === 'bengali' 
                                    ? 'যে একটি জীবন রক্ষা করল, সে যেন সমগ্র মানবজাতিকে রক্ষা করল'
                                    : 'Whoever saves a life, it is as if he has saved all of mankind'
                                  }
                                </p>
                              </div>
                            )}

                            {category === 'sports' && (
                              <div className="bg-green-50 p-4 rounded-lg border-r-4 border-green-400">
                                <p className="text-sm text-green-600 font-medium">
                                  {locale === 'bengali' 
                                    ? '💪 শারীরিক সুস্থতা ও দলগত কাজের মাধ্যমে চরিত্র গঠন'
                                    : '💪 Character building through physical fitness and teamwork'
                                  }
                                </p>
                              </div>
                            )}

                            {category === 'cultural_program' && (
                              <div className="bg-purple-50 p-4 rounded-lg border-r-4 border-purple-400">
                                <p className="text-sm text-purple-600 font-medium">
                                  {locale === 'bengali' 
                                    ? '🎨 ইসলামী সংস্কৃতি ও ঐতিহ্যের সংরক্ষণ ও চর্চা'
                                    : '🎨 Preservation and practice of Islamic culture and traditions'
                                  }
                                </p>
                              </div>
                            )}

                            {category === 'academic_competition' && (
                              <div className="bg-blue-50 p-4 rounded-lg border-r-4 border-blue-400">
                                <p className="text-sm text-blue-600 font-medium">
                                  {locale === 'bengali' 
                                    ? '🧠 বুদ্ধিবৃত্তিক বিকাশ ও একাডেমিক উৎকর্ষতা'
                                    : '🧠 Intellectual development and academic excellence'
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
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredActivities.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {locale === 'bengali' ? 'কোনো কার্যক্রম পাওয়া যায়নি' : 'No activities found'}
          </h3>
          <p className="text-gray-600">
            {locale === 'bengali' 
              ? 'এই বিভাগে কোনো কার্যক্রম নেই। অন্য বিভাগ দেখুন।'
              : 'No activities in this category. Try viewing other categories.'
            }
          </p>
        </div>
      )}
    </section>
  );
}