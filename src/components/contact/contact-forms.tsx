'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Send, CheckCircle, AlertCircle, MessageSquare, GraduationCap, MessageCircle } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  category: string;
  message: string;
}

interface FormErrors {
  [key: string]: string;
}

type FormType = 'general' | 'admission' | 'feedback';

const FormTypeSelector = ({ 
  activeForm, 
  onFormChange 
}: { 
  activeForm: FormType; 
  onFormChange: (type: FormType) => void;
}) => {
  const t = useTranslations('contact.forms');

  const formTypes = [
    {
      type: 'general' as FormType,
      icon: <MessageSquare className="w-5 h-5" />,
      title: t('general.title'),
      subtitle: t('general.subtitle')
    },
    {
      type: 'admission' as FormType,
      icon: <GraduationCap className="w-5 h-5" />,
      title: t('admission.title'),
      subtitle: t('admission.subtitle')
    },
    {
      type: 'feedback' as FormType,
      icon: <MessageCircle className="w-5 h-5" />,
      title: t('feedback.title'),
      subtitle: t('feedback.subtitle')
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {formTypes.map((form) => (
        <button
          key={form.type}
          onClick={() => onFormChange(form.type)}
          className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
            activeForm === form.type
              ? 'border-primary-500 bg-primary-50 text-primary-900'
              : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-25'
          }`}
        >
          <div className="flex items-center mb-2">
            <div className={`mr-3 ${activeForm === form.type ? 'text-primary-600' : 'text-gray-500'}`}>
              {form.icon}
            </div>
            <h3 className="font-semibold">{form.title}</h3>
          </div>
          <p className="text-sm opacity-80">{form.subtitle}</p>
        </button>
      ))}
    </div>
  );
};

const ContactForm = ({ formType }: { formType: FormType }) => {
  const t = useTranslations('contact.forms');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    category: '',
    message: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Simple honeypot field for spam protection
  const [honeypot, setHoneypot] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('fields.required');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('fields.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('fields.required');
    }

    if (!formData.subject.trim()) {
      newErrors.subject = t('fields.required');
    }

    if (!formData.category) {
      newErrors.category = t('fields.required');
    }

    if (!formData.message.trim()) {
      newErrors.message = t('fields.required');
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check honeypot for spam protection
    if (honeypot) {
      return; // Likely spam, silently ignore
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would send the form data to your backend
      console.log('Form submitted:', { formType, ...formData });
      
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        category: '',
        message: ''
      });
    } catch (error) {
      console.error('Form submission error:', error);
      // Handle error (show error message to user)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {t('success.title')}
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {t('success.message')}
        </p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
        >
          {t('success.newMessage')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Honeypot field - hidden from users */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            {t('fields.name')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder={t('fields.namePlaceholder')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {t('fields.email')} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder={t('fields.emailPlaceholder')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            {t('fields.phone')} <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder={t('fields.phonePlaceholder')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.phone}
            </p>
          )}
        </div>

        {/* Category Field */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            {t('fields.category')} <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 ${
              errors.category ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">{t('fields.categoryPlaceholder')}</option>
            <option value="general">{t('fields.categories.general')}</option>
            <option value="admission">{t('fields.categories.admission')}</option>
            <option value="academic">{t('fields.categories.academic')}</option>
            <option value="facilities">{t('fields.categories.facilities')}</option>
            <option value="fees">{t('fields.categories.fees')}</option>
            <option value="events">{t('fields.categories.events')}</option>
            <option value="other">{t('fields.categories.other')}</option>
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.category}
            </p>
          )}
        </div>
      </div>

      {/* Subject Field */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
          {t('fields.subject')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="subject"
          value={formData.subject}
          onChange={(e) => handleInputChange('subject', e.target.value)}
          placeholder={t('fields.subjectPlaceholder')}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 ${
            errors.subject ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.subject && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.subject}
          </p>
        )}
      </div>

      {/* Message Field */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          {t('fields.message')} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          rows={6}
          value={formData.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
          placeholder={t('fields.messagePlaceholder')}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 resize-vertical ${
            errors.message ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.message && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('fields.submitting')}
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {t('fields.submit')}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default function ContactForms() {
  const [activeForm, setActiveForm] = useState<FormType>('general');

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Get in Touch
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the type of inquiry below and fill out the form. We'll get back to you as soon as possible.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <FormTypeSelector 
            activeForm={activeForm} 
            onFormChange={setActiveForm} 
          />
          
          <ContactForm formType={activeForm} />
        </div>
      </div>
    </section>
  );
}