'use client';

import { useLocale } from 'next-intl';

interface StudyPlanData {
  age: string;
  class: string;
  islamicStudies: {
    bengali: string;
    english: string;
  };
  general: {
    bengali: string;
    english: string;
  };
}

interface TenYearStudyPlanProps {
  data?: StudyPlanData[];
}

export default function TenYearStudyPlan({ data }: TenYearStudyPlanProps) {
  const locale = useLocale() as 'bengali' | 'english';
  const isBengali = locale === 'bengali';

  // Fallback data if CMS data is not available
  const fallbackData: StudyPlanData[] = [
    {
      age: '5+',
      class: isBengali ? 'নার্সারি' : 'Nursery',
      islamicStudies: {
        bengali: 'কায়দা, আরবি-N, ইসলাম-N',
        english: 'Qaida, Arabic-N, Islam-N',
      },
      general: {
        bengali: 'বাংলা, ইংরেজি, গণিত',
        english: 'Bengali, English, Mathematics',
      },
    },
    {
      age: '6+',
      class: isBengali ? 'কেজি' : 'KG',
      islamicStudies: {
        bengali: 'আম্মাপারা, আরবি-KG, ইসলাম-KG',
        english: 'Ammapara, Arabic-KG, Islam-KG',
      },
      general: {
        bengali: 'বাংলা, ইংরেজি, গণিত',
        english: 'Bengali, English, Mathematics',
      },
    },
    {
      age: '7+',
      class: isBengali ? '১ম' : 'Class 1',
      islamicStudies: {
        bengali: 'নাজেরা, আরবি-১, ইসলাম-১',
        english: 'Nazera, Arabic-1, Islam-1',
      },
      general: {
        bengali: 'বাংলা, ইংরেজি, গণিত',
        english: 'Bengali, English, Mathematics',
      },
    },
    {
      age: '8+',
      class: isBengali ? '২য়' : 'Class 2',
      islamicStudies: {
        bengali: 'হিফজ-১, আরবি-২, ইসলাম-২',
        english: 'Hifz-1, Arabic-2, Islam-2',
      },
      general: {
        bengali: 'বাংলা, ইংরেজি, গণিত',
        english: 'Bengali, English, Mathematics',
      },
    },
    {
      age: '9+',
      class: isBengali ? '৩য়' : 'Class 3',
      islamicStudies: {
        bengali: 'হিফজ-২, আরবি-৩, ইসলাম-৩',
        english: 'Hifz-2, Arabic-3, Islam-3',
      },
      general: {
        bengali: 'বাংলা, ইংরেজি, গণিত',
        english: 'Bengali, English, Mathematics',
      },
    },
    {
      age: '10+',
      class: isBengali ? '৪র্থ' : 'Class 4',
      islamicStudies: {
        bengali: 'হিফজ-৩, ইসলাম-৪, আরবি-৪',
        english: 'Hifz-3, Islam-4, Arabic-4',
      },
      general: {
        bengali: 'বাংলা, ইংরেজি, গণিত',
        english: 'Bengali, English, Mathematics',
      },
    },
    {
      age: '11+',
      class: isBengali ? '৫ম' : 'Class 5',
      islamicStudies: {
        bengali: 'শুনানি, আরবি-৫, ইসলাম-৫',
        english: 'Shunani, Arabic-5, Islam-5',
      },
      general: {
        bengali: 'বাংলা, ইংরেজি, গণিত, বিজ্ঞান, বিজিএস',
        english: 'Bengali, English, Mathematics, Science, BGS',
      },
    },
    {
      age: '12+',
      class: isBengali ? '৬ষ্ঠ' : 'Class 6',
      islamicStudies: {
        bengali: 'আরবি-৬, ইসলাম-৬',
        english: 'Arabic-6, Islam-6',
      },
      general: {
        bengali: 'বাংলা, ইংরেজি, গণিত, বিজ্ঞান, বিজিএস',
        english: 'Bengali, English, Mathematics, Science, BGS',
      },
    },
    {
      age: '13+',
      class: isBengali ? '৭ম' : 'Class 7',
      islamicStudies: {
        bengali: 'আরবি-৭, ইসলাম-৭',
        english: 'Arabic-7, Islam-7',
      },
      general: {
        bengali: 'বাংলা, ইংরেজি, গণিত, বিজ্ঞান, বিজিএস',
        english: 'Bengali, English, Mathematics, Science, BGS',
      },
    },
    {
      age: '14+',
      class: isBengali ? '৮ম' : 'Class 8',
      islamicStudies: {
        bengali: 'আরবি-৮, ইসলাম-৮',
        english: 'Arabic-8, Islam-8',
      },
      general: {
        bengali: 'বাংলা, ইংরেজি, গণিত, বিজ্ঞান, বিজিএস',
        english: 'Bengali, English, Mathematics, Science, BGS',
      },
    },
    {
      age: '15+',
      class: isBengali ? '৯ম' : 'Class 9',
      islamicStudies: {
        bengali: 'এসএসসি/দাখিল প্রস্তুতি',
        english: 'SSC/DAKHIL Preparation',
      },
      general: {
        bengali: 'এসএসসি/দাখিল প্রস্তুতি',
        english: 'SSC/DAKHIL Preparation',
      },
    },
    {
      age: '16+',
      class: isBengali ? '১০ম' : 'Class 10',
      islamicStudies: {
        bengali: 'এসএসসি/দাখিল প্রস্তুতি',
        english: 'SSC/DAKHIL Preparation',
      },
      general: {
        bengali: 'এসএসসি/দাখিল প্রস্তুতি',
        english: 'SSC/DAKHIL Preparation',
      },
    },
  ];

  const studyPlanData = data || fallbackData;

  // Define color groups based on the image
  const getRowColorClass = (index: number) => {
    if (index >= 0 && index <= 2) {
      // Group 1: Nursery, KG, Class 1 (Light Green)
      return 'bg-green-25 hover:bg-green-50';
    } else if (index >= 3 && index <= 5) {
      // Group 2: Class 2, 3, 4 (Light Pink/Salmon)
      return 'bg-pink-25 hover:bg-pink-50';
    } else if (index >= 6 && index <= 9) {
      // Group 3: Class 5, 6, 7, 8 (Light Blue)
      return 'bg-blue-25 hover:bg-blue-50';
    } else if (index >= 10 && index <= 11) {
      // Group 4: Class 9, 10 (Light Pink/Salmon - repeating)
      return 'bg-pink-25 hover:bg-pink-50';
    }
    return 'bg-white hover:bg-gray-25';
  };

  // Get box background color to match row color
  const getBoxColorClass = (index: number) => {
    if (index >= 0 && index <= 2) {
      // Group 1: Nursery, KG, Class 1 (Light Green)
      return 'bg-green-100 border-green-300 rounded-md';
    } else if (index >= 3 && index <= 5) {
      // Group 2: Class 2, 3, 4 (Light Pink/Salmon)
      return 'bg-pink-100 border-pink-300 rounded-md';
    } else if (index >= 6 && index <= 9) {
      // Group 3: Class 5, 6, 7, 8 (Light Blue)
      return 'bg-blue-100 border-blue-300 rounded-md';
    } else if (index >= 10 && index <= 11) {
      // Group 4: Class 9, 10 (Light Pink/Salmon - repeating)
      return 'bg-pink-100 border-pink-300 rounded-md';
    }
    return 'bg-gray-100 border-gray-300 rounded-md';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-white px-6 py-4">
        <h3 className="text-2xl font-bold text-primary-500 text-center">
          {isBengali
            ? 'দশ বছরের পাঠ পরিকল্পনা (পূর্ণ হিফজ সহ)'
            : '10-Year Study Plan (With Complete Hifz)'}
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-primary-300 to-primary-400">
              <th className="px-4 py-3 text-center text-sm font-bold text-white uppercase tracking-wide border-b border-amber-800">
                {isBengali ? 'বয়স' : 'Age'}
              </th>
              <th className="px-4 py-3 text-center text-sm font-bold text-white uppercase tracking-wide border-b border-amber-800">
                {isBengali ? 'ক্লাস' : 'Class'}
              </th>
              <th className="px-4 py-3 text-center text-sm font-bold text-white uppercase tracking-wide border-b border-amber-800">
                {isBengali ? 'ইসলামিক স্টাডিজ' : 'Islamic Studies'}
              </th>
              <th className="px-4 py-3 text-center text-sm font-bold text-white uppercase tracking-wide border-b border-amber-800">
                {isBengali ? 'জেনারেল' : 'General'}
              </th>
            </tr>
          </thead>
          <tbody>
            {studyPlanData.map((row, index) => (
              <tr
                key={index}
                className={`${index === 2 || index === 5 || index === 9 ? 'border-b-1 border-gray-400' : 'border-b border-gray-200'} ${getRowColorClass(index)}`}
              >
                <td className="px-4 py-3 text-sm font-semibold text-gray-900 border-r border-gray-400">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-xs font-bold">
                    {row.age}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-primary-800 border-r border-gray-400">
                  {row.class}
                </td>
                <td className="px-1 py-2 border-r border-gray-400">
                  <div className="grid grid-cols-3 gap-1 w-full">
                    {index >= 10 ? (
                      // Classes 9, 10 - span all 5 slots
                      <div
                        className={`px-2 py-1 text-sm font-medium text-gray-700 border text-center col-span-5 min-w-0 ${getBoxColorClass(index)}`}
                      >
                        {isBengali ? row.general.bengali : row.general.english}
                      </div>
                    ) : index >= 7 && index <= 9 ? (
                      // Classes 6, 7 - first slot blank
                      <>
                         <div
                           className={`px-2 py-1 text-sm font-medium text-gray-700 border text-center min-w-0 ${getBoxColorClass(index)}`}
                         ></div>
                         {(isBengali
                           ? row.islamicStudies.bengali
                           : row.islamicStudies.english
                         )
                           .split(', ')
                           .map((subject, subIndex) => (
                             <div
                               key={subIndex}
                               className={`px-2 py-1 text-sm font-medium text-gray-700 border text-center min-w-0 ${getBoxColorClass(index)}`}
                             >
                               {subject.trim()}
                             </div>
                           ))}
                         {/* Fill remaining slots to ensure 3 total */}
                         {Array.from({
                           length:
                             3 -
                             1 -
                             (isBengali
                               ? row.islamicStudies.bengali
                               : row.islamicStudies.english
                             ).split(', ').length,
                         }).map((_, subIndex) => (
                           <div
                             key={`empty-${subIndex}`}
                             className={`px-2 py-1 text-sm font-medium text-gray-700 border text-center min-w-0 ${getBoxColorClass(index)}`}
                           ></div>
                         ))}
                      </>
                    ) : (
                      // Other classes - normal 3 slots
                      <>
                        {(isBengali
                          ? row.islamicStudies.bengali
                          : row.islamicStudies.english
                        )
                          .split(', ')
                          .map((subject, subIndex) => (
                            <div
                              key={subIndex}
                              className={`px-2 py-1 text-sm font-medium text-gray-700 border text-center min-w-0 ${getBoxColorClass(index)}`}
                            >
                              {subject.trim()}
                            </div>
                          ))}
                        {/* Fill remaining slots if needed */}
                        {Array.from({
                          length:
                            3 -
                            (isBengali
                              ? row.islamicStudies.bengali
                              : row.islamicStudies.english
                            ).split(', ').length,
                        }).map((_, subIndex) => (
                          <div
                            key={`empty-${subIndex}`}
                            className={`px-2 py-1 text-sm font-medium text-gray-700 border text-center min-w-0 ${getBoxColorClass(index)}`}
                          ></div>
                        ))}
                      </>
                    )}
                  </div>
                </td>
                <td className="px-1 py-2">
                  <div className="grid grid-cols-5 gap-1 w-full">
                    {index >= 10 ? (
                      // Classes 9, 10 - span all 5 slots
                      <div
                        className={`px-2 py-1 text-sm font-medium text-gray-700 border text-center col-span-5 min-w-0 ${getBoxColorClass(index)}`}
                      >
                        {isBengali ? row.general.bengali : row.general.english}
                      </div>
                    ) : (
                      // Other classes - 5 slots with last 2 blank for first 6 rows
                      <>
                        {(isBengali ? row.general.bengali : row.general.english)
                          .split(', ')
                          .map((subject, subIndex) => (
                            <div
                              key={subIndex}
                              className={`px-2 py-1 text-sm font-medium text-gray-700 border text-center min-w-0 ${getBoxColorClass(index)}`}
                            >
                              {subject.trim()}
                            </div>
                          ))}
                        {/* Fill remaining slots - last 2 blank for first 6 rows */}
                        {Array.from({
                          length:
                            5 -
                            (isBengali
                              ? row.general.bengali
                              : row.general.english
                            ).split(', ').length,
                        }).map((_, subIndex) => (
                          <div
                            key={`empty-${subIndex}`}
                            className={`px-2 py-1 text-sm font-medium text-gray-700 border text-center min-w-0 ${getBoxColorClass(index)}`}
                          ></div>
                        ))}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Note */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          {isBengali
            ? 'বাংলা মিডিয়াম NCTB (দাখিল/এস.এস.সি) এর সাথে নিজস্ব ইসলামী শিক্ষার কারিকুলাম'
            : 'Own Islamic education curriculum integrated with Bengali Medium NCTB (Dakhil/SSC)'}
        </p>
      </div>
    </div>
  );
}
