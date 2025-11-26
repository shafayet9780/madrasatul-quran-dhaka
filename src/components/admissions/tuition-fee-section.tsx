'use client';

import { useLocale } from 'next-intl';
import { useState } from 'react';
import { Calculator, CreditCard, Users, Heart } from 'lucide-react';

interface TuitionFeeProps {
  data?: any;
}

export function TuitionFee({ data }: TuitionFeeProps) {
  const locale = useLocale() as 'bengali' | 'english';
  const isBengali = locale === 'bengali';

  const [selectedProgram, setSelectedProgram] = useState('preHifz');
  const [calculatorValues, setCalculatorValues] = useState({
    program: 'preHifz',
    siblings: 0,
    scholarship: false,
  });

  // Actual fees from curriculum
  const feeStructure = {
    preHifz: {
      name: isBengali ? 'প্রি হিফজ' : 'Pre-Hifz',
      admissionFee: 20000,
      sessionFee: 15000,
      monthlyTuition: 6000,
      monthlyFood: 0,
      total: 20000 + 15000 + (6000 * 12), // Annual total
    },
    hifz: {
      name: isBengali ? 'হিফজ' : 'Hifz',
      admissionFee: 23000,
      sessionFee: 15000,
      monthlyTuition: 10000,
      monthlyFood: 4000,
      total: 23000 + 15000 + 10000 * 12 + 4000 * 12, // Annual total
    },
  };

  const scholarships = [
    // {
    //   name: isBengali ? 'মেধা ভিত্তিক' : 'Merit-based',
    //   description: isBengali
    //     ? 'উচ্চ ফলাফলের জন্য ছাড়'
    //     : 'Discount for high performance',
    //   discount: '25%',
    //   criteria: isBengali ? '৯০% এর বেশি নম্বর' : 'Above 90% marks',
    // },
    // {
    //   name: isBengali ? 'অর্থনৈতিক সহায়তা' : 'Financial Aid',
    //   description: isBengali
    //     ? 'অর্থনৈতিক অসুবিধার জন্য ছাড়'
    //     : 'Discount for financial hardship',
    //   discount: '50%',
    //   criteria: isBengali
    //     ? 'আয়ের প্রমাণপত্র প্রয়োজন'
    //     : 'Income certificate required',
    // },
    {
      name: isBengali ? 'ভাইবোন ছাড়' : 'Sibling Discount',
      description: isBengali
        ? 'একাধিক সন্তানের জন্য ছাড়'
        : 'Discount for multiple children',
      discount: isBengali ? '২৫%' : '25%',
      criteria: isBengali
        ? 'দ্বিতীয় সন্তান থেকে'
        : 'From second child onwards',
    },
    // {
    //   name: isBengali ? 'এতিম ছাড়' : 'Orphan Discount',
    //   description: isBengali
    //     ? 'এতিম শিশুদের জন্য বিশেষ ছাড়'
    //     : 'Special discount for orphan children',
    //   discount: '75%',
    //   criteria: isBengali ? 'এতিম সনদ প্রয়োজন' : 'Orphan certificate required',
    // },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateEstimatedFee = () => {
    const baseFee =
      feeStructure[calculatorValues.program as keyof typeof feeStructure];
    let total = baseFee.total;

    // Sibling discount (15% per sibling, max 2 siblings)
    if (calculatorValues.siblings > 0) {
      const siblingDiscount = Math.min(calculatorValues.siblings, 2) * 0.15;
      total = total * (1 - siblingDiscount);
    }

    // Scholarship discount (25% for merit-based)
    if (calculatorValues.scholarship) {
      total = total * 0.75; // 25% scholarship
    }

    return Math.round(total);
  };

  return (
    <div>
      {/* Section Title */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-400 mb-0">
            {isBengali ? 'টিউশন ফি' : 'Tuition Fee'}
          </h2>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          {isBengali
            ? 'আপনার সন্তানের জন্য সঠিক ফি গণনা করুন এবং উপলব্ধ ছাড় সম্পর্কে জানুন'
            : 'Calculate the correct fee for your child and learn about available discounts'}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        {/* Fee Structure Tables */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-primary-600 mb-6">
            {isBengali ? 'ফি কাঠামো' : 'Fee Structure'}
          </h3>

          {/* Program Selector */}
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(feeStructure).map(([key, program]) => (
              <button
                key={key}
                onClick={() => setSelectedProgram(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedProgram === key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {program.name}
              </button>
            ))}
          </div>

          {/* Fee Table */}
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-primary-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">
                    {isBengali ? 'ফি ধরণ' : 'Fee Type'}
                  </th>
                  <th className="px-6 py-4 text-right font-semibold">
                    {isBengali ? 'পরিমাণ' : 'Amount'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(
                  feeStructure[selectedProgram as keyof typeof feeStructure]
                ).map(([key, value]) => {
                  if (key === 'name' || key === 'total') return null;
                  const feeLabels = {
                    admissionFee: isBengali
                      ? 'ভর্তি ফি (এককালীন)'
                      : 'Admission Fee (One-time)',
                    sessionFee: isBengali
                      ? 'সেশন ফি (বাৎসরিক)'
                      : 'Session Fee (Annual)',
                    monthlyTuition: isBengali
                      ? 'বেতন (মাসিক)'
                      : 'Tuition (Monthly)',
                    monthlyFood: isBengali
                      ? 'খাবার খরচ (মাসিক)'
                      : 'Food Cost (Monthly)',
                  };
                  return (
                    <tr key={key} className="hover:bg-gray-100">
                      <td className="px-6 py-4 text-gray-900">
                        {feeLabels[key as keyof typeof feeLabels]}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        {formatCurrency(value as number)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-primary-50 font-bold">
                  <td className="px-6 py-4 text-primary-800">
                    {isBengali
                      ? 'বাৎসরিক মোট (আনুমানিক)'
                      : 'Annual Total (Estimated)'}
                  </td>
                  <td className="px-6 py-4 text-right text-primary-800">
                    {formatCurrency(
                      feeStructure[selectedProgram as keyof typeof feeStructure]
                        .total
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Scholarship Information */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-primary-600 mb-6">
            {isBengali ? 'বিশেষ ছাড়' : 'Special Discounts'}
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {scholarships.map((scholarship, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {scholarship.name}
                  </h4>
                  <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {scholarship.discount}
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{scholarship.description}</p>
                <div className="bg-white rounded-md p-3">
                  <p className="text-sm text-gray-600">
                    <strong>{isBengali ? 'শর্তাবলী' : 'Criteria'}:</strong>{' '}
                    {scholarship.criteria}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <h3 className="text-2xl font-bold text-primary-600 mb-6">
            {isBengali ? 'পেমেন্ট পদ্ধতি' : 'Payment Methods'}
          </h3>

          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <p className="text-lg font-semibold text-green-600 mb-3">
              {isBengali
                ? 'আপনার সন্তান ভর্তির জন্য নির্বাচিত হলে, আমাদের স্কুল ক্যাম্পাসে এসে পেমেন্ট সম্পন্ন করে ভর্তি নিশ্চিত করতে হবে'
                : 'Once your child is selected for admission, you must pay the tuition fee at our school campus and confirm the admission'}
            </p>
          </div>

          {/* Payment Policies */}
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-red-800 mb-3">
              {isBengali ? 'পেমেন্ট নীতি' : 'Payment Policies'}
            </h4>
            <ul className="space-y-2 text-red-700">
              <li>
                •{' '}
                {isBengali
                  ? 'ভর্তি ফি ভর্তির সময় এককালীন প্রদান করতে হবে'
                  : 'Admission fee must be paid one-time during admission'}
              </li>
              <li>
                •{' '}
                {isBengali
                  ? 'মাসিক বেতন প্রতি মাসের ১০ তারিখের মধ্যে প্রদান করতে হবে'
                  : 'Monthly tuition must be paid by 10th of each month'}
              </li>
              <li>
                •{' '}
                {isBengali
                  ? 'রিফান্ড নীতি স্কুল কর্তৃপক্ষের সিদ্ধান্তের উপর নির্ভরশীল'
                  : 'Refund policy depends on school authority decision'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
