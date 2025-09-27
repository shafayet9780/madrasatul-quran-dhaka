'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import type { FormField } from '@/types/sanity';
import type { Language } from '@/types';
import { getLocalizedText } from '@/lib/multilingual-content';

interface DynamicFormFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  fieldKey?: string;
}

export default function DynamicFormField({ 
  field, 
  value, 
  onChange, 
  error,
  fieldKey
}: DynamicFormFieldProps) {
  const locale = useLocale() as Language;
  const [isFocused, setIsFocused] = useState(false);

  const label = field.label
    ? getLocalizedText(field.label, locale)
    : field.question
      ? getLocalizedText(field.question, locale)
      : '';
  const effectiveName = fieldKey || field.fieldName || field._key || '';
  const placeholder = field.placeholder ? getLocalizedText(field.placeholder, locale) : '';
  const helpText = field.helpText ? getLocalizedText(field.helpText, locale) : '';

  const handleChange = (newValue: any) => {
    onChange(newValue);
  };

  const renderField = () => {
    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <input
            type={field.fieldType}
            id={effectiveName}
            name={effectiveName}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            required={field.isRequired}
            className={`form-input w-full px-2.5 py-1.5 rounded-lg border-2 transition-colors duration-200 ${
              error 
                ? 'border-red-500 focus:border-red-500' 
                : isFocused 
                  ? 'border-primary-500 focus:border-primary-500' 
                  : 'border-gray-300 focus:border-primary-500'
            } focus:outline-none focus:ring-2 focus:ring-primary-200`}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={effectiveName}
            name={effectiveName}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            required={field.isRequired}
            rows={3}
            className={`form-textarea w-full px-2.5 py-1.5 rounded-lg border-2 transition-colors duration-200 resize-vertical ${
              error 
                ? 'border-red-500 focus:border-red-500' 
                : isFocused 
                  ? 'border-primary-500 focus:border-primary-500' 
                  : 'border-gray-300 focus:border-primary-500'
            } focus:outline-none focus:ring-2 focus:ring-primary-200`}
          />
        );

      case 'select':
        return (
          <select
            id={effectiveName}
            name={effectiveName}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            required={field.isRequired}
            className={`form-select w-full px-2.5 py-1.5 rounded-lg border-2 transition-colors duration-200 cursor-pointer ${
              error 
                ? 'border-red-500 focus:border-red-500' 
                : isFocused 
                  ? 'border-primary-500 focus:border-primary-500' 
                  : 'border-gray-300 focus:border-primary-500'
            } focus:outline-none focus:ring-2 focus:ring-primary-200`}
          >
            <option value="">{placeholder || 'Select an option'}</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option.value}>
                {getLocalizedText(option.label, locale)}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={effectiveName}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleChange(e.target.value)}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 cursor-pointer"
                />
                <span className="text-gray-700 font-medium">
                  {getLocalizedText(option.label, locale)}
                </span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-3">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name={effectiveName}
                  value={option.value}
                  checked={Array.isArray(value) ? value.includes(option.value) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleChange([...currentValues, option.value]);
                    } else {
                      handleChange(currentValues.filter(v => v !== option.value));
                    }
                  }}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                />
                <span className="text-gray-700 font-medium">
                  {getLocalizedText(option.label, locale)}
                </span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            id={effectiveName}
            name={effectiveName}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            required={field.isRequired}
            className={`form-input w-full px-2.5 py-1.5 rounded-lg border-2 transition-colors duration-200 cursor-pointer ${
              error 
                ? 'border-red-500 focus:border-red-500' 
                : isFocused 
                  ? 'border-primary-500 focus:border-primary-500' 
                  : 'border-gray-300 focus:border-primary-500'
            } focus:outline-none focus:ring-2 focus:ring-primary-200`}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            id={effectiveName}
            name={effectiveName}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            required={field.isRequired}
            className={`form-input w-full px-2.5 py-1.5 rounded-lg border-2 transition-colors duration-200 cursor-pointer ${
              error 
                ? 'border-red-500 focus:border-red-500' 
                : isFocused 
                  ? 'border-primary-500 focus:border-primary-500' 
                  : 'border-gray-300 focus:border-primary-500'
            } focus:outline-none focus:ring-2 focus:ring-primary-200`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            id={effectiveName}
            name={effectiveName}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            required={field.isRequired}
            className={`form-input w-full px-2.5 py-1.5 rounded-lg border-2 transition-colors duration-200 ${
              error 
                ? 'border-red-500 focus:border-red-500' 
                : isFocused 
                  ? 'border-primary-500 focus:border-primary-500' 
                  : 'border-gray-300 focus:border-primary-500'
            } focus:outline-none focus:ring-2 focus:ring-primary-200`}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name={effectiveName}
                value="yes"
                checked={value === 'yes'}
                onChange={(e) => handleChange(e.target.value)}
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 cursor-pointer"
              />
              <span className="text-gray-700 font-medium">
                {locale === 'bengali' ? 'হ্যাঁ' : 'Yes'}
              </span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name={effectiveName}
                value="no"
                checked={value === 'no'}
                onChange={(e) => handleChange(e.target.value)}
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 cursor-pointer"
              />
              <span className="text-gray-700 font-medium">
                {locale === 'bengali' ? 'না' : 'No'}
              </span>
            </label>
          </div>
        );

        case 'file':
          // Determine file type and validation rules
          // Handle both direct fileType property and nested structure
          let fileType = 'general';

          // Try to get fileType from different possible locations
          if ((field as any).fileType) {
            fileType = (field as any).fileType;
          } else if ((field as any)?.options?.fileType) {
            fileType = (field as any).options.fileType;
          } else if (field.fieldName) {
            // Fallback: determine fileType based on field name
            if (field.fieldName.includes('photo') || field.fieldName.includes('image')) {
              if (field.fieldName.includes('student')) {
                fileType = 'student-image';
              } else if (field.fieldName.includes('father')) {
                fileType = 'father-image';
              }
            } else if (field.fieldName.includes('birth') || field.fieldName.includes('certificate')) {
              fileType = 'student-birth-certificate';
            }
          }

          const isImageOnly = fileType === 'father-image' || fileType === 'student-image';
          const isDocument = fileType === 'student-birth-certificate';
          const isImage = fileType === 'father-image' || fileType === 'student-image';

          // Set file size limits
          let maxSize = 500 * 1024; // Default 500KB
          let maxSizeText = '500KB';

          if (isDocument) {
            maxSize = 3 * 1024 * 1024; // 3MB for PDFs
            maxSizeText = '3MB';
          }

          // Set accept attribute based on file type
          let accept = 'image/*';
          if (isDocument) {
            accept = 'image/*,application/pdf';
          } else if (isImageOnly) {
            accept = 'image/*';
          }

          return (
            <div className="space-y-3">
              {/* Smart Profile Picture Upload */}
              <div className="flex flex-col items-center space-y-3">
                {/* Profile Picture Preview */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-3 border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shadow-md">
                    {value && value instanceof File ? (
                      isImageOnly ? (
                        <img
                          src={URL.createObjectURL(value)}
                          alt="Profile Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center text-gray-400">
                          {isDocument ? (
                            // Birth Certificate - Document Icon
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9l-2 2-2-2" />
                            </svg>
                          ) : (
                            // Generic File Icon
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                          <p className="text-xs">
                            {isDocument
                              ? (locale === 'bengali' ? 'জন্ম নিবন্ধন' : 'Birth Certificate')
                              : (locale === 'bengali' ? 'ফাইল' : 'File')
                            }
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="text-center text-gray-400">
                        {isImageOnly ? (
                          // Person Icon for Images
                          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        ) : isDocument ? (
                          // Birth Certificate Icon
                          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9l-2 2-2-2" />
                          </svg>
                        ) : (
                          // Generic File Icon
                          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        <p className="text-[8px]">
                          {isImageOnly
                            ? (locale === 'bengali' ? 'ছবি যোগ করুন' : 'Add Photo')
                            : isDocument
                              ? (locale === 'bengali' ? 'জন্ম নিবন্ধন যোগ করুন' : 'Add Birth Certificate')
                              : (locale === 'bengali' ? 'ফাইল যোগ করুন' : 'Add File')
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Upload Button Overlay */}
                  <label
                    htmlFor={effectiveName}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md transition-colors duration-200"
                    title={
                      isImageOnly
                        ? (locale === 'bengali' ? 'ছবি আপলোড করুন' : 'Upload Photo')
                        : isDocument
                          ? (locale === 'bengali' ? 'জন্ম নিবন্ধন আপলোড করুন' : 'Upload Birth Certificate')
                          : (locale === 'bengali' ? 'ফাইল আপলোড করুন' : 'Upload File')
                    }
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </label>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  id={effectiveName}
                  name={effectiveName}
                  accept={accept}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file size
                      if (file.size > maxSize) {
                        const errorMsg = locale === 'bengali'
                          ? `ফাইলের আকার ${maxSizeText}-এর বেশি হতে পারবে না`
                          : `File size cannot exceed ${maxSizeText}`;
                        alert(errorMsg);
                        e.target.value = ''; // Clear the input
                        return;
                      }

                      // Validate file type
                      if (isImageOnly && !file.type.startsWith('image/')) {
                        alert(locale === 'bengali'
                          ? 'শুধুমাত্র ছবি ফাইল আপলোড করুন'
                          : 'Please upload image files only'
                        );
                        e.target.value = ''; // Clear the input
                        return;
                      }

                      if (isDocument && !file.type.startsWith('image/') && file.type !== 'application/pdf') {
                        alert(locale === 'bengali'
                          ? 'শুধুমাত্র ছবি বা PDF ফাইল আপলোড করুন'
                          : 'Please upload image or PDF files only'
                        );
                        e.target.value = ''; // Clear the input
                        return;
                      }

                      handleChange(file);
                    }
                  }}
                  // Don't use required attribute on file inputs - HTML file inputs can't be restored after re-render
                  // File validation is handled by the parent component's validateForm() function
                  className="hidden"
                />

                {/* File Info */}
                {value && value instanceof File && (
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      {value.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(value.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        handleChange(null);
                        const input = document.getElementById(effectiveName) as HTMLInputElement;
                        if (input) input.value = '';
                      }}
                      className="text-xs text-red-600 hover:text-red-700 underline"
                    >
                      {locale === 'bengali' ? 'ফাইল সরান' : 'Remove File'}
                    </button>
                  </div>
                )}

                {/* Upload Instructions */}
                <div className="text-center max-w-xs mx-auto">
                  <p className="text-xs text-gray-600 leading-relaxed text-center">
                    {isImageOnly
                      ? (locale === 'bengali'
                          ? `স্পষ্ট মুখের ছবি আপলোড করুন (সর্বোচ্চ ${maxSizeText}, JPG/PNG)`
                          : `Upload a clear photo of your face (Max ${maxSizeText}, JPG/PNG)`)
                      : isDocument
                        ? (locale === 'bengali'
                            ? `জন্ম নিবন্ধন আপলোড করুন (সর্বোচ্চ ${maxSizeText}, JPG/PNG/PDF)`
                            : `Upload birth certificate (Max ${maxSizeText}, JPG/PNG/PDF)`)
                        : (locale === 'bengali'
                            ? `ফাইল আপলোড করুন (সর্বোচ্চ ${maxSizeText})`
                            : `Upload file (Max ${maxSizeText})`)
                    }
                  </p>
                </div>
              </div>
            </div>
          );

      default:
        return (
          <input
            type="text"
            id={effectiveName}
            name={effectiveName}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            required={field.isRequired}
            className="form-input w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-colors duration-200"
          />
        );
    }
  };

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={effectiveName}
        className="block text-sm font-semibold text-gray-700 cursor-pointer"
      >
        {label}
        {field.fieldType === 'checkbox' && (
          <span className="text-xs font-normal text-gray-500 ml-2">
            ({locale === 'bengali' ? 'একাধিক নির্বাচন করা যাবে' : 'Multiple selection allowed'})
          </span>
        )}
        {field.isRequired && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      
      {renderField()}
      
      {helpText && (
        <p className="text-xs text-gray-600">{helpText}</p>
      )}
      
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
