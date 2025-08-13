'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, GraduationCap, Clock, Filter, Search } from 'lucide-react';
import { type AcademicProgram } from '@/types/sanity';
import { type Locale } from '@/lib/i18n';

interface NCTBCurriculumSectionProps {
  programs: AcademicProgram[];
  locale: Locale;
}

export default function NCTBCurriculumSection({ programs, locale }: NCTBCurriculumSectionProps) {
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Filter programs based on search and grade filter
  const filteredPrograms = programs.filter(program => {
    const nctbSubjects = program.nctbCurriculum?.subjects || [];
    if (nctbSubjects.length === 0) return false;

    // Search filter
    if (searchTerm) {
      const programTitle = getLocalizedText(program.title).toLowerCase();
      const subjectNames = nctbSubjects.map(subject => 
        getLocalizedText(subject.name).toLowerCase()
      ).join(' ');
      
      if (!programTitle.includes(searchTerm.toLowerCase()) && 
          !subjectNames.includes(searchTerm.toLowerCase())) {
        return false;
      }
    }

    // Grade filter
    if (selectedGradeFilter !== 'all') {
      const ageRange = program.ageRange.toLowerCase();
      if (selectedGradeFilter === 'primary' && !ageRange.includes('1') && !ageRange.includes('2') && !ageRange.includes('3') && !ageRange.includes('4') && !ageRange.includes('5')) {
        return false;
      }
      if (selectedGradeFilter === 'secondary' && !ageRange.includes('6') && !ageRange.includes('7') && !ageRange.includes('8') && !ageRange.includes('9') && !ageRange.includes('10')) {
        return false;
      }
    }

    return true;
  });

  const gradeFilters = [
    { value: 'all', label: locale === 'bengali' ? 'সকল শ্রেণী' : 'All Grades' },
    { value: 'primary', label: locale === 'bengali' ? 'প্রাথমিক (১-৫)' : 'Primary (1-5)' },
    { value: 'secondary', label: locale === 'bengali' ? 'মাধ্যমিক (৬-১০)' : 'Secondary (6-10)' },
  ];

  const getSubjectCategoryColor = (subjectName: string) => {
    const name = subjectName.toLowerCase();
    if (name.includes('math') || name.includes('গণিত')) return 'bg-blue-50 border-blue-200 text-blue-800';
    if (name.includes('science') || name.includes('বিজ্ঞান')) return 'bg-green-50 border-green-200 text-green-800';
    if (name.includes('english') || name.includes('ইংরেজি')) return 'bg-purple-50 border-purple-200 text-purple-800';
    if (name.includes('bangla') || name.includes('বাংলা')) return 'bg-red-50 border-red-200 text-red-800';
    if (name.includes('social') || name.includes('সামাজিক')) return 'bg-orange-50 border-orange-200 text-orange-800';
    return 'bg-gray-50 border-gray-200 text-gray-800';
  };

  return (
    <section id="nctb-curriculum" className="mb-20">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-100 rounded-full mb-6">
          <GraduationCap className="w-8 h-8 text-secondary-600" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {locale === 'bengali' ? 'এনসিটিবি পাঠ্যক্রম' : 'NCTB Curriculum'}
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          {locale === 'bengali' 
            ? 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ডের অনুমোদিত পাঠ্যক্রম অনুসরণে আধুনিক শিক্ষা'
            : 'Modern education following the National Curriculum and Textbook Board approved syllabus'
          }
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-8 bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={locale === 'bengali' ? 'বিষয় বা প্রোগ্রাম খুঁজুন...' : 'Search subjects or programs...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
            />
          </div>

          {/* Grade Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedGradeFilter}
              onChange={(e) => setSelectedGradeFilter(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors bg-white min-w-[180px]"
            >
              {gradeFilters.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-8">
        {filteredPrograms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-200">
            <div className="text-gray-400 mb-4">
              <GraduationCap className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {locale === 'bengali' ? 'কোনো প্রোগ্রাম পাওয়া যায়নি' : 'No Programs Found'}
            </h3>
            <p className="text-gray-500">
              {locale === 'bengali' 
                ? 'অনুসন্ধান বা ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন'
                : 'Try changing your search or filter criteria'
              }
            </p>
          </div>
        ) : (
          filteredPrograms.map((program) => {
            const isExpanded = expandedPrograms.has(program._id);
            const nctbSubjects = program.nctbCurriculum?.subjects || [];

            return (
              <div
                key={program._id}
                className="bg-white rounded-2xl shadow-lg border border-sand-medium overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Program Header */}
                <div
                  className="p-6 bg-gradient-to-r from-secondary-50 to-secondary-100 cursor-pointer"
                  onClick={() => toggleProgram(program._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-secondary-800 mb-2">
                        {getLocalizedText(program.title)}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-600">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4" />
                          {program.ageRange}
                        </span>
                        {program.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {program.duration}
                          </span>
                        )}
                        <span className="bg-secondary-200 px-3 py-1 rounded-full font-medium">
                          {nctbSubjects.length} {locale === 'bengali' ? 'বিষয়' : 'Subjects'}
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
                        <ChevronUp className="w-6 h-6 text-secondary-600" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-secondary-600" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable Content */}
                {isExpanded && (
                  <div className="p-6 bg-white animate-slide-down">
                    <div className="grid gap-6">
                      {nctbSubjects.map((subject, index) => {
                        const subjectKey = `${program._id}-nctb-${index}`;
                        const isSubjectExpanded = expandedSubjects.has(subjectKey);
                        const subjectName = getLocalizedText(subject.name);
                        const subjectDescription = getLocalizedText(subject.description);
                        const categoryColor = getSubjectCategoryColor(subjectName);

                        return (
                          <div
                            key={subjectKey}
                            className="border border-gray-200 rounded-xl overflow-hidden hover:border-secondary-300 transition-colors"
                          >
                            {/* Subject Header */}
                            <div
                              className="p-4 bg-gray-50 cursor-pointer hover:bg-secondary-50 transition-colors"
                              onClick={() => toggleSubject(subjectKey)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="text-lg font-semibold text-gray-900">
                                      {subjectName}
                                    </h4>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${categoryColor}`}>
                                      {locale === 'bengali' ? 'এনসিটিবি' : 'NCTB'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    {subject.hoursPerWeek && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {subject.hoursPerWeek} {locale === 'bengali' ? 'ঘন্টা/সপ্তাহ' : 'hrs/week'}
                                      </span>
                                    )}
                                    {/* Integration Point Indicator */}
                                    <span className="text-secondary-600 text-xs bg-secondary-100 px-2 py-1 rounded-full">
                                      {locale === 'bengali' ? 'ইসলামী মূল্যবোধ সমন্বিত' : 'Integrated with Islamic Values'}
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
                                  
                                  {/* Integration Points */}
                                  <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-4 rounded-lg border-l-4 border-primary-400">
                                    <h5 className="font-semibold text-gray-800 mb-2">
                                      {locale === 'bengali' ? 'ইসলামী শিক্ষার সাথে সমন্বয়' : 'Integration with Islamic Education'}
                                    </h5>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                      {locale === 'bengali' 
                                        ? 'এই বিষয়টি ইসলামী নৈতিকতা ও মূল্যবোধের সাথে সমন্বয় করে পড়ানো হয়, যাতে শিক্ষার্থীরা আধুনিক জ্ঞানের পাশাপাশি ইসলামী দৃষ্টিভঙ্গিও অর্জন করতে পারে।'
                                        : 'This subject is taught in integration with Islamic ethics and values, enabling students to gain modern knowledge alongside an Islamic perspective.'
                                      }
                                    </p>
                                  </div>

                                  {/* Subject-specific integration examples */}
                                  {subjectName.toLowerCase().includes('math') || subjectName.toLowerCase().includes('গণিত') && (
                                    <div className="mt-3 bg-blue-50 p-3 rounded-lg">
                                      <p className="text-sm text-blue-700">
                                        {locale === 'bengali' 
                                          ? 'উদাহরণ: জাকাত হিসাব, মীরাস বণ্টন, ইসলামী ক্যালেন্ডার গণনা'
                                          : 'Examples: Zakat calculations, inheritance distribution, Islamic calendar calculations'
                                        }
                                      </p>
                                    </div>
                                  )}

                                  {subjectName.toLowerCase().includes('science') || subjectName.toLowerCase().includes('বিজ্ঞান') && (
                                    <div className="mt-3 bg-green-50 p-3 rounded-lg">
                                      <p className="text-sm text-green-700">
                                        {locale === 'bengali' 
                                          ? 'উদাহরণ: সৃষ্টির নিদর্শন, পবিত্রতার বিজ্ঞান, প্রাকৃতিক ঘটনায় আল্লাহর কুদরত'
                                          : 'Examples: Signs of creation, science of purification, Allah\'s power in natural phenomena'
                                        }
                                      </p>
                                    </div>
                                  )}

                                  {subjectName.toLowerCase().includes('social') || subjectName.toLowerCase().includes('সামাজিক') && (
                                    <div className="mt-3 bg-orange-50 p-3 rounded-lg">
                                      <p className="text-sm text-orange-700">
                                        {locale === 'bengali' 
                                          ? 'উদাহরণ: ইসলামী সভ্যতার ইতিহাস, মুসলিম বিজ্ঞানীদের অবদান, ইসলামী সমাজব্যবস্থা'
                                          : 'Examples: History of Islamic civilization, contributions of Muslim scientists, Islamic social system'
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

                    {/* Program Integration Summary */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="bg-gradient-to-r from-primary-100 to-secondary-100 p-6 rounded-xl">
                        <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                          {locale === 'bengali' ? 'সমন্বিত শিক্ষা পদ্ধতি' : 'Integrated Education Approach'}
                        </h5>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {locale === 'bengali' 
                            ? 'আমাদের শিক্ষা পদ্ধতিতে এনসিটিবি পাঠ্যক্রমের প্রতিটি বিষয় ইসলামী শিক্ষার সাথে সুন্দরভাবে সমন্বিত। এর ফলে শিক্ষার্থীরা আধুনিক জ্ঞান অর্জনের পাশাপাশি ইসলামী মূল্যবোধ ও নৈতিকতাও শিখে থাকে।'
                            : 'In our educational approach, every NCTB curriculum subject is beautifully integrated with Islamic education. This enables students to acquire modern knowledge while also learning Islamic values and ethics.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}