'use client';

import { useLocale } from 'next-intl';
import { Calculator, Users, Heart } from 'lucide-react';

interface FeeItem {
  item: {
    bengali: string;
    english: string;
  };
  preHifz: number;
  hifz: number;
  note?: {
    bengali: string;
    english: string;
  };
}

interface FeeStructureProps {
  data?: FeeItem[];
}

export default function FeeStructure({ data }: FeeStructureProps) {
  const locale = useLocale() as 'bengali' | 'english';
  const isBengali = locale === 'bengali';

  // Fallback data if CMS data is not available
  const fallbackData: FeeItem[] = [
    {
      item: {
        bengali: 'ভর্তি ফি (এককালীন)',
        english: 'Admission Fee (One-time)'
      },
      preHifz: 20000,
      hifz: 23000
    },
    {
      item: {
        bengali: 'সেশন ফি (বাৎসরিক)',
        english: 'Session Fee (Annual)'
      },
      preHifz: 15000,
      hifz: 15000
    },
    {
      item: {
        bengali: 'বেতন (মাসিক)',
        english: 'Tuition (Monthly)'
      },
      preHifz: 6000,
      hifz: 10000
    },
    {
      item: {
        bengali: 'খাবার খরচ (মাসিক)',
        english: 'Food Cost (Monthly)'
      },
      preHifz: 0,
      hifz: 4000
    }
  ];

  const feeData = data || fallbackData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Calculator className="w-8 h-8 text-primary-400" />
          <h2 className="text-3xl font-bold text-primary-400">
            {isBengali ? 'টিউশন ফি' : 'Tuition Fee'}
          </h2>
        </div>
      </div>

      {/* Fee Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-1 border-gray-200">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="px-6 py-4 text-left text-base font-semibold text-gray-700">
                {isBengali ? 'বিষয়' : 'Item'}
              </th>
              <th className="px-6 py-4 text-center text-base font-semibold text-gray-700">
                {isBengali ? 'প্রি হিফজ' : 'Pre-Hifz'}
              </th>
              <th className="px-6 py-4 text-center text-base font-semibold text-gray-700">
                {isBengali ? 'হিফজ' : 'Hifz'}
              </th>
            </tr>
          </thead>
          <tbody>
            {feeData.map((fee, index) => (
              <tr 
                key={index} 
                className={`border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                }`}
              >
                <td className="px-6 py-4 text-lg font-medium text-gray-900">
                  {isBengali ? fee.item.bengali : fee.item.english}
                </td>
                <td className="px-6 py-4 text-lg text-center font-semibold text-primary-700">
                  {formatCurrency(fee.preHifz)}
                </td>
                <td className="px-6 py-4 text-lg text-center font-semibold text-primary-700">
                  {formatCurrency(fee.hifz)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Special Note */}
      <div className="mt-8 p-6 bg-white rounded-xl border border-primary-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-primary-800 mb-2">
              {isBengali ? 'বিশেষ ছাড়' : 'Special Discount'}
            </h3>
            <p className="text-base text-primary-700">
              {isBengali 
                ? 'একাধিক সন্তানের জন্য বিশেষ ছাড় থাকবে, ইনশা আল্লাহ।'
                : 'There will be special discounts for multiple children, Insha Allah.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {isBengali ? 'স্কুল পরবর্তী উচ্চ শিক্ষা' : 'Higher Education After School'}
            </h3>
            <div className="text-base text-gray-600 space-y-2">
              <p>
                {isBengali 
                  ? 'আলিম হওয়ার লক্ষ্যে ৮ম শ্রেণির পর শিক্ষার্থীদের তালিম বোর্ডের জন্য প্রস্তুত করা হবে এবং দাখিল/এসএসসি পরীক্ষা দিতে হবে।'
                  : 'Students aiming to become Alim after Class Eight will be prepared for the Ta\'lim Board and will take Dakhil/SSC exams.'
                }
              </p>
              <p>
                {isBengali 
                  ? 'কলেজ শিক্ষার জন্য শিক্ষার্থীরা সাধারণ শিক্ষায় মনোনিবেশ করবে এবং এসএসসি পরীক্ষা দেবে।'
                  : 'Students who wish to pursue college education will focus on general education and take SSC exams.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
