'use client';

import { useLocale, useTranslations } from 'next-intl';

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
  const t = useTranslations('admissionsExperience');

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

  return (
    <div className="bg-white rounded-2xl border border-[#e9e4dc] overflow-hidden">
      {/* Header */}
      <div className="bg-white px-6 py-7">
        <h2 className="text-xl font-semibold tracking-tight text-[#352b24]">
          {isBengali
            ? 'দশ বছরের পাঠ পরিকল্পনা (পূর্ণ হিফজ সহ)'
            : '10-Year Study Plan (With Complete Hifz)'}
        </h2>
      </div>

      {/* Table */}
      <div className="md:hidden divide-y divide-gray-200 px-4">
        {studyPlanData.map((row, index) => (
          <details key={index} className="py-1">
            <summary className="min-h-12 py-3 cursor-pointer font-semibold text-primary-800 focus-visible:outline-2">
              {row.class} · {t('age')}{' '}
              {isBengali
                ? row.age.replace(/\d/g, digit => '০১২৩৪৫৬৭৮৯'[Number(digit)])
                : row.age}
            </summary>
            <dl className="pb-4 space-y-3 text-gray-700 leading-relaxed">
              <div>
                <dt className="font-semibold">{t('islamicSubjects')}</dt>
                <dd>{row.islamicStudies[locale]}</dd>
              </div>
              <div>
                <dt className="font-semibold">{t('generalSubjects')}</dt>
                <dd>{row.general[locale]}</dd>
              </div>
            </dl>
          </details>
        ))}
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            {isBengali
              ? 'শ্রেণি অনুযায়ী পাঠ পরিকল্পনা'
              : 'Study plan by class'}
          </caption>
          <thead className="border-y border-[#e9e4dc] text-[#746c63] bg-[#fbf9f5]">
            <tr>
              <th scope="col" className="px-6 py-4 font-medium">
                {t('age')}
              </th>
              <th scope="col" className="px-6 py-4 font-medium">
                {isBengali ? 'ক্লাস' : 'Class'}
              </th>
              <th scope="col" className="px-6 py-4 font-medium">
                {t('islamicSubjects')}
              </th>
              <th scope="col" className="px-6 py-4 font-medium">
                {t('generalSubjects')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eeeae3]">
            {studyPlanData.map((row, index) => (
              <tr key={index} className="hover:bg-[#fbf9f5]">
                <td className="px-6 py-5 text-[#746c63] whitespace-nowrap">
                  {isBengali
                    ? row.age.replace(
                        /\d/g,
                        digit => '০১২৩৪৫৬৭৮৯'[Number(digit)]
                      )
                    : row.age}
                </td>
                <th
                  scope="row"
                  className="px-6 py-5 font-medium text-[#352b24] whitespace-nowrap"
                >
                  {row.class}
                </th>
                <td className="px-6 py-5 text-[#615950] leading-relaxed">
                  {row.islamicStudies[locale]}
                </td>
                <td className="px-6 py-5 text-[#615950] leading-relaxed">
                  {row.general[locale]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Note */}
      <div className="bg-[#fbf9f5] px-6 py-4 border-t border-[#e9e4dc]">
        <p className="text-xs text-[#746c63]">
          {isBengali
            ? 'বাংলা মিডিয়াম NCTB (দাখিল/এস.এস.সি) এর সাথে নিজস্ব ইসলামী শিক্ষার কারিকুলাম'
            : 'Own Islamic education curriculum integrated with Bengali Medium NCTB (Dakhil/SSC)'}
        </p>
      </div>
    </div>
  );
}
