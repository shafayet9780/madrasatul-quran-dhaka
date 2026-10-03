'use client';

import { useLocale, useTranslations } from 'next-intl';
import { studyPeriods } from '@/lib/study-periods';

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
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-white px-6 py-7">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          {isBengali
            ? 'দশ বছরের পাঠ পরিকল্পনা (পূর্ণ হিফজ সহ)'
            : '10-Year Study Plan (With Complete Hifz)'}
        </h2>
      </div>

      <p className="px-6 pb-4 text-sm text-[var(--color-text-secondary)] md:hidden">
        {t('swipePeriods')}
      </p>
      <div
        role="region"
        aria-label={t('periodGrid')}
        tabIndex={0}
        className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
      >
        <table className="w-full min-w-[1080px] table-fixed border-collapse text-center text-sm">
          <caption className="sr-only">{t('periodGrid')}</caption>
          <colgroup>
            <col className="w-16" />
            <col className="w-24" />
            {Array.from({ length: 8 }, (_, index) => (
              <col key={index} />
            ))}
          </colgroup>
          <thead className="text-[var(--color-text-primary)]">
            <tr className="bg-secondary-50">
              <th
                rowSpan={2}
                scope="col"
                className="border border-gray-200 px-2 py-4 font-medium"
              >
                {t('age')}
              </th>
              <th
                rowSpan={2}
                scope="col"
                className="sticky left-0 z-10 border border-gray-200 bg-secondary-50 px-2 py-4 font-medium"
              >
                {isBengali ? 'ক্লাস' : 'Class'}
              </th>
              <th
                colSpan={3}
                scope="colgroup"
                className="border border-gray-200 px-2 py-4 font-semibold"
              >
                {t('islamicSubjects')}
              </th>
              <th
                colSpan={5}
                scope="colgroup"
                className="border border-gray-200 px-2 py-4 font-semibold"
              >
                {t('generalSubjects')}
              </th>
            </tr>
            <tr className="bg-gray-50">
              {Array.from({ length: 8 }, (_, index) => (
                <th
                  key={index}
                  scope="col"
                  className="border border-gray-200 px-1 py-2 text-xs font-medium"
                >
                  {t('period')}{' '}
                  {new Intl.NumberFormat(isBengali ? 'bn-BD' : 'en-BD').format(
                    index + 1
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {studyPlanData.map((row, index) => {
              const periods = studyPeriods(
                row.islamicStudies[locale],
                row.general[locale],
                index
              );
              const cellClass =
                'border border-gray-200 px-2 py-4 text-[var(--color-text-primary)] leading-relaxed';
              return (
                <tr key={index}>
                  <td className={cellClass}>
                    {isBengali
                      ? row.age.replace(
                          /\d/g,
                          digit => '০১২৩৪৫৬৭৮৯'[Number(digit)]
                        )
                      : row.age}
                  </td>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border border-gray-200 bg-white px-2 py-4 font-semibold text-[var(--color-text-primary)]"
                  >
                    {row.class}
                  </th>
                  {periods.islamic.map((subject, slot) => (
                    <td
                      key={`islamic-${slot}`}
                      colSpan={periods.merged ? 3 : 1}
                      className={`${cellClass} bg-secondary-50/40`}
                    >
                      {subject || (
                        <span className="sr-only">{t('emptyPeriod')}</span>
                      )}
                    </td>
                  ))}
                  {periods.general.map((subject, slot) => (
                    <td
                      key={`general-${slot}`}
                      colSpan={periods.merged ? 5 : 1}
                      className={cellClass}
                    >
                      {subject || (
                        <span className="sr-only">{t('emptyPeriod')}</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Note */}
      <div className="bg-secondary-50 px-6 py-4 border-t border-gray-200">
        <p className="text-xs text-secondary-800">
          {isBengali
            ? 'বাংলা মিডিয়াম NCTB (দাখিল/এস.এস.সি) এর সাথে নিজস্ব ইসলামী শিক্ষার কারিকুলাম'
            : 'Own Islamic education curriculum integrated with Bengali Medium NCTB (Dakhil/SSC)'}
        </p>
      </div>
    </div>
  );
}
