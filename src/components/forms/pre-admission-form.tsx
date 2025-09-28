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
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [showTopProgress, setShowTopProgress] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

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
    ...(formConfig.additionalQuestions || []),
    ...formConfig.contactInfoFields
  ];

  // Get only required fields for progress calculation
  const requiredFields = allFormFields.filter(field => field.isRequired);
  const totalRequiredFields = requiredFields.length + 1; // +1 for declaration which is always required

  const isValueFilled = (val: any) => {
    if (val === undefined || val === null) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    if (val instanceof File) return true; // File objects are considered filled
    if (typeof val === 'object') return Object.keys(val).length > 0;
    return true;
  };

  const getFieldKey = (field: any, index?: number): string => {
    if (field.fieldName) return field.fieldName;
    if (field._key) return field._key;
    
    // For general questions without fieldName, generate a key based on question text or index
    if (field.question) {
      // Always use English text for field key generation to match Google Sheets script
      const questionText = getLocalizedText(field.question, 'english');
      // Create a safe key from the question text - must match Google Sheets script exactly
      const cleanText = questionText.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const fieldKey = `general_${cleanText}_${index || 0}`;
      
      
      return fieldKey;
    }
    
    return `field_${index || 0}`;
  };

  // Generate field order for Google Sheets (matches header order)
  const getFieldOrder = (): string[] => {
    const fieldOrder: string[] = [];
    
    // Add timestamp first to match Google Sheets header order
    fieldOrder.push('timestamp');
    
    // Add general questions
    formConfig.generalQuestions.forEach((field, index) => {
      const key = getFieldKey(field, index);
      if (key) fieldOrder.push(key);
    });
    
    // Add student info fields
    formConfig.studentInfoFields.forEach((field, index) => {
      const key = getFieldKey(field, index);
      if (key) fieldOrder.push(key);
    });
    
    // Add father fields
    formConfig.parentInfoFields.fatherFields.forEach((field, index) => {
      const key = getFieldKey(field, index);
      if (key) fieldOrder.push(key);
    });
    
    // Add mother fields
    formConfig.parentInfoFields.motherFields.forEach((field, index) => {
      const key = getFieldKey(field, index);
      if (key) fieldOrder.push(key);
    });

    // Add additional questions
    if (formConfig.additionalQuestions) {
      formConfig.additionalQuestions.forEach((field, index) => {
        const key = getFieldKey(field, index);
        if (key) fieldOrder.push(key);
      });
    }

    // Add contact fields
    formConfig.contactInfoFields.forEach((field, index) => {
      const key = getFieldKey(field, index);
      if (key) fieldOrder.push(key);
    });
    
    // Add declaration
    fieldOrder.push('declaration');
    
    return fieldOrder;
  };

  // Count only completed required fields
  const completedRequiredFields = requiredFields.reduce((acc, field, index) => {
    const key = getFieldKey(field, index);
    const value = key ? formData[key] : undefined;
    return acc + (isValueFilled(value) ? 1 : 0);
  }, 0);

  // Add declaration if completed
  const declarationCompleted = formData.declaration ? 1 : 0;
  const totalCompletedFields = completedRequiredFields + declarationCompleted;

  const progressPercentage = totalRequiredFields > 0 ? (totalCompletedFields / totalRequiredFields) * 100 : 0;

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
      ...(formConfig.additionalQuestions || []),
      ...formConfig.contactInfoFields
    ];

    allFields.forEach((field, index) => {
      if (field.isRequired) {
        const key = getFieldKey(field, index);
        const value = key ? formData[key] : undefined;
        if (!isValueFilled(value)) {
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

  // Upload files to storage and return URLs
  const uploadFiles = async (data: FormData): Promise<{ [key: string]: string }> => {
    const uploadedUrls: { [key: string]: string } = {};

    for (const [key, value] of Object.entries(data)) {
      if (value instanceof File) {
        const formData = new FormData();
        formData.append('file', value);

        // Find the field configuration to determine file type and person name
        let fileType = 'general';
        let personName = 'unknown';

        // Search through all form sections to find the field
        const allFields = [
          ...formConfig.generalQuestions,
          ...formConfig.studentInfoFields,
          ...formConfig.parentInfoFields.fatherFields,
          ...formConfig.parentInfoFields.motherFields,
          ...(formConfig.additionalQuestions || []),
          ...formConfig.contactInfoFields
        ];

        const fieldConfig = allFields.find((field, index) => getFieldKey(field, index) === key);

        if (fieldConfig) {
          fileType = fieldConfig.fileType || 'general';

          // For all file uploads related to student admission, use student's name as the prefix
          const studentName = (data as any).student_name_english || (data as any).student_name || 'student';
          
          if (formConfig.studentInfoFields.some((field, idx) => getFieldKey(field, idx) === key)) {
            // Student field - use student's name
            personName = studentName;
          } else if (formConfig.parentInfoFields.fatherFields.some((field, idx) => getFieldKey(field, idx) === key)) {
            // Father field - use student's name (since it's part of student's admission file)
            personName = studentName;
          } else if (formConfig.parentInfoFields.motherFields.some((field, idx) => getFieldKey(field, idx) === key)) {
            // Mother field - use student's name (since it's part of student's admission file)
            personName = studentName;
          } else if ((formConfig.additionalQuestions || []).some((field, idx) => getFieldKey(field, idx) === key)) {
            // Additional questions - use student's name
            personName = studentName;
          } else {
            // Default fallback
            personName = studentName;
          }
        }

        formData.append('fileType', fileType);
        formData.append('personName', personName);

        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();
          if (result.success) {
            uploadedUrls[key] = result.url;
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } catch (error) {
          console.error(`Error uploading ${key}:`, error);
          throw new Error(`Failed to upload ${key}`);
        }
      }
    }

    return uploadedUrls;
  };

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setShowPreview(true);
    // Scroll to top when showing preview
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // First, upload any files
      setIsUploadingFiles(true);
      const uploadedUrls = await uploadFiles(formData);
      setIsUploadingFiles(false);

      // Prepare data for Google Sheets (replace files with URLs)
      const submissionData = { ...formData };
      Object.entries(uploadedUrls).forEach(([key, url]) => {
        submissionData[key] = url;
      });

      const result = await submitToGoogleSheets(submissionData, {
        spreadsheetId: formConfig.formSettings.googleSheetsId,
        autoDetectRange: true, // Automatically detect range based on headers
        fieldOrder: getFieldOrder()
      }, formConfig); // Pass form configuration for option value-to-label conversion

      if (result.success) {
        setSubmitStatus('success');
        setSubmitMessage(successMessage);
        setFormData({}); // Clear form
        setShowPreview(false);
        // Scroll to top after successful submission
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSubmitStatus('error');
        setSubmitMessage(result.error || 'Submission failed');
      }
    } catch (error) {
      setIsUploadingFiles(false);
      setSubmitStatus('error');
      setSubmitMessage(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPreviewSection = (title: string, fields: any[], sectionKey: string) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 sm:p-5 md:p-6 relative overflow-hidden transition-all duration-300 hover:shadow-xl mb-4 sm:mb-6">
      {/* Section accent border with gradient */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700"></div>
      
      {/* Section background pattern */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
        <svg viewBox="0 0 100 100" className="w-full h-full text-primary-600">
          <circle cx="50" cy="50" r="40" fill="currentColor" />
        </svg>
      </div>

      <div className="relative">
        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-primary-100 flex items-center">
          <span className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-3 py-1 rounded-full text-xs font-bold mr-3 shadow-md">
            {sectionKey === 'general' ? '1' : sectionKey === 'student' ? '2' : sectionKey === 'father' ? '3' : sectionKey === 'mother' ? '4' : '5'}
          </span>
          <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            {title}
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field, index) => {
            const key = getFieldKey(field, index);
            const value = key ? formData[key] : undefined;
            
            if (!value || (Array.isArray(value) && value.length === 0)) {
              return null; // Don't show empty fields in preview
            }

            let displayValue = '';
            let isFileField = false;
            if (value instanceof File) {
              displayValue = `📎 ${value.name} (${(value.size / 1024).toFixed(1)} KB)`;
              isFileField = true;
            } else if (Array.isArray(value)) {
              // For checkboxes, convert values to labels
              if (field.fieldType === 'checkbox' && field.options) {
                const selectedLabels = value.map(val => {
                  const option = field.options?.find(opt => opt.value === val);
                  return option ? getLocalizedText(option.label, locale) : val;
                });
                displayValue = selectedLabels.join(', ');
              } else {
                displayValue = value.join(', ');
              }
            } else if (typeof value === 'boolean') {
              displayValue = value ? (locale === 'bengali' ? 'হ্যাঁ' : 'Yes') : (locale === 'bengali' ? 'না' : 'No');
            } else {
              // For select/radio fields, convert value to label
              if ((field.fieldType === 'select' || field.fieldType === 'radio') && field.options) {
                const selectedOption = field.options.find(opt => opt.value === value);
                displayValue = selectedOption ? getLocalizedText(selectedOption.label, locale) : String(value);
              } else {
                displayValue = String(value);
              }
            }

            const label = field.label
              ? getLocalizedText(field.label, locale)
              : field.question
                ? getLocalizedText(field.question, locale)
                : '';

            return (
              <div
                key={`${sectionKey}-${index}`}
                className={`${field.fieldType === 'textarea' || field.fieldType === 'file' ? 'md:col-span-2' : ''} transition-all duration-200 `}
              >
                <div className="bg-gray-50 rounded-lg p-2 sm:p-2.5 border border-gray-200 hover:border-gray-300 transition-all duration-200">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-bold text-gray-800">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2"></div>
                      {label}
                    </label>
                    <div className="p-2.5 bg-white rounded-lg border border-gray-100 shadow-sm">
                      {isFileField && value instanceof File ? (
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-20 h-20 rounded-full border-2 border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shadow-sm">
                            <img
                              src={URL.createObjectURL(value)}
                              alt="Profile Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-gray-800 break-words font-medium text-sm text-center">{displayValue}</p>
                        </div>
                      ) : (
                        <p className="text-gray-800 break-words font-medium text-sm">{displayValue}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderFormSection = (title: string, fields: any[], sectionKey: string) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 sm:p-5 md:p-6 relative overflow-hidden transition-all duration-300 hover:shadow-xl mb-4 sm:mb-6">
      {/* Section accent border with gradient */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700"></div>
      
      {/* Section background pattern */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
        <svg viewBox="0 0 100 100" className="w-full h-full text-primary-600">
          <circle cx="50" cy="50" r="40" fill="currentColor" />
        </svg>
      </div>

      <div className="relative">
        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-primary-100 flex items-center">
          <span className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-3 py-1 rounded-full text-xs font-bold mr-3 shadow-md">
            {sectionKey === 'general' ? '1' : sectionKey === 'student' ? '2' : sectionKey === 'father' ? '3' : sectionKey === 'mother' ? '4' : '5'}
          </span>
          <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            {title}
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field, index) => {
            const key = getFieldKey(field, index);
            return (
              <div
                key={`${sectionKey}-${index}`}
                className={`${field.fieldType === 'textarea' || field.fieldType === 'file' ? 'md:col-span-2' : ''} transition-all duration-200 `}
              >
                <div className="bg-gray-50 rounded-lg p-2 sm:p-2.5 border border-gray-100 hover:border-primary-200 transition-colors duration-200">
                  <DynamicFormField
                    field={field}
                    value={key ? formData[key] : undefined}
                    onChange={(value) => key && handleFieldChange(key, value)}
                    error={key ? errors[key] : ''}
                    fieldKey={key}
                  />
                </div>
              </div>
            );
          })}
        </div>
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

  if (showPreview) {
    return (
      <div className="max-w-4xl mx-auto p-3 sm:p-6 pb-20 sm:pb-28">
        {/* Clean Preview Header */}
        <div className="text-center mb-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-primary-700 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-600">
                    {locale === 'bengali' 
                      ? 'আপনার আবেদনটি পর্যালোচনা করুন। সব কিছু সঠিক হলে জমা দিন।' 
                      : 'Please review your application below. Submit if everything looks correct.'
                    }
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 inline-block shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-800 font-semibold text-sm">
                    {locale === 'bengali'
                      ? 'সব তথ্য সঠিক হলে "জমা দিন" বাটনে ক্লিক করুন'
                      : 'Click "Submit Application" if all information is correct'
                    }
                  </p>
                </div>
              </div>
            </div>
        </div>

        {/* Preview Content */}
        <div className="space-y-4 sm:space-y-6">
          {/* General Questions */}
          {formConfig.generalQuestions.length > 0 && (
            renderPreviewSection(
              locale === 'bengali' ? 'সাধারণ প্রশ্ন' : 'General Questions',
              formConfig.generalQuestions,
              'general'
            )
          )}

          {/* Student Information */}
          {formConfig.studentInfoFields.length > 0 && (
            renderPreviewSection(
              locale === 'bengali' ? 'শিক্ষার্থীর তথ্য' : 'Student Information',
              formConfig.studentInfoFields,
              'student'
            )
          )}

          {/* Father's Information */}
          {formConfig.parentInfoFields.fatherFields.length > 0 && (
            renderPreviewSection(
              locale === 'bengali' ? 'পিতার তথ্য' : 'Father\'s Information',
              formConfig.parentInfoFields.fatherFields,
              'father'
            )
          )}

          {/* Mother's Information */}
          {formConfig.parentInfoFields.motherFields.length > 0 && (
            renderPreviewSection(
              locale === 'bengali' ? 'মাতার তথ্য' : 'Mother\'s Information',
              formConfig.parentInfoFields.motherFields,
              'mother'
            )
          )}

          {/* Additional Information */}
          {formConfig.additionalQuestions.length > 0 && (
            renderPreviewSection(
              locale === 'bengali' ? 'অতিরিক্ত তথ্য' : 'Additional Information',
              formConfig.additionalQuestions,
              'additional'
            )
          )}

          {/* Contact Information */}
          {formConfig.contactInfoFields.length > 0 && (
            renderPreviewSection(
              locale === 'bengali' ? 'যোগাযোগের ঠিকানা' : 'Contact Information',
              formConfig.contactInfoFields,
              'contact'
            )
          )}

          {/* Declaration */}
          {formData.declaration && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {locale === 'bengali' ? '✅ চূড়ান্ত ঘোষণা' : '✅ Final Declaration'}
              </h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700">
                  {locale === 'bengali' 
                    ? 'আমি উপরে প্রদত্ত সকল তথ্য সঠিক ও সত্য বলে ঘোষণা করছি।'
                    : 'I declare that all the information provided above is correct and true.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Preview Actions */}
        <div className="text-center mt-8 space-y-4">
          {submitStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-red-500 inline mr-2" />
              <span className="text-red-700">{submitMessage}</span>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setShowPreview(false);
                // Scroll to top when editing
                window.scrollTo({ top: 100, behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200 cursor-pointer"
            >
              {locale === 'bengali' ? 'সম্পাদনা করুন' : 'Edit Application'}
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isUploadingFiles}
              className="px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isUploadingFiles ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {locale === 'bengali' ? 'ছবি আপলোড হচ্ছে...' : 'Uploading files...'}
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {locale === 'bengali' ? 'জমা দেওয়া হচ্ছে...' : 'Submitting...'}
                </>
              ) : (
                locale === 'bengali' ? 'আবেদন জমা দিন' : 'Submit Application'
              )}
            </button>
          </div>
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
    <div className="max-w-4xl mx-auto p-3 sm:p-6 pb-20 sm:pb-28">
      {/* Clean Form Header */}
      <div className="text-center mb-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-left">
                {formDescription && (
                  <p className="text-sm text-gray-600">
                    {formDescription}
                  </p>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-primary-50 border border-blue-200 rounded-xl p-3 inline-block shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-blue-800 font-semibold text-sm">
                  {locale === 'bengali'
                    ? `জমা দেওয়ার শেষ তারিখ: ${submissionDate.toLocaleDateString('bn-BD')}`
                    : `Submission Deadline: ${submissionDate.toLocaleDateString('en-US')}`
                  }
                </p>
              </div>
            </div>
        </div>
      </div>


      {/* Fixed Bottom Progress Bar (visible after threshold) */}
      {!showTopProgress && (
      <div className="fixed left-0 right-0 bottom-0 z-20 px-4 pb-4 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="bg-white/95 shadow-2xl border border-primary-200 rounded-full px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm font-medium text-gray-700">
                {locale === 'bengali' ? 'অগ্রগতি' : 'Progress'}
              </span>
              <span className={`text-xs md:text-sm font-semibold ${progressPercentage >= 100 ? 'text-green-600' : 'text-primary-700'}`}>
                {totalCompletedFields} / {totalRequiredFields} • {Math.round(progressPercentage)}%
                {progressPercentage >= 100 && (
                  <span className="ml-1">✓</span>
                )}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-700 ease-out ${
                  progressPercentage >= 100 
                    ? 'bg-gradient-to-r from-green-500 to-green-600' 
                    : 'bg-gradient-to-r from-primary-500 to-primary-600'
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Form */}
      <form onSubmit={handlePreview} className="space-y-4 sm:space-y-8">
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

        {/* Additional Information */}
        {formConfig.additionalQuestions.length > 0 && (
          renderFormSection(
            locale === 'bengali' ? 'অতিরিক্ত তথ্য' : 'Additional Information',
            formConfig.additionalQuestions,
            'additional'
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
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
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
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-1 cursor-pointer"
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

        {/* Preview Button */}
        <div className="text-center">
          {submitStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 inline mr-2" />
              <span className="text-red-700">{submitMessage}</span>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting || isUploadingFiles}
            className="text-lg px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {locale === 'bengali' ? 'আবেদন পর্যালোচনা করুন' : 'Preview Application'}
          </button>
          
          <p className="text-sm text-gray-600 mt-4">
            {locale === 'bengali' 
              ? 'আপনার আবেদনটি জমা দেওয়ার আগে পর্যালোচনা করার সুযোগ পাবেন।'
              : 'You will have a chance to review your application before submitting.'
            }
          </p>
        </div>
      </form>
    </div>
  );
}
