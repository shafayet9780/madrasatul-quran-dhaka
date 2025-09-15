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
}

export default function DynamicFormField({ 
  field, 
  value, 
  onChange, 
  error 
}: DynamicFormFieldProps) {
  const locale = useLocale() as Language;
  const [isFocused, setIsFocused] = useState(false);

  const label = field.label
    ? getLocalizedText(field.label, locale)
    : field.question
      ? getLocalizedText(field.question, locale)
      : '';
  const effectiveName = field.fieldName || field._key || '';
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
            className={`form-input w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
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
            rows={4}
            className={`form-textarea w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 resize-vertical ${
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
            className={`form-select w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
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
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
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
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
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
            className={`form-input w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
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
            className={`form-input w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
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
            className={`form-input w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
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
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
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
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <span className="text-gray-700 font-medium">
                {locale === 'bengali' ? 'না' : 'No'}
              </span>
            </label>
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
            className="form-input w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label 
        htmlFor={effectiveName}
        className="block text-sm font-semibold text-gray-700"
      >
        {label}
        {field.isRequired && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      
      {renderField()}
      
      {helpText && (
        <p className="text-sm text-gray-600">{helpText}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
