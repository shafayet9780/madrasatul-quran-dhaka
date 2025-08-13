'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CalculatorIcon, CreditCardIcon } from '@heroicons/react/24/outline';

export function FeeStructure() {
  const t = useTranslations('admissions.feeStructure');
  const [selectedProgram, setSelectedProgram] = useState('primary');
  const [calculatorValues, setCalculatorValues] = useState({
    program: 'primary',
    siblings: 0,
    scholarship: false,
  });

  const feeStructure = {
    primary: {
      name: t('programs.primary.name'),
      admissionFee: 15000,
      monthlyTuition: 8000,
      examFee: 2000,
      developmentFee: 5000,
      total: 30000,
    },
    secondary: {
      name: t('programs.secondary.name'),
      admissionFee: 20000,
      monthlyTuition: 12000,
      examFee: 3000,
      developmentFee: 7000,
      total: 42000,
    },
    higher: {
      name: t('programs.higher.name'),
      admissionFee: 25000,
      monthlyTuition: 15000,
      examFee: 4000,
      developmentFee: 10000,
      total: 54000,
    },
  };

  const scholarships = [
    {
      name: t('scholarships.merit.name'),
      description: t('scholarships.merit.description'),
      discount: '25%',
      criteria: t('scholarships.merit.criteria'),
    },
    {
      name: t('scholarships.need.name'),
      description: t('scholarships.need.description'),
      discount: '50%',
      criteria: t('scholarships.need.criteria'),
    },
    {
      name: t('scholarships.sibling.name'),
      description: t('scholarships.sibling.description'),
      discount: '15%',
      criteria: t('scholarships.sibling.criteria'),
    },
    {
      name: t('scholarships.orphan.name'),
      description: t('scholarships.orphan.description'),
      discount: '75%',
      criteria: t('scholarships.orphan.criteria'),
    },
  ];

  const paymentMethods = [
    {
      name: t('payment.bank.name'),
      description: t('payment.bank.description'),
      details: t('payment.bank.details'),
    },
    {
      name: t('payment.mobile.name'),
      description: t('payment.mobile.description'),
      details: t('payment.mobile.details'),
    },
    {
      name: t('payment.cash.name'),
      description: t('payment.cash.description'),
      details: t('payment.cash.details'),
    },
  ];

  const calculateEstimatedFee = () => {
    const baseFee = feeStructure[calculatorValues.program as keyof typeof feeStructure];
    let total = baseFee.total;
    
    // Sibling discount
    if (calculatorValues.siblings > 0) {
      total = total * (1 - (calculatorValues.siblings * 0.1));
    }
    
    // Scholarship discount
    if (calculatorValues.scholarship) {
      total = total * 0.75; // 25% scholarship
    }
    
    return Math.round(total);
  };

  return (
    <section className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 px-8 py-6 border-b">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {t('title')}
        </h2>
        <p className="text-gray-600">
          {t('subtitle')}
        </p>
      </div>

      <div className="p-8">
        {/* Fee Structure Tables */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            {t('structure.title')}
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
                    {t('structure.feeType')}
                  </th>
                  <th className="px-6 py-4 text-right font-semibold">
                    {t('structure.amount')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(feeStructure[selectedProgram as keyof typeof feeStructure]).map(([key, value]) => {
                  if (key === 'name') return null;
                  return (
                    <tr key={key} className="hover:bg-gray-100">
                      <td className="px-6 py-4 text-gray-900">
                        {t(`structure.${key}`)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        ৳{typeof value === 'number' ? value.toLocaleString() : value}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Aid Calculator */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            {t('calculator.title')}
          </h3>
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('calculator.program')}
                  </label>
                  <select
                    value={calculatorValues.program}
                    onChange={(e) => setCalculatorValues({...calculatorValues, program: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {Object.entries(feeStructure).map(([key, program]) => (
                      <option key={key} value={key}>{program.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('calculator.siblings')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={calculatorValues.siblings}
                    onChange={(e) => setCalculatorValues({...calculatorValues, siblings: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={calculatorValues.scholarship}
                      onChange={(e) => setCalculatorValues({...calculatorValues, scholarship: e.target.checked})}
                      className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {t('calculator.scholarship')}
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border-2 border-primary-200">
                <div className="flex items-center mb-3">
                  <CalculatorIcon className="h-6 w-6 text-primary-600 mr-2" />
                  <h4 className="text-lg font-semibold text-gray-900">
                    {t('calculator.estimated')}
                  </h4>
                </div>
                <div className="text-3xl font-bold text-primary-600">
                  ৳{calculateEstimatedFee().toLocaleString()}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {t('calculator.note')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scholarship Information */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            {t('scholarships.title')}
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {scholarships.map((scholarship, index) => (
              <div key={index} className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {scholarship.name}
                  </h4>
                  <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {scholarship.discount}
                  </span>
                </div>
                <p className="text-gray-700 mb-3">
                  {scholarship.description}
                </p>
                <div className="bg-white rounded-md p-3">
                  <p className="text-sm text-gray-600">
                    <strong>{t('scholarships.criteria')}:</strong> {scholarship.criteria}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            {t('payment.title')}
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {paymentMethods.map((method, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <CreditCardIcon className="h-8 w-8 text-primary-600 mr-3" />
                  <h4 className="text-lg font-semibold text-gray-900">
                    {method.name}
                  </h4>
                </div>
                <p className="text-gray-700 mb-3">
                  {method.description}
                </p>
                <div className="bg-white rounded-md p-3 border">
                  <p className="text-sm text-gray-600">
                    {method.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Payment Policies */}
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-red-800 mb-3">
              {t('policies.title')}
            </h4>
            <ul className="space-y-2 text-red-700">
              <li>• {t('policies.policy1')}</li>
              <li>• {t('policies.policy2')}</li>
              <li>• {t('policies.policy3')}</li>
              <li>• {t('policies.policy4')}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}