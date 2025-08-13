'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CheckCircleIcon, DocumentArrowDownIcon, AcademicCapIcon, BookOpenIcon } from '@heroicons/react/24/outline';

export function AdmissionsRequirements() {
  const t = useTranslations('admissions.requirements');
  const [activeStep, setActiveStep] = useState(1);

  const applicationSteps = [
    {
      id: 1,
      title: t('steps.step1.title'),
      description: t('steps.step1.description'),
      icon: DocumentArrowDownIcon,
    },
    {
      id: 2,
      title: t('steps.step2.title'),
      description: t('steps.step2.description'),
      icon: AcademicCapIcon,
    },
    {
      id: 3,
      title: t('steps.step3.title'),
      description: t('steps.step3.description'),
      icon: BookOpenIcon,
    },
    {
      id: 4,
      title: t('steps.step4.title'),
      description: t('steps.step4.description'),
      icon: CheckCircleIcon,
    },
  ];

  const academicRequirements = [
    t('academic.requirement1'),
    t('academic.requirement2'),
    t('academic.requirement3'),
    t('academic.requirement4'),
  ];

  const islamicRequirements = [
    t('islamic.requirement1'),
    t('islamic.requirement2'),
    t('islamic.requirement3'),
    t('islamic.requirement4'),
  ];

  const requiredDocuments = [
    t('documents.document1'),
    t('documents.document2'),
    t('documents.document3'),
    t('documents.document4'),
    t('documents.document5'),
    t('documents.document6'),
  ];

  const downloadableForms = [
    {
      name: t('forms.applicationForm'),
      url: '/forms/application-form.pdf',
      size: '2.5 MB',
    },
    {
      name: t('forms.medicalForm'),
      url: '/forms/medical-form.pdf',
      size: '1.2 MB',
    },
    {
      name: t('forms.guardianForm'),
      url: '/forms/guardian-consent.pdf',
      size: '800 KB',
    },
  ];

  return (
    <section className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 px-8 py-6 border-b">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {t('title')}
        </h2>
        <p className="text-gray-600">
          {t('subtitle')}
        </p>
      </div>

      <div className="p-8">
        {/* Admission Requirements */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Academic Requirements */}
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <AcademicCapIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">
                {t('academic.title')}
              </h3>
            </div>
            <ul className="space-y-3">
              {academicRequirements.map((requirement, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{requirement}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Islamic Knowledge Requirements */}
          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <BookOpenIcon className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">
                {t('islamic.title')}
              </h3>
            </div>
            <ul className="space-y-3">
              {islamicRequirements.map((requirement, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{requirement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Application Process Steps */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            {t('process.title')}
          </h3>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8">
            {applicationSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 cursor-pointer transition-colors ${
                    activeStep >= step.id
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-300 text-gray-500'
                  }`}
                  onClick={() => setActiveStep(step.id)}
                >
                  {step.id}
                </div>
                {index < applicationSteps.length - 1 && (
                  <div
                    className={`h-1 w-16 mx-2 ${
                      activeStep > step.id ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Details */}
          <div className="bg-gray-50 rounded-lg p-6">
            {applicationSteps.map((step) => (
              <div
                key={step.id}
                className={`${activeStep === step.id ? 'block' : 'hidden'}`}
              >
                <div className="flex items-center mb-4">
                  <step.icon className="h-8 w-8 text-primary-600 mr-3" />
                  <h4 className="text-xl font-semibold text-gray-900">
                    {step.title}
                  </h4>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Required Documents */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            {t('documents.title')}
          </h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="grid md:grid-cols-2 gap-4">
              {requiredDocuments.map((document, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{document}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Downloadable Forms */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            {t('forms.title')}
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {downloadableForms.map((form, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <DocumentArrowDownIcon className="h-8 w-8 text-red-600" />
                  <span className="text-sm text-gray-500">{form.size}</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{form.name}</h4>
                <button
                  onClick={() => window.open(form.url, '_blank')}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  {t('forms.download')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}