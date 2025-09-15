'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { PreAdmissionForm } from '@/types/sanity';
import type { Language } from '@/types';
import { getLocalizedText } from '@/lib/multilingual-content';
import { submitToGoogleSheets } from '@/lib/google-sheets';
import DynamicFormField from './dynamic-form-field';

interface PreAdmissionFormProps {
  formConfig: PreAdmissionForm;
}

interface FormData {
  [key: string]: any;
}

interface FormErrors {
  [key: string]: string;
}

export default function PreAdmissionForm({ formConfig }: PreAdmissionFormProps) {
  const locale = useLocale() as Language;
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [showTopProgress, setShowTopProgress] = useState(true);

  // NOTE: Do not early-return before hooks; we gate rendering later

  const formTitle = getLocalizedText(formConfig.formSettings.formTitle, locale);
  const formDescription = formConfig.formSettings.formDescription
    ? getLocalizedText(formConfig.formSettings.formDescription, locale)
    : '';
  const declarationText = getLocalizedText(formConfig.declarationText, locale);
  const successMessage = getLocalizedText(formConfig.successMessage, locale);

  // Calculate field-based progress (completed fields vs total fields)
  const allFormFields = [
    ...formConfig.generalQuestions,
    ...formConfig.studentInfoFields,
    ...formConfig.parentInfoFields.fatherFields,
    ...formConfig.parentInfoFields.motherFields,
    ...formConfig.contactInfoFields
  ];

  const totalFields = allFormFields.length;

  const isValueFilled = (val: any) => {
    if (val === undefined || val === null) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'object') return Object.keys(val).length > 0; // unlikely here
    return true;
  };

  const getFieldKey = (field: any): string => field.fieldName || field._key || '';

  const completedFields = allFormFields.reduce((acc, field) => {
    const key = getFieldKey(field);
    const value = key ? formData[key] : undefined;
    return acc + (isValueFilled(value) ? 1 : 0);
  }, 0);

  const progressPercentage = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;

  // Check if submission date has passed
  const submissionDate = new Date(formConfig.formSettings.submissionDate);
  const isSubmissionClosed = new Date() > submissionDate;

  // Toggle progress bars based on scroll position
  useEffect(() => {
    const threshold = 240; // px from top to switch bars
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const nearTop = window.scrollY < threshold;
          setShowTopProgress(nearTop);
          ticking = false;
        });
        ticking = true;
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Validate all form fields
    const allFields = [
      ...formConfig.generalQuestions,
      ...formConfig.studentInfoFields,
      ...formConfig.parentInfoFields.fatherFields,
      ...formConfig.parentInfoFields.motherFields,
      ...formConfig.contactInfoFields
    ];

    allFields.forEach(field => {
      if (field.isRequired) {
        const key = getFieldKey(field);
        const value = key ? formData[key] : undefined;
        if (!value || (Array.isArray(value) && value.length === 0)) {
          if (key) {
            newErrors[key] = locale === 'bengali' 
            ? 'এই ক্ষেত্রটি আবশ্যক' 
            : 'This field is required';
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const result = await submitToGoogleSheets(formData, {
        spreadsheetId: formConfig.formSettings.googleSheetsId,
        range: 'A:Z' // Adjust range as needed
      });

      if (result.success) {
        setSubmitStatus('success');
        setSubmitMessage(successMessage);
        setFormData({}); // Clear form
      } else {
        setSubmitStatus('error');
        setSubmitMessage(result.error || 'Submission failed');
      }
    } catch (_error) {
      setSubmitStatus('error');
      setSubmitMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormSection = (title: string, fields: any[], sectionKey: string) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8 relative overflow-hidden">
      {/* Section accent border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600"></div>

      <h3 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b-2 border-gray-100 flex items-center">
        <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-semibold mr-3">
          {sectionKey === 'general' ? '1' : sectionKey === 'student' ? '2' : sectionKey === 'father' ? '3' : sectionKey === 'mother' ? '4' : '5'}
        </span>
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {fields.map((field, index) => {
          const key = getFieldKey(field);
          return (
            <div
              key={`${sectionKey}-${index}`}
              className={field.fieldType === 'textarea' ? 'md:col-span-2' : ''}
            >
              <DynamicFormField
                field={field}
                value={key ? formData[key] : undefined}
                onChange={(value) => key && handleFieldChange(key, value)}
                error={key ? errors[key] : ''}
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isSubmissionClosed) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-800 mb-2">
            {locale === 'bengali' ? 'আবেদনের সময় শেষ' : 'Application Period Closed'}
          </h2>
          <p className="text-red-600">
            {locale === 'bengali' 
              ? `আবেদনের শেষ তারিখ ছিল: ${submissionDate.toLocaleDateString('bn-BD')}`
              : `Application deadline was: ${submissionDate.toLocaleDateString('en-US')}`
            }
          </p>
        </div>
      </div>
    );
  }

  if (submitStatus === 'success') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-800 mb-4">
            {locale === 'bengali' ? 'আবেদন সফল' : 'Application Submitted Successfully'}
          </h2>
          <p className="text-green-600 mb-6">{submitMessage}</p>
          <button
            onClick={() => {
              setSubmitStatus('idle');
              setFormData({});
            }}
            className="btn-primary"
          >
            {locale === 'bengali' ? 'নতুন আবেদন' : 'Submit Another Application'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 pb-28">
      {/* Form Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          {formTitle}
        </h1>
        {formDescription && (
          <p className="text-lg text-gray-600 mb-4">{formDescription}</p>
        )}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
          <p className="text-blue-800 font-semibold">
            {locale === 'bengali'
              ? `জমা দেওয়ার তারিখ: ${submissionDate.toLocaleDateString('bn-BD')}`
              : `Submission Deadline: ${submissionDate.toLocaleDateString('en-US')}`
            }
          </p>
        </div>
      </div>

      {/* Progress Indicator - Top (visible near top only) */}
      {showTopProgress && (
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-xl border-2 border-primary-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3 animate-pulse"></div>
              {locale === 'bengali' ? 'অগ্রগতি' : 'Progress'}
            </h2>
            <span className="text-sm font-medium text-primary-700 bg-primary-50 px-3 py-1 rounded-full">
              {completedFields} / {totalFields} {locale === 'bengali' ? 'ক্ষেত্র পূরণ' : 'fields complete'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-4 rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              {locale === 'bengali' ? 'শুরু' : 'Start'}
            </span>
            <span className="font-semibold text-primary-700">
              {Math.round(progressPercentage)}% {locale === 'bengali' ? 'সম্পূর্ণ' : 'complete'}
            </span>
            <span className="text-gray-600">
              {locale === 'bengali' ? 'শেষ' : 'Finish'}
            </span>
          </div>
        </div>
      </div>
      )}

      {/* Fixed Bottom Progress Bar (visible after threshold) */}
      {!showTopProgress && (
      <div className="fixed left-0 right-0 bottom-0 z-20 px-4 pb-4 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="bg-white/95 shadow-2xl border border-primary-200 rounded-full px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm font-medium text-gray-700">
                {locale === 'bengali' ? 'অগ্রগতি' : 'Progress'}
              </span>
              <span className="text-xs md:text-sm font-semibold text-primary-700">
                {completedFields} / {totalFields} • {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Questions */}
        {formConfig.generalQuestions.length > 0 && (
          renderFormSection(
            locale === 'bengali' ? 'সাধারণ প্রশ্ন' : 'General Questions',
            formConfig.generalQuestions,
            'general'
          )
        )}

        {/* Student Information */}
        {formConfig.studentInfoFields.length > 0 && (
          renderFormSection(
            locale === 'bengali' ? 'শিক্ষার্থীর তথ্য' : 'Student Information',
            formConfig.studentInfoFields,
            'student'
          )
        )}

        {/* Father's Information */}
        {formConfig.parentInfoFields.fatherFields.length > 0 && (
          renderFormSection(
            locale === 'bengali' ? 'পিতার তথ্য' : 'Father\'s Information',
            formConfig.parentInfoFields.fatherFields,
            'father'
          )
        )}

        {/* Mother's Information */}
        {formConfig.parentInfoFields.motherFields.length > 0 && (
          renderFormSection(
            locale === 'bengali' ? 'মাতার তথ্য' : 'Mother\'s Information',
            formConfig.parentInfoFields.motherFields,
            'mother'
          )
        )}

        {/* Contact Information */}
        {formConfig.contactInfoFields.length > 0 && (
          renderFormSection(
            locale === 'bengali' ? 'যোগাযোগের ঠিকানা' : 'Contact Information',
            formConfig.contactInfoFields,
            'contact'
          )
        )}

        {/* Declaration */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            {locale === 'bengali' ? '✅ চূড়ান্ত ঘোষণা' : '✅ Final Declaration'}
          </h3>
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {declarationText}
            </p>
          </div>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.declaration || false}
              onChange={(e) => handleFieldChange('declaration', e.target.checked)}
              required
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-1"
            />
            <span className="text-gray-700 font-medium">
              {locale === 'bengali' 
                ? 'আমি উপরে প্রদত্ত সকল তথ্য সঠিক ও সত্য বলে ঘোষণা করছি।'
                : 'I declare that all the information provided above is correct and true.'
              }
            </span>
          </label>
          {errors.declaration && (
            <p className="text-sm text-red-600 mt-2">{errors.declaration}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="text-center">
          {submitStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 inline mr-2" />
              <span className="text-red-700">{submitMessage}</span>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                {locale === 'bengali' ? 'জমা দেওয়া হচ্ছে...' : 'Submitting...'}
              </>
            ) : (
              locale === 'bengali' ? 'আবেদন জমা দিন' : 'Submit Application'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
